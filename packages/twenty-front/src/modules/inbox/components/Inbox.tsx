import { useMemo, useState } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { InboxConversationList } from '@/inbox/components/InboxConversationList';
import { InboxConversationThread } from '@/inbox/components/InboxConversationThread';
import { InboxCrmContext } from '@/inbox/components/InboxCrmContext';
import { useInboxData } from '@/inbox/hooks/useInboxData';
import { getRecordName } from '@/inbox/utils/getRecordName';

const StyledGrid = styled.div`
  background: ${themeCssVariables.background.primary};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  display: grid;
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  grid-template-columns: minmax(270px, 0.9fr) minmax(420px, 1.7fr) minmax(
      260px,
      0.9fr
    );
  min-height: 0;
  min-width: 980px;
  overflow: hidden;
  width: 100%;
`;

const normalizeSearchTerm = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

export const Inbox = () => {
  const [labelFilterId, setLabelFilterId] = useState('ALL');
  const {
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
    syncTwentyEmail,
    configureEvolution,
    triageConversation,
  } = useInboxData();

  const pendingMentionCounts = useMemo(
    () =>
      pendingMentions.reduce<Record<string, number>>((counts, mention) => {
        const conversationId = mention.inboxConversation?.id;

        if (conversationId) {
          counts[conversationId] = (counts[conversationId] ?? 0) + 1;
        }

        return counts;
      }, {}),
    [pendingMentions],
  );

  const visibleConversations = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(query);

    // Status, search, assignee, team and the attention filters are answered
    // by the query. What is left here is what the query cannot express: a
    // label lives in a child table, and a pending mention is counted per
    // member.
    return conversations.filter((conversation) => {
      const matchesLabel =
        labelFilterId === 'ALL' ||
        conversation.labelAssignments.some(
          (assignment) =>
            assignment.isActive && assignment.inboxLabel.id === labelFilterId,
        );

      if (!matchesLabel) {
        return false;
      }

      if (
        attentionFilter === 'MENTIONED' &&
        (pendingMentionCounts[conversation.id] ?? 0) === 0
      ) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      const searchableContent = [
        conversation.name,
        conversation.contactHandle,
        conversation.lastMessagePreview,
        getRecordName(conversation.person),
        getRecordName(conversation.company),
        getRecordName(conversation.opportunity),
        conversation.inboxTeam?.name,
        getRecordName(conversation.assignee),
        ...conversation.labelAssignments
          .filter(({ isActive }) => isActive)
          .map(({ inboxLabel }) => inboxLabel.name),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ');

      return normalizeSearchTerm(searchableContent).includes(normalizedQuery);
    });
  }, [
    attentionFilter,
    conversations,
    labelFilterId,
    pendingMentionCounts,
    query,
  ]);

  return (
    <StyledGrid>
      <InboxConversationList
        conversations={visibleConversations}
        selectedConversationId={selectedConversationId}
        query={query}
        filter={filter}
        labels={labels}
        labelFilterId={labelFilterId}
        workspaceMembers={workspaceMembers}
        assigneeFilterId={assigneeFilterId}
        teams={teams}
        teamFilterId={teamFilterId}
        attentionFilter={attentionFilter}
        pendingMentionCounts={pendingMentionCounts}
        isLoading={isLoadingConversations || isSearching}
        isEmailSyncing={busyAction === 'email-sync'}
        errorMessage={conversationsError?.message ?? null}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
        onLabelFilterChange={setLabelFilterId}
        onAssigneeFilterChange={setAssigneeFilterId}
        onTeamFilterChange={setTeamFilterId}
        onAttentionFilterChange={setAttentionFilter}
        onSelect={(conversationId) => void selectConversation(conversationId)}
        onRefresh={() => void refreshInbox()}
        onSyncEmail={() => void syncTwentyEmail()}
        hasMore={hasMoreConversations}
        totalCount={conversationTotalCount}
        onLoadMore={loadMoreConversations}
      />
      <InboxConversationThread
        conversation={selectedConversation}
        messages={messages}
        events={conversationEvents}
        hasOlderMessages={hasOlderMessages}
        onLoadOlderMessages={loadOlderMessages}
        onLoadMessageMedia={loadMessageMedia}
        mentions={conversationMentions}
        workspaceMembers={workspaceMembers}
        currentWorkspaceMemberId={currentWorkspaceMemberId}
        savedReplies={savedReplies}
        macros={macros}
        isLoading={isLoadingMessages}
        busyAction={busyAction}
        triageResult={triageResult}
        onStatusChange={(status) => void setConversationStatus(status)}
        onSaveInternalNote={saveInternalNote}
        onResolveMention={(mentionId) => void resolveMention(mentionId)}
        onUseSavedReply={applySavedReply}
        onPreviewMacro={previewInboxMacro}
        onApplyMacro={applyInboxMacro}
        onPreviewExternalMessage={previewExternalMessage}
        onConfirmExternalMessage={confirmExternalMessage}
        onRunAiTriage={() => void triageConversation()}
      />
      <InboxCrmContext
        conversation={selectedConversation}
        labels={labels}
        workspaceMembers={workspaceMembers}
        teams={teams}
        busyAction={busyAction}
        onToggleLabel={(label) => void toggleConversationLabel(label)}
        onAssign={(workspaceMemberId) =>
          void setConversationAssignee(workspaceMemberId)
        }
        onTeamChange={(teamId) => void setConversationTeam(teamId)}
        onPriorityChange={(priority) => void setConversationPriority(priority)}
        onCreateTask={createConversationTask}
        onCompleteTask={(taskId) => void completeConversationTask(taskId)}
        onSnooze={(snoozedUntil) => void snoozeConversation(snoozedUntil)}
        onConfigureEvolution={() => void configureEvolution()}
      />
    </StyledGrid>
  );
};
