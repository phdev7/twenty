import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';

import { ConversationList } from 'src/modules/inbox/front-components/components/conversation-list';
import { ConversationThread } from 'src/modules/inbox/front-components/components/conversation-thread';
import { CrmContext } from 'src/modules/inbox/front-components/components/crm-context';
import { useInboxData } from 'src/modules/inbox/front-components/hooks/use-inbox-data';
import { inboxStyles } from 'src/modules/inbox/front-components/inbox.styles';
import {
  type InboxAttentionFilter,
  type InboxConversationFilter,
} from 'src/modules/inbox/front-components/types/inbox.types';
import { getRecordName } from 'src/modules/inbox/front-components/utils/inbox-formatters';
import { INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';

const normalizeSearchTerm = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

export const InboxFrontComponent = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InboxConversationFilter>('ACTIVE');
  const [labelFilterId, setLabelFilterId] = useState('ALL');
  const [assigneeFilterId, setAssigneeFilterId] = useState('ALL');
  const [teamFilterId, setTeamFilterId] = useState('ALL');
  const [attentionFilter, setAttentionFilter] =
    useState<InboxAttentionFilter>('ALL');
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
    conversationMentions,
    pendingMentions,
    currentWorkspaceMemberId,
    isLoadingConversations,
    isLoadingMessages,
    busyAction,
    errorMessage,
    triageResult,
    loadConversations,
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
    previewEvolutionText,
    confirmEvolutionText,
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

    return conversations.filter((conversation) => {
      const matchesStatus =
        filter === 'ACTIVE'
          ? conversation.status === 'OPEN' || conversation.status === 'PENDING'
          : conversation.status === filter;

      if (!matchesStatus) {
        return false;
      }

      const matchesLabel =
        labelFilterId === 'ALL' ||
        conversation.labelAssignments.some(
          (assignment) =>
            assignment.isActive && assignment.label.id === labelFilterId,
        );

      if (!matchesLabel) {
        return false;
      }

      const matchesTeam =
        teamFilterId === 'ALL' ||
        (teamFilterId === 'UNASSIGNED'
          ? !conversation.inboxTeam?.id
          : conversation.inboxTeam?.id === teamFilterId);

      if (!matchesTeam) {
        return false;
      }

      const matchesAssignee =
        assigneeFilterId === 'ALL' ||
        (assigneeFilterId === 'UNASSIGNED'
          ? !conversation.assignee?.id
          : conversation.assignee?.id === assigneeFilterId);

      if (!matchesAssignee) {
        return false;
      }

      const now = Date.now();
      const matchesAttention =
        attentionFilter === 'ALL' ||
        (attentionFilter === 'UNREAD' && conversation.unreadCount > 0) ||
        (attentionFilter === 'MENTIONED' &&
          (pendingMentionCounts[conversation.id] ?? 0) > 0) ||
        (attentionFilter === 'SLA_BREACHED' &&
          Boolean(conversation.slaBreachedAt)) ||
        (attentionFilter === 'URGENT' &&
          (conversation.priority === 'HIGH' ||
            conversation.priority === 'URGENT')) ||
        (attentionFilter === 'FOLLOW_UP_DUE' &&
          Boolean(conversation.followUpDueAt) &&
          new Date(conversation.followUpDueAt as string).getTime() <= now);

      if (!matchesAttention) {
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
          .map(({ label }) => label.name),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ');

      return normalizeSearchTerm(searchableContent).includes(normalizedQuery);
    });
  }, [
    assigneeFilterId,
    attentionFilter,
    conversations,
    filter,
    labelFilterId,
    pendingMentionCounts,
    query,
    teamFilterId,
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
          isLoading={isLoadingConversations}
          errorMessage={errorMessage}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
          onLabelFilterChange={setLabelFilterId}
          onAssigneeFilterChange={setAssigneeFilterId}
          onTeamFilterChange={setTeamFilterId}
          onAttentionFilterChange={setAttentionFilter}
          onSelect={selectConversation}
          onRefresh={loadConversations}
        />
        <ConversationThread
          conversation={selectedConversation}
          messages={messages}
          events={conversationEvents}
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
          onPreviewEvolutionText={previewEvolutionText}
          onConfirmEvolutionText={confirmEvolutionText}
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
