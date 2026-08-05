import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { DashboardGlobalFiltersContext } from '@/page-layout/dashboard/contexts/DashboardGlobalFiltersContext';
import { useContext, useMemo } from 'react';
import {
  type ChartFilter,
  type ChartRecordFilter,
  FieldMetadataType,
  type ViewFilterOperand,
} from 'twenty-shared/types';
import { ViewFilterOperand as FilterOperand } from 'twenty-shared/types';

type ChartConfigurationWithFilter = {
  filter?: ChartFilter | null;
};

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

const pickFieldByPriority = (
  fields: FieldMetadataItem[],
  priority: string[],
  predicate: (field: FieldMetadataItem) => boolean,
) =>
  [...fields]
    .filter((field) => field.isActive && predicate(field))
    .sort((fieldA, fieldB) => {
      const priorityA = priority.indexOf(fieldA.name);
      const priorityB = priority.indexOf(fieldB.name);

      return (
        (priorityA === -1 ? priority.length : priorityA) -
        (priorityB === -1 ? priority.length : priorityB)
      );
    })[0];

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

const formatDateFilterValue = (date: Date, field: FieldMetadataItem) =>
  field.type === FieldMetadataType.DATE
    ? date.toISOString().slice(0, 10)
    : date.toISOString();

const buildRecordFilter = ({
  field,
  value,
  operand,
}: {
  field: FieldMetadataItem;
  value: string;
  operand: ViewFilterOperand;
}): ChartRecordFilter => ({
  fieldMetadataId: field.id,
  value,
  type: field.type,
  operand,
});

export const useDashboardFilteredChartConfiguration = <
  T extends ChartConfigurationWithFilter,
>({
  objectMetadataItemId,
  configuration,
}: {
  objectMetadataItemId: string;
  configuration: T;
}): T => {
  const { filters, isEnabled } = useContext(DashboardGlobalFiltersContext);
  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataItemId,
  });

  return useMemo(() => {
    if (!isEnabled) {
      return configuration;
    }

    const globalRecordFilters: ChartRecordFilter[] = [];
    const dateRange = getDateRange(filters);
    const dateField = pickFieldByPriority(
      objectMetadataItem.fields,
      DATE_FIELD_PRIORITY,
      (field) =>
        field.type === FieldMetadataType.DATE ||
        field.type === FieldMetadataType.DATE_TIME,
    );

    if (dateRange && dateField) {
      globalRecordFilters.push(
        buildRecordFilter({
          field: dateField,
          value: formatDateFilterValue(dateRange.start, dateField),
          operand: FilterOperand.IS_AFTER,
        }),
        buildRecordFilter({
          field: dateField,
          value: formatDateFilterValue(dateRange.end, dateField),
          operand: FilterOperand.IS_BEFORE,
        }),
      );
    }

    const workspaceMemberField = pickFieldByPriority(
      objectMetadataItem.fields,
      USER_FIELD_PRIORITY,
      (field) =>
        field.type === FieldMetadataType.RELATION &&
        field.relation?.targetObjectMetadata.nameSingular === 'workspaceMember',
    );

    if (filters.workspaceMemberId && workspaceMemberField) {
      globalRecordFilters.push(
        buildRecordFilter({
          field: workspaceMemberField,
          value: JSON.stringify({
            isCurrentWorkspaceMemberSelected: false,
            selectedRecordIds: [filters.workspaceMemberId],
          }),
          operand: FilterOperand.IS,
        }),
      );
    }

    return {
      ...configuration,
      filter: {
        ...(configuration.filter ?? {}),
        recordFilters: [
          ...(configuration.filter?.recordFilters ?? []),
          ...globalRecordFilters,
        ],
      },
    };
  }, [configuration, filters, isEnabled, objectMetadataItem.fields]);
};
