import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type DashboardGlobalFilters } from '@/page-layout/dashboard/contexts/DashboardGlobalFiltersContext';
import { FieldMetadataType } from 'twenty-shared/types';

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

export const getDashboardDateRange = ({
  period,
  customStartDate,
  customEndDate,
}: DashboardGlobalFilters) => {
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
      Number.isNaN(customEnd.getTime()) ||
      customStart > customEnd
    ) {
      return null;
    }

    return { start: customStart, end: customEnd };
  }

  return { start, end };
};

export const pickDashboardDateField = (fields: FieldMetadataItem[]) =>
  pickFieldByPriority(
    fields,
    DATE_FIELD_PRIORITY,
    (field) =>
      field.type === FieldMetadataType.DATE ||
      field.type === FieldMetadataType.DATE_TIME,
  );

export const pickDashboardWorkspaceMemberField = (
  fields: FieldMetadataItem[],
) =>
  pickFieldByPriority(
    fields,
    USER_FIELD_PRIORITY,
    (field) =>
      field.type === FieldMetadataType.RELATION &&
      field.relation?.targetObjectMetadata.nameSingular === 'workspaceMember',
  );

export const formatDashboardDateFilterValue = (
  date: Date,
  field: FieldMetadataItem,
) =>
  field.type === FieldMetadataType.DATE
    ? date.toISOString().slice(0, 10)
    : date.toISOString();
