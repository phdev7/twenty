import { useCallback, useEffect, useState } from 'react';

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
    hasMoreConversations,
    loadMoreConversations,
    isLoadingConversations,
    isSearching,
    refetchConversations,
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

  const { conversationMentions, pendingMentions, refetchMentions } =
    useInboxMentionsQuery({
      selectedConversationId,
      currentWorkspaceMemberId,
    });

  const { conversationEvents, recordConversationEvent } =
    useInboxConversationActivity({
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
        ...(selectedConversationId
          ? [refetchMessages(), refetchMentions()]
          : []),
      ]);
    },
    [
      pullProviderMessages,
      refetchConversations,
      refetchMessages,
      refetchMentions,
      selectedConversationId,
    ],
  );

  const {
    triageResult,
    triageConversation,
    syncTwentyEmail,
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
    async (conversationId: string): Promise<void> => {
      setSelectedConversationId(conversationId);

      const conversation = conversations.find(
        ({ id }) => id === conversationId,
      );

      await selectConversationSideEffects(conversation);
    },
    [conversations, selectConversationSideEffects, setSelectedConversationId],
  );

  // Nothing pushes provider messages down to the front, so a live conversation
  // only stays live if the inbox re-reads on its own. One request at a time,
  // otherwise a slow round trip stacks up behind the next tick. The functional
  // updater reads the latest in-flight flag even though the interval callback
  // closure is set up once, so this needs no ref.
  const [, setIsPolling] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsPolling((wasPolling) => {
        if (wasPolling) {
          return wasPolling;
        }

        void refreshInbox({ pullProvider: true }).finally(() =>
          setIsPolling(false),
        );

        return true;
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
    loadMoreConversations,
    hasOlderMessages,
    loadOlderMessages,
    loadMessageMedia,
    conversationMentions,
    pendingMentions,
    currentWorkspaceMemberId,
    isLoadingConversations,
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
    syncTwentyEmail,
    configureEvolution,
    triageConversation,
  };
};
