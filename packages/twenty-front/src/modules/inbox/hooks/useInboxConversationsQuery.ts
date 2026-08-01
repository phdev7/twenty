import { useCallback, useEffect, useMemo, useState } from 'react';

import { inboxConversationGqlFields } from '@/inbox/graphql/inboxRecordGqlFields';
import { INBOX_CONVERSATION_PAGE_SIZE } from '@/inbox/constants/INBOX_CONVERSATION_PAGE_SIZE';
import { INBOX_SEARCH_DEBOUNCE_MS } from '@/inbox/constants/INBOX_SEARCH_DEBOUNCE_MS';
import { INBOX_SEARCH_PAGE_SIZE } from '@/inbox/constants/INBOX_SEARCH_PAGE_SIZE';
import {
  type InboxAttentionFilter,
  type InboxConversation,
  type InboxConversationFilter,
} from '@/inbox/types/inboxEntityTypes';
import { buildInboxConversationServerFilter } from '@/inbox/utils/buildInboxConversationServerFilter';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

export const useInboxConversationsQuery = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<InboxConversationFilter>('ACTIVE');
  const [assigneeFilterId, setAssigneeFilterId] = useState('ALL');
  const [teamFilterId, setTeamFilterId] = useState('ALL');
  const [attentionFilter, setAttentionFilter] =
    useState<InboxAttentionFilter>('ALL');
  const [conversationLimit, setConversationLimit] = useState(
    INBOX_CONVERSATION_PAGE_SIZE,
  );
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [cachedSelectedConversation, setCachedSelectedConversation] =
    useState<InboxConversation | null>(null);
  const [reopenedSnoozeKeys, setReopenedSnoozeKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const { updateOneRecord } = useUpdateOneRecord();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, INBOX_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // A new search or status starts from the first page again.
  useEffect(() => {
    setConversationLimit(INBOX_CONVERSATION_PAGE_SIZE);
  }, [assigneeFilterId, attentionFilter, debouncedQuery, filter, teamFilterId]);

  const searchTerm = debouncedQuery.trim();
  const serverFilter = useMemo(
    () =>
      buildInboxConversationServerFilter({
        filter,
        searchTerm,
        assigneeFilterId,
        teamFilterId,
        attentionFilter,
      }),
    [assigneeFilterId, attentionFilter, filter, searchTerm, teamFilterId],
  );

  const {
    records: conversations,
    totalCount,
    loading: isLoadingConversations,
    error,
    refetch,
  } = useFindManyRecords<InboxConversation & { __typename: string }>({
    objectNameSingular: 'inboxConversation',
    filter: serverFilter,
    orderBy: [{ lastMessageAt: 'DescNullsLast' }],
    limit: searchTerm.length > 0 ? INBOX_SEARCH_PAGE_SIZE : conversationLimit,
    recordGqlFields: inboxConversationGqlFields,
    fetchPolicy: 'cache-and-network',
  });

  // The provider does not always signal a snooze deadline passing, so a
  // conversation that should have woken up gets nudged back to OPEN as soon
  // as it is loaded rather than waiting for a scheduled job.
  useEffect(() => {
    const expiredSnoozes = conversations
      .filter(
        (conversation) =>
          conversation.status === 'SNOOZED' &&
          typeof conversation.snoozedUntil === 'string' &&
          new Date(conversation.snoozedUntil).getTime() <= Date.now(),
      )
      .map((conversation) => ({
        conversation,
        snoozeKey: `${conversation.id}:${conversation.snoozedUntil}`,
      }))
      .filter(({ snoozeKey }) => !reopenedSnoozeKeys.has(snoozeKey));

    if (expiredSnoozes.length === 0) {
      return;
    }

    setReopenedSnoozeKeys((current) => {
      const next = new Set(current);

      for (const { snoozeKey } of expiredSnoozes) {
        next.add(snoozeKey);
      }

      return next;
    });

    void Promise.all(
      expiredSnoozes.map(({ conversation, snoozeKey }) =>
        updateOneRecord({
          objectNameSingular: 'inboxConversation',
          idToUpdate: conversation.id,
          updateOneRecordInput: { status: 'OPEN', snoozedUntil: null },
        }).catch(() => {
          setReopenedSnoozeKeys((current) => {
            const next = new Set(current);

            next.delete(snoozeKey);

            return next;
          });
        }),
      ),
    );
  }, [conversations, reopenedSnoozeKeys, updateOneRecord]);

  // Only ever fill an empty selection. A conversation an operator opened
  // stays open even when a filter or a page no longer contains it —
  // otherwise every refresh yanks them out of what they were reading.
  useEffect(() => {
    if (selectedConversationId === null && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const selectedConversation = useMemo(() => {
    const fromCurrentPage =
      conversations.find(({ id }) => id === selectedConversationId) ?? null;

    if (fromCurrentPage) {
      return fromCurrentPage;
    }

    if (selectedConversationId === null) {
      return null;
    }

    return cachedSelectedConversation?.id === selectedConversationId
      ? cachedSelectedConversation
      : null;
  }, [cachedSelectedConversation, conversations, selectedConversationId]);

  // The open conversation has to survive a filter change, a search and a page
  // that no longer lists it: the last loaded copy is kept so the thread keeps
  // rendering what the operator is working on.
  useEffect(() => {
    if (selectedConversation) {
      setCachedSelectedConversation(selectedConversation);
    } else if (selectedConversationId === null) {
      setCachedSelectedConversation(null);
    }
  }, [selectedConversation, selectedConversationId]);

  const hasMoreConversations = conversations.length < (totalCount ?? 0);

  const loadMoreConversations = useCallback(() => {
    setConversationLimit(
      (currentLimit) => currentLimit + INBOX_CONVERSATION_PAGE_SIZE,
    );
  }, []);

  return {
    conversations,
    conversationTotalCount: totalCount ?? 0,
    hasMoreConversations,
    loadMoreConversations,
    isLoadingConversations,
    isSearching: query.trim() !== debouncedQuery.trim(),
    conversationsError: error,
    refetchConversations: refetch,
    query,
    setQuery,
    filter,
    setFilter,
    assigneeFilterId,
    setAssigneeFilterId,
    teamFilterId,
    setTeamFilterId,
    attentionFilter,
    setAttentionFilter,
    selectedConversationId,
    setSelectedConversationId,
    selectedConversation,
  };
};
