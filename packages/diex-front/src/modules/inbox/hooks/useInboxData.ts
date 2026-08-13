import { useCallback, useEffect, useRef } from 'react';

import { INBOX_POLL_INTERVAL_MS } from '@/inbox/constants/INBOX_POLL_INTERVAL_MS';
import { useInboxConversationActivity } from '@/inbox/hooks/useInboxConversationActivity';
import { useInboxConversationMutations } from '@/inbox/hooks/useInboxConversationMutations';
import { useInboxConversationsQuery } from '@/inbox/hooks/useInboxConversationsQuery';
import { useInboxExternalMessaging } from '@/inbox/hooks/useInboxExternalMessaging';
import { useInboxMacroActions } from '@/inbox/hooks/useInboxMacroActions';
import { useInboxMentionsQuery } from '@/inbox/hooks/useInboxMentionsQuery';
import { useInboxMessagesQuery } from '@/inbox/hooks/useInboxMessagesQuery';
import { useInboxReferenceData } from '@/inbox/hooks/useInboxReferenceData';
import { useInboxSavedReplyActions } from '@/inbox/hooks/useInboxSavedReplyActions';
import { usePullInboxProviderMessages } from '@/inbox/hooks/usePullInboxProviderMessages';

export const useInboxData = () => {
  const {
    conversations,
    conversationTotalCount,
    workspaceConversationTotalCount,
    isLoadingWorkspaceConversationCount,
    workspaceConversationCountError,
    hasMoreConversations,
    loadMoreConversations,
    isLoadingConversations,
    conversationsError,
    isSearching,
    refetchConversations,
    refetchWorkspaceConversationCount,
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
  } = useInboxConversationsQuery();

  const {
    savedReplies,
    macros,
    labels,
    workspaceMembers,
    teams,
    currentWorkspaceMemberId,
  } = useInboxReferenceData();

  const {
    messages,
    isLoadingMessages,
    hasOlderMessages,
    loadOlderMessages,
    refetchMessages,
  } = useInboxMessagesQuery(selectedConversationId);

  const {
    conversationMentions,
    pendingMentions,
    arePendingMentionsLoaded,
    refetchMentions,
  } = useInboxMentionsQuery({
    selectedConversationId,
    currentWorkspaceMemberId,
  });

  const {
    conversationEvents,
    recordConversationEvent,
    refetchConversationEvents,
  } = useInboxConversationActivity({
    selectedConversationId,
    currentWorkspaceMemberId,
  });

  const {
    busyAction,
    setBusyAction,
    toggleConversationLabel,
    setConversationAssignee,
    setConversationTeam,
    setConversationPriority,
    setConversationStatus,
    snoozeConversation,
    saveInternalNote,
    resolveMention,
    selectConversationSideEffects,
    createConversationTask,
    completeConversationTask,
  } = useInboxConversationMutations({
    selectedConversation,
    conversations,
    teams,
    workspaceMembers,
    currentWorkspaceMemberId,
    pendingMentions,
    conversationMentions,
    recordConversationEvent,
    refetchMentions,
    refetchMessages,
  });

  const { applySavedReply } = useInboxSavedReplyActions({
    selectedConversation,
  });

  const { previewInboxMacro, applyInboxMacro } = useInboxMacroActions({
    selectedConversation,
    conversations,
    labels,
    macros,
    teams,
    workspaceMembers,
    recordConversationEvent,
    refetchMessages,
    setBusyAction,
  });

  const pullProviderMessages = usePullInboxProviderMessages();

  const refreshInbox = useCallback(
    async (options?: { pullProvider?: boolean }): Promise<void> => {
      if (options?.pullProvider === true) {
        await pullProviderMessages();
      }

      await Promise.all([
        refetchConversations(),
        refetchWorkspaceConversationCount(),
        ...(selectedConversationId
          ? [refetchMessages(), refetchMentions(), refetchConversationEvents()]
          : []),
      ]);
    },
    [
      pullProviderMessages,
      refetchConversations,
      refetchWorkspaceConversationCount,
      refetchConversationEvents,
      refetchMessages,
      refetchMentions,
      selectedConversationId,
    ],
  );

  const {
    triageResult,
    triageConversation,
    syncDiexEmail,
    previewExternalMessage,
    confirmExternalMessage,
    configureEvolution,
    loadMessageMedia,
  } = useInboxExternalMessaging({
    selectedConversation,
    teams,
    currentWorkspaceMemberId,
    recordConversationEvent,
    refreshInbox,
    setBusyAction,
  });

  const selectConversation = useCallback(
    (conversationId: string): void => {
      setSelectedConversationId(conversationId);
    },
    [setSelectedConversationId],
  );

  // A failed optimistic mark-as-read may roll the cache back. Track the
  // conversation operation and each concrete mention separately, so rollback
  // cannot retry forever while mentions loaded after auto-selection still get
  // one attempt.
  // oxlint-disable-next-line diex/no-state-useref
  const readSideEffectsStateRef = useRef<{
    conversationId: string;
    conversationReadAttempted: boolean;
    attemptedMentionIds: Set<string>;
  } | null>(null);
  // oxlint-disable-next-line diex/no-state-useref
  const selectedConversationIdRef = useRef(selectedConversationId);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;

    return () => {
      if (selectedConversationIdRef.current === selectedConversationId) {
        selectedConversationIdRef.current = null;
      }
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId === null) {
      readSideEffectsStateRef.current = null;

      return;
    }

    const conversation =
      conversations.find(({ id }) => id === selectedConversationId) ??
      selectedConversation ??
      undefined;

    if (conversation === undefined) {
      return;
    }

    if (
      readSideEffectsStateRef.current?.conversationId !== selectedConversationId
    ) {
      readSideEffectsStateRef.current = {
        conversationId: selectedConversationId,
        conversationReadAttempted: false,
        attemptedMentionIds: new Set(),
      };
    }

    const readState = readSideEffectsStateRef.current;
    const markConversationAsRead =
      !readState.conversationReadAttempted && conversation.unreadCount > 0;

    readState.conversationReadAttempted = true;

    const unreadMentions = arePendingMentionsLoaded
      ? pendingMentions.filter(
          (mention) =>
            mention.inboxConversation?.id === selectedConversationId &&
            mention.mentionedWorkspaceMember?.id === currentWorkspaceMemberId &&
            mention.status === 'UNREAD' &&
            !readState.attemptedMentionIds.has(mention.id),
        )
      : [];

    for (const mention of unreadMentions) {
      readState.attemptedMentionIds.add(mention.id);
    }

    if (!markConversationAsRead && unreadMentions.length === 0) {
      return;
    }

    void selectConversationSideEffects({
      conversation,
      markConversationAsRead,
      unreadMentions,
      isSelectionCurrent: () =>
        selectedConversationIdRef.current === selectedConversationId,
    });
  }, [
    arePendingMentionsLoaded,
    conversations,
    currentWorkspaceMemberId,
    pendingMentions,
    selectConversationSideEffects,
    selectedConversation,
    selectedConversationId,
  ]);

  // Nothing pushes provider messages down to the front, so a live conversation
  // only stays live if the inbox re-reads on its own. One request at a time,
  // otherwise a slow round trip stacks up behind the next tick.
  // oxlint-disable-next-line diex/no-state-useref
  const isPollingRef = useRef(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;

      void refreshInbox({ pullProvider: true })
        .catch(() => undefined)
        .finally(() => {
          isPollingRef.current = false;
        });
    }, INBOX_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refreshInbox]);

  return {
    conversations,
    savedReplies,
    macros,
    labels,
    workspaceMembers,
    teams,
    selectedConversation,
    selectedConversationId,
    messages,
    conversationEvents,
    query,
    setQuery,
    filter,
    setFilter,
    isSearching,
    assigneeFilterId,
    setAssigneeFilterId,
    teamFilterId,
    setTeamFilterId,
    attentionFilter,
    setAttentionFilter,
    hasMoreConversations,
    conversationTotalCount,
    workspaceConversationTotalCount,
    isLoadingWorkspaceConversationCount,
    workspaceConversationCountError,
    loadMoreConversations,
    hasOlderMessages,
    loadOlderMessages,
    loadMessageMedia,
    conversationMentions,
    pendingMentions,
    currentWorkspaceMemberId,
    isLoadingConversations,
    conversationsError,
    isLoadingMessages,
    busyAction,
    triageResult,
    refreshInbox,
    selectConversation,
    applySavedReply,
    previewInboxMacro,
    applyInboxMacro,
    toggleConversationLabel,
    setConversationAssignee,
    setConversationTeam,
    setConversationPriority,
    createConversationTask,
    completeConversationTask,
    setConversationStatus,
    snoozeConversation,
    saveInternalNote,
    resolveMention,
    previewExternalMessage,
    confirmExternalMessage,
    syncDiexEmail,
    configureEvolution,
    triageConversation,
  };
};
