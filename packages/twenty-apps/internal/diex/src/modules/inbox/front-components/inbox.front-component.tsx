import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';

import { ConversationList } from 'src/modules/inbox/front-components/components/conversation-list';
import { ConversationThread } from 'src/modules/inbox/front-components/components/conversation-thread';
import { CrmContext } from 'src/modules/inbox/front-components/components/crm-context';
import { useInboxData } from 'src/modules/inbox/front-components/hooks/use-inbox-data';
import { inboxStyles } from 'src/modules/inbox/front-components/inbox.styles';
import { getRecordName } from 'src/modules/inbox/front-components/utils/inbox-formatters';
import { INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';

const normalizeSearchTerm = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

export const InboxFrontComponent = () => {
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
    isLoadingMessages,
    busyAction,
    errorMessage,
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

    // Status, search, assignee, team and the attention filters are answered by
    // the query. What is left here is what the database cannot express: a label
    // lives in a child table, and a pending mention is counted per member.
    return conversations.filter((conversation) => {
      const matchesLabel =
        labelFilterId === 'ALL' ||
        conversation.labelAssignments.some(
          (assignment) =>
            assignment.isActive && assignment.label.id === labelFilterId,
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

      // The query matched the conversation's own columns; this widens the same
      // term to the records around it, which the operator also types.
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
          .map(({ label }) => label.name),
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
    <div
      style={{
        boxSizing: 'border-box',
        height: '100%',
        overflowX: 'auto',
        padding: 1,
        width: '100%',
      }}
    >
      <div style={inboxStyles.root}>
        <ConversationList
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
          errorMessage={errorMessage}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
          onLabelFilterChange={setLabelFilterId}
          onAssigneeFilterChange={setAssigneeFilterId}
          onTeamFilterChange={setTeamFilterId}
          onAttentionFilterChange={setAttentionFilter}
          onSelect={selectConversation}
          onRefresh={refreshInbox}
          onSyncEmail={syncTwentyEmail}
          hasMore={hasMoreConversations}
          totalCount={conversationTotalCount}
          onLoadMore={loadMoreConversations}
        />
        <ConversationThread
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
          onStatusChange={setConversationStatus}
          onSaveInternalNote={saveInternalNote}
          onResolveMention={resolveMention}
          onUseSavedReply={applySavedReply}
          onPreviewMacro={previewInboxMacro}
          onApplyMacro={applyInboxMacro}
          onPreviewExternalMessage={previewExternalMessage}
          onConfirmExternalMessage={confirmExternalMessage}
          onRunAiTriage={triageConversation}
        />
        <CrmContext
          conversation={selectedConversation}
          labels={labels}
          workspaceMembers={workspaceMembers}
          teams={teams}
          busyAction={busyAction}
          onToggleLabel={toggleConversationLabel}
          onAssign={setConversationAssignee}
          onTeamChange={setConversationTeam}
          onPriorityChange={setConversationPriority}
          onCreateTask={createConversationTask}
          onCompleteTask={completeConversationTask}
          onSnooze={snoozeConversation}
          onConfigureEvolution={configureEvolution}
        />
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-inbox',
  description:
    'Inbox comercial com conversas, histórico e contexto do CRM em três painéis.',
  component: InboxFrontComponent,
});
