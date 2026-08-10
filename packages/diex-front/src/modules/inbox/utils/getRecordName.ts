import { type InboxRecordReference } from '@/inbox/types/inboxEntityTypes';

export const getRecordName = (
  record: InboxRecordReference | null | undefined,
): string => {
  if (record === null || record === undefined) {
    return '';
  }

  if (typeof record.name === 'string') {
    return record.name;
  }

  return [record.name?.firstName, record.name?.lastName]
    .filter((part): part is string => Boolean(part))
    .join(' ');
};
