import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

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
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

const DEEP_LINK_CONVERSATION_PARAM = 'conversationId';

export const useInboxConversationsQuery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  // Seeded from the URL so opening WhatsApp from a person record lands on that
  // thread instead of whatever sits at the top of the list.
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(() => searchParams.get(DEEP_LINK_CONVERSATION_PARAM));
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

  // The deep link is consumed once. Leaving it in the URL would drag the
  // operator back to this thread on every reload, undoing later selections.
  useEffect(() => {
    if (!searchParams.has(DEEP_LINK_CONVERSATION_PARAM)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete(DEEP_LINK_CONVERSATION_PARAM);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const isSelectionOnCurrentPage =
    selectedConversationId !== null &&
    conversations.some(({ id }) => id === selectedConversationId);
  const isSelectionCached =
    cachedSelectedConversation?.id === selectedConversationId;

  // A conversation just opened from a person record has no messages yet, and
  // the list is ordered DescNullsLast, so it sorts to the very bottom and is
  // usually not on the first page. Fetching it directly keeps the thread from
  // rendering empty.
  const { record: directlyFetchedRecord } = useFindOneRecord({
    objectNameSingular: 'inboxConversation',
    objectRecordId: selectedConversationId ?? undefined,
    recordGqlFields: inboxConversationGqlFields,
    skip:
      selectedConversationId === null ||
      isSelectionOnCurrentPage ||
      isSelectionCached,
  });
  const directlyFetchedConversation =
    (directlyFetchedRecord as InboxConversation | undefined) ?? null;

  const selectedConversation = useMemo(() => {
    const fromCurrentPage =
      conversations.find(({ id }) => id === selectedConversationId) ?? null;

    if (fromCurrentPage) {
      return fromCurrentPage;
    }

    if (selectedConversationId === null) {
      return null;
    }

    if (cachedSelectedConversation?.id === selectedConversationId) {
      return cachedSelectedConversation;
    }

    return directlyFetchedConversation?.id === selectedConversationId
      ? directlyFetchedConversation
      : null;
  }, [
    cachedSelectedConversation,
    conversations,
    directlyFetchedConversation,
    selectedConversationId,
  ]);

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
