import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { DashboardGlobalFiltersContext } from '@/page-layout/dashboard/contexts/DashboardGlobalFiltersContext';
import {
  formatDashboardDateFilterValue,
  getDashboardDateRange,
  pickDashboardDateField,
  pickDashboardWorkspaceMemberField,
} from '@/page-layout/dashboard/utils/dashboardGlobalFilterUtils';
import { useContext, useMemo } from 'react';
import {
  type ChartFilter,
  type ChartRecordFilter,
  type ViewFilterOperand,
  ViewFilterOperand as FilterOperand,
} from 'twenty-shared/types';

type ChartConfigurationWithFilter = {
  filter?: ChartFilter | null;
};

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
    const dateRange = getDashboardDateRange(filters);
    const dateField = pickDashboardDateField(objectMetadataItem.fields);

    if (dateRange && dateField) {
      globalRecordFilters.push(
        buildRecordFilter({
          field: dateField,
          value: formatDashboardDateFilterValue(dateRange.start, dateField),
          operand: FilterOperand.IS_AFTER,
        }),
        buildRecordFilter({
          field: dateField,
          value: formatDashboardDateFilterValue(dateRange.end, dateField),
          operand: FilterOperand.IS_BEFORE,
        }),
      );
    }

    const workspaceMemberField = pickDashboardWorkspaceMemberField(
      objectMetadataItem.fields,
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
