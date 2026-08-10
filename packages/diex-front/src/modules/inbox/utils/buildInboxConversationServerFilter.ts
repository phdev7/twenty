import { type RecordGqlOperationFilter } from 'diex-shared/types';

import {
  type InboxAttentionFilter,
  type InboxConversationFilter,
} from '@/inbox/types/inboxEntityTypes';

export const buildInboxConversationServerFilter = ({
  filter,
  searchTerm,
  assigneeFilterId,
  teamFilterId,
  attentionFilter,
}: {
  filter: InboxConversationFilter;
  searchTerm: string;
  assigneeFilterId: string;
  teamFilterId: string;
  attentionFilter: InboxAttentionFilter;
}): RecordGqlOperationFilter => {
  const serverFilters: RecordGqlOperationFilter[] = [
    filter === 'ACTIVE'
      ? { status: { in: ['OPEN', 'PENDING'] } }
      : { status: { eq: filter } },
  ];

  if (searchTerm.length > 0) {
    serverFilters.push({
      or: [
        { name: { ilike: `%${searchTerm}%` } },
        { contactHandle: { ilike: `%${searchTerm}%` } },
        { lastMessagePreview: { ilike: `%${searchTerm}%` } },
      ],
    });
  }

  if (assigneeFilterId !== 'ALL') {
    serverFilters.push(
      assigneeFilterId === 'UNASSIGNED'
        ? { assigneeId: { is: 'NULL' } }
        : { assigneeId: { eq: assigneeFilterId } },
    );
  }

  if (teamFilterId !== 'ALL') {
    serverFilters.push(
      teamFilterId === 'UNASSIGNED'
        ? { inboxTeamId: { is: 'NULL' } }
        : { inboxTeamId: { eq: teamFilterId } },
    );
  }

  if (attentionFilter === 'UNREAD') {
    serverFilters.push({ unreadCount: { gt: 0 } });
  }

  if (attentionFilter === 'SLA_BREACHED') {
    serverFilters.push({ slaBreachedAt: { is: 'NOT_NULL' } });
  }

  if (attentionFilter === 'URGENT') {
    serverFilters.push({ priority: { in: ['HIGH', 'URGENT'] } });
  }

  if (attentionFilter === 'FOLLOW_UP_DUE') {
    serverFilters.push({ followUpDueAt: { lte: new Date().toISOString() } });
  }

  return { and: serverFilters };
};
