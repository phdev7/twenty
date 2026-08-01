import { useState } from 'react';

import { useInboxConversationFieldMutations } from '@/inbox/hooks/useInboxConversationFieldMutations';
import { useInboxConversationTasks } from '@/inbox/hooks/useInboxConversationTasks';
import { useInboxNotesAndMentions } from '@/inbox/hooks/useInboxNotesAndMentions';
import {
  type InboxConversation,
  type InboxMention,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';

export const useInboxConversationMutations = ({
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
}: {
  selectedConversation: InboxConversation | null;
  conversations: InboxConversation[];
  teams: InboxTeam[];
  workspaceMembers: InboxWorkspaceMember[];
  currentWorkspaceMemberId: string | null;
  pendingMentions: InboxMention[];
  conversationMentions: InboxMention[];
  recordConversationEvent: (input: {
    conversationId: string;
    eventType: string;
    summary: string;
    details?: string | null;
  }) => Promise<boolean>;
  refetchMentions: () => Promise<void>;
  refetchMessages: () => Promise<unknown>;
}) => {
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const {
    toggleConversationLabel,
    setConversationAssignee,
    setConversationTeam,
    setConversationPriority,
    setConversationStatus,
    snoozeConversation,
  } = useInboxConversationFieldMutations({
    selectedConversation,
    conversations,
    teams,
    workspaceMembers,
    recordConversationEvent,
    setBusyAction,
  });

  const { saveInternalNote, resolveMention, selectConversationSideEffects } =
    useInboxNotesAndMentions({
      selectedConversation,
      workspaceMembers,
      currentWorkspaceMemberId,
      pendingMentions,
      conversationMentions,
      recordConversationEvent,
      refetchMentions,
      refetchMessages,
      setBusyAction,
    });

  const { createConversationTask, completeConversationTask } =
    useInboxConversationTasks({
      selectedConversation,
      teams,
      workspaceMembers,
      recordConversationEvent,
      setBusyAction,
    });

  return {
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
  };
};
