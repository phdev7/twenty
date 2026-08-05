import { useContext } from 'react';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { flattenedFieldMetadataItemsSelector } from '@/object-metadata/states/flattenedFieldMetadataItemsSelector';
import { turnSortsIntoOrderBy } from '@/object-record/object-sort-dropdown/utils/turnSortsIntoOrderBy';
import { currentRecordFilterGroupsComponentState } from '@/object-record/record-filter-group/states/currentRecordFilterGroupsComponentState';
import { useFilterValueDependencies } from '@/object-record/record-filter/hooks/useFilterValueDependencies';
import { anyFieldFilterValueComponentState } from '@/object-record/record-filter/states/anyFieldFilterValueComponentState';
import { currentRecordFiltersComponentState } from '@/object-record/record-filter/states/currentRecordFiltersComponentState';
import { useCurrentRecordGroupDefinition } from '@/object-record/record-group/hooks/useCurrentRecordGroupDefinition';
import { useRecordGroupFilter } from '@/object-record/record-group/hooks/useRecordGroupFilter';
import { currentRecordSortsComponentState } from '@/object-record/record-sort/states/currentRecordSortsComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { DashboardGlobalFiltersContext } from '@/page-layout/dashboard/contexts/DashboardGlobalFiltersContext';
import { FieldMetadataType } from 'twenty-shared/types';
import {
  combineFilters,
  computeRecordGqlOperationFilter,
  turnAnyFieldFilterIntoRecordGqlFilter,
} from 'twenty-shared/utils';

const DATE_FIELD_PRIORITY = [
  'createdAt',
  'closeDate',
  'dueAt',
  'capturedAt',
  'lastMessageAt',
  'renewalDate',
  'nextReviewAt',
  'updatedAt',
];

const USER_FIELD_PRIORITY = [
  'owner',
  'assignee',
  'accountOwner',
  'successManager',
  'reviewer',
];

const getDateRange = ({
  period,
  customStartDate,
  customEndDate,
}: {
  period: string;
  customStartDate: string;
  customEndDate: string;
}) => {
  if (period === 'ALL') {
    return null;
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);

  if (period === 'LAST_7_DAYS') start.setDate(start.getDate() - 6);
  if (period === 'LAST_30_DAYS') start.setDate(start.getDate() - 29);
  if (period === 'LAST_90_DAYS') start.setDate(start.getDate() - 89);
  if (period === 'THIS_YEAR') start.setMonth(0, 1);

  if (period === 'CUSTOM') {
    if (!customStartDate || !customEndDate) return null;

    const customStart = new Date(`${customStartDate}T00:00:00`);
    const customEnd = new Date(`${customEndDate}T23:59:59.999`);

    if (
      Number.isNaN(customStart.getTime()) ||
      Number.isNaN(customEnd.getTime())
    ) {
      return null;
    }

    return { start: customStart, end: customEnd };
  }

  return { start, end };
};

export const useFindManyRecordIndexTableParams = (
  objectNameSingular: string,
  instanceId?: string,
) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });
  const { objectMetadataItems } = useObjectMetadataItems();

  const { isEnabled, filters } = useContext(DashboardGlobalFiltersContext);

  const { recordGroupFilter } = useRecordGroupFilter(
    objectMetadataItem?.fields,
  );

  const currentRecordGroupDefinition = useCurrentRecordGroupDefinition();

  const currentRecordFilterGroups = useAtomComponentStateValue(
    currentRecordFilterGroupsComponentState,
    instanceId,
  );

  const currentRecordSorts = useAtomComponentStateValue(
    currentRecordSortsComponentState,
    instanceId,
  );

  const currentRecordFilters = useAtomComponentStateValue(
    currentRecordFiltersComponentState,
    instanceId,
  );

  const { filterValueDependencies } = useFilterValueDependencies();

  const flattenedFieldMetadataItems = useAtomStateValue(
    flattenedFieldMetadataItemsSelector,
  );

  const currentFilters = computeRecordGqlOperationFilter({
    fieldMetadataItems: flattenedFieldMetadataItems,
    recordFilterGroups: currentRecordFilterGroups,
    recordFilters: currentRecordFilters,
    filterValueDependencies,
  });

  const anyFieldFilterValue = useAtomComponentStateValue(
    anyFieldFilterValueComponentState,
    instanceId,
  );

  const { recordGqlOperationFilter: anyFieldFilter } =
    turnAnyFieldFilterIntoRecordGqlFilter({
      fields: objectMetadataItem?.fields ?? [],
      filterValue: anyFieldFilterValue,
    });

  const orderBy = turnSortsIntoOrderBy(
    objectMetadataItem,
    currentRecordSorts,
    objectMetadataItems,
  );

  const dashboardFiltersList: any[] = [];

  if (isEnabled && objectMetadataItem?.fields) {
    const dateRange = getDateRange(filters);
    const dateField = [...objectMetadataItem.fields]
      .filter((field) => field.isActive && (field.type === FieldMetadataType.DATE || field.type === FieldMetadataType.DATE_TIME))
      .sort((fieldA, fieldB) => {
        const priorityA = DATE_FIELD_PRIORITY.indexOf(fieldA.name);
        const priorityB = DATE_FIELD_PRIORITY.indexOf(fieldB.name);
        return (
          (priorityA === -1 ? DATE_FIELD_PRIORITY.length : priorityA) -
          (priorityB === -1 ? DATE_FIELD_PRIORITY.length : priorityB)
        );
      })[0];

    if (dateRange && dateField) {
      dashboardFiltersList.push({
        [dateField.name]: {
          gte: dateField.type === FieldMetadataType.DATE
            ? dateRange.start.toISOString().slice(0, 10)
            : dateRange.start.toISOString(),
          lte: dateField.type === FieldMetadataType.DATE
            ? dateRange.end.toISOString().slice(0, 10)
            : dateRange.end.toISOString(),
        }
      });
    }

    const workspaceMemberField = [...objectMetadataItem.fields]
      .filter((field) => field.isActive && field.type === FieldMetadataType.RELATION && field.relation?.targetObjectMetadata.nameSingular === 'workspaceMember')
      .sort((fieldA, fieldB) => {
        const priorityA = USER_FIELD_PRIORITY.indexOf(fieldA.name);
        const priorityB = USER_FIELD_PRIORITY.indexOf(fieldB.name);
        return (
          (priorityA === -1 ? USER_FIELD_PRIORITY.length : priorityA) -
          (priorityB === -1 ? USER_FIELD_PRIORITY.length : priorityB)
        );
      })[0];

    if (filters.workspaceMemberId && workspaceMemberField) {
      dashboardFiltersList.push({
        [`${workspaceMemberField.name}Id`]: {
          eq: filters.workspaceMemberId
        }
      });
    }
  }

  const combinedFilter = combineFilters([
    currentFilters,
    recordGroupFilter,
    anyFieldFilter,
    ...dashboardFiltersList,
  ]);

  return {
    objectNameSingular,
    filter: combinedFilter,
    orderBy,
    // If we have a current record group definition, we only want to fetch 8 records by page
    ...(currentRecordGroupDefinition ? { limit: 8 } : {}),
  };
};
