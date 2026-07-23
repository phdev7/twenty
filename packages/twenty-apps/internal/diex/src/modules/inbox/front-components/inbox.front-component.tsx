import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';

import { ConversationList } from 'src/modules/inbox/front-components/components/conversation-list';
import { ConversationThread } from 'src/modules/inbox/front-components/components/conversation-thread';
import { CrmContext } from 'src/modules/inbox/front-components/components/crm-context';
import { useInboxData } from 'src/modules/inbox/front-components/hooks/use-inbox-data';
import { inboxStyles } from 'src/modules/inbox/front-components/inbox.styles';
import { type InboxConversationFilter } from 'src/modules/inbox/front-components/types/inbox.types';
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
  const {
    conversations,
    savedReplies,
    labels,
    workspaceMembers,
    selectedConversation,
    selectedConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    busyAction,
    errorMessage,
    triageResult,
    loadConversations,
    selectConversation,
    applySavedReply,
    toggleConversationLabel,
    setConversationAssignee,
    setConversationStatus,
    saveInternalNote,
    previewEvolutionText,
    confirmEvolutionText,
    configureEvolution,
    triageConversation,
  } = useInboxData();

  const visibleConversations = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(query);

    return conversations.filter((conversation) => {
      const matchesStatus =
        filter === 'ACTIVE'
          ? conversation.status !== 'RESOLVED'
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

      const matchesAssignee =
        assigneeFilterId === 'ALL' ||
        (assigneeFilterId === 'UNASSIGNED'
          ? !conversation.assignee?.id
          : conversation.assignee?.id === assigneeFilterId);

      if (!matchesAssignee) {
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
        getRecordName(conversation.assignee),
        ...conversation.labelAssignments
          .filter(({ isActive }) => isActive)
          .map(({ label }) => label.name),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ');

      return normalizeSearchTerm(searchableContent).includes(normalizedQuery);
    });
  }, [assigneeFilterId, conversations, filter, labelFilterId, query]);

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
          isLoading={isLoadingConversations}
          errorMessage={errorMessage}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
          onLabelFilterChange={setLabelFilterId}
          onAssigneeFilterChange={setAssigneeFilterId}
          onSelect={selectConversation}
          onRefresh={loadConversations}
        />
        <ConversationThread
          conversation={selectedConversation}
          messages={messages}
          savedReplies={savedReplies}
          isLoading={isLoadingMessages}
          busyAction={busyAction}
          triageResult={triageResult}
          onStatusChange={setConversationStatus}
          onSaveInternalNote={saveInternalNote}
          onUseSavedReply={applySavedReply}
          onPreviewEvolutionText={previewEvolutionText}
          onConfirmEvolutionText={confirmEvolutionText}
          onRunAiTriage={triageConversation}
        />
        <CrmContext
          conversation={selectedConversation}
          labels={labels}
          workspaceMembers={workspaceMembers}
          busyAction={busyAction}
          onToggleLabel={toggleConversationLabel}
          onAssign={setConversationAssignee}
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
