import {
  IconArrowDown,
  IconArrowUpRight,
  IconInbox,
  IconMail,
  IconMessage,
  IconRefresh,
  IconSearch,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  type InboxConversation,
  type InboxConversationFilter,
  type InboxLabel,
  type InboxWorkspaceMember,
} from 'src/modules/inbox/front-components/types/inbox.types';
import {
  formatRelativeTime,
  getConversationStatusLabel,
  getInitials,
  getPriorityLabel,
  getRecordName,
} from 'src/modules/inbox/front-components/utils/inbox-formatters';
import {
  getLabelChipStyle,
  getPriorityChipStyle,
  getStatusChipStyle,
  inboxStyles,
} from 'src/modules/inbox/front-components/inbox.styles';

type ConversationListProps = {
  conversations: InboxConversation[];
  selectedConversationId: string | null;
  query: string;
  filter: InboxConversationFilter;
  labels: InboxLabel[];
  labelFilterId: string;
  workspaceMembers: InboxWorkspaceMember[];
  assigneeFilterId: string;
  isLoading: boolean;
  errorMessage: string | null;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: InboxConversationFilter) => void;
  onLabelFilterChange: (labelId: string) => void;
  onAssigneeFilterChange: (workspaceMemberId: string) => void;
  onSelect: (conversationId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
};

export const ConversationList = ({
  conversations,
  selectedConversationId,
  query,
  filter,
  labels,
  labelFilterId,
  workspaceMembers,
  assigneeFilterId,
  isLoading,
  errorMessage,
  onQueryChange,
  onFilterChange,
  onLabelFilterChange,
  onAssigneeFilterChange,
  onSelect,
  onRefresh,
}: ConversationListProps) => (
  <aside
    style={{
      ...inboxStyles.panel,
      ...inboxStyles.leftPanel,
    }}
  >
    <header style={inboxStyles.sectionHeader}>
      <div style={inboxStyles.titleRow}>
        <div>
          <h2 style={inboxStyles.title}>Inbox</h2>
          <p style={inboxStyles.subtitle}>
            {conversations.length} conversa
            {conversations.length === 1 ? '' : 's'} no filtro atual
          </p>
        </div>
        <button
          type="button"
          aria-label="Atualizar inbox"
          title="Atualizar inbox"
          style={{
            ...inboxStyles.iconButton,
            ...(isLoading ? inboxStyles.disabledButton : {}),
          }}
          disabled={isLoading}
          onClick={() => void onRefresh()}
        >
          <IconRefresh
            size={themeCssVariables.icon.size.md}
            stroke={themeCssVariables.icon.stroke.md}
          />
        </button>
      </div>

      <label style={inboxStyles.searchWrap}>
        <IconSearch
          size={themeCssVariables.icon.size.sm}
          stroke={themeCssVariables.icon.stroke.md}
        />
        <input
          aria-label="Buscar conversas"
          placeholder="Buscar contato, empresa ou telefone"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          style={inboxStyles.searchInput}
        />
      </label>

      <div style={inboxStyles.filterRow}>
        <select
          aria-label="Filtrar conversas por status"
          value={filter}
          onChange={(event) =>
            onFilterChange(event.target.value as InboxConversationFilter)
          }
          style={inboxStyles.filterSelect}
        >
          <option value="ACTIVE">Ativas</option>
          <option value="OPEN">Abertas</option>
          <option value="PENDING">Pendentes</option>
          <option value="SNOOZED">Adiadas</option>
          <option value="RESOLVED">Resolvidas</option>
        </select>
        <select
          aria-label="Filtrar conversas por etiqueta"
          value={labelFilterId}
          onChange={(event) => onLabelFilterChange(event.target.value)}
          style={inboxStyles.filterSelect}
        >
          <option value="ALL">Todas as etiquetas</option>
          {labels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </select>
      </div>
      <select
        aria-label="Filtrar conversas por responsável"
        value={assigneeFilterId}
        onChange={(event) => onAssigneeFilterChange(event.target.value)}
        style={{
          ...inboxStyles.filterSelect,
          marginTop: themeCssVariables.spacing[2],
        }}
      >
        <option value="ALL">Todos os responsáveis</option>
        <option value="UNASSIGNED">Sem responsável</option>
        {workspaceMembers.map((workspaceMember) => (
          <option key={workspaceMember.id} value={workspaceMember.id}>
            {getRecordName(workspaceMember) || 'Usuário sem nome'}
          </option>
        ))}
      </select>
    </header>

    {errorMessage ? (
      <div style={inboxStyles.errorState}>{errorMessage}</div>
    ) : null}

    <div style={inboxStyles.scrollArea}>
      {isLoading && conversations.length === 0 ? (
        <>
          <div style={inboxStyles.skeleton} />
          <div style={inboxStyles.skeleton} />
          <div style={inboxStyles.skeleton} />
          <div style={inboxStyles.skeleton} />
        </>
      ) : conversations.length === 0 ? (
        <div style={inboxStyles.emptyState}>
          <IconInbox
            size={themeCssVariables.icon.size.xl}
            stroke={themeCssVariables.icon.stroke.sm}
          />
          Nenhuma conversa encontrada neste filtro.
        </div>
      ) : (
        conversations.map((conversation) => {
          const isSelected = conversation.id === selectedConversationId;
          const isOutbound = conversation.lastMessageDirection === 'OUTBOUND';

          return (
            <button
              key={conversation.id}
              type="button"
              style={{
                ...inboxStyles.conversationButton,
                ...(isSelected ? inboxStyles.conversationButtonSelected : {}),
              }}
              onClick={() => void onSelect(conversation.id)}
            >
              <div style={inboxStyles.avatar}>
                {getInitials(conversation.name)}
              </div>
              <div style={inboxStyles.conversationBody}>
                <div style={inboxStyles.conversationTopLine}>
                  <span style={inboxStyles.conversationName}>
                    {conversation.name}
                  </span>
                  <span style={inboxStyles.conversationTime}>
                    {formatRelativeTime(conversation.lastMessageAt)}
                  </span>
                </div>

                <div style={inboxStyles.conversationPreviewRow}>
                  {isOutbound ? (
                    <IconArrowUpRight
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.sm}
                    />
                  ) : (
                    <IconArrowDown
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.sm}
                    />
                  )}
                  <span style={inboxStyles.conversationPreview}>
                    {conversation.lastMessagePreview ||
                      'Conversa aguardando primeira mensagem'}
                  </span>
                  {conversation.unreadCount > 0 ? (
                    <span style={inboxStyles.unreadBadge}>
                      {conversation.unreadCount > 99
                        ? '99+'
                        : conversation.unreadCount}
                    </span>
                  ) : null}
                </div>

                <div style={inboxStyles.metadataRow}>
                  {conversation.channel === 'EMAIL' ? (
                    <IconMail
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.sm}
                    />
                  ) : (
                    <IconMessage
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.sm}
                    />
                  )}
                  <span style={getStatusChipStyle(conversation.status)}>
                    {getConversationStatusLabel(conversation.status)}
                  </span>
                  {conversation.priority === 'HIGH' ||
                  conversation.priority === 'URGENT' ? (
                    <span style={getPriorityChipStyle(conversation.priority)}>
                      {getPriorityLabel(conversation.priority)}
                    </span>
                  ) : null}
                  {conversation.labelAssignments
                    .filter(({ isActive }) => isActive)
                    .slice(0, 2)
                    .map(({ id, label }) => (
                      <span key={id} style={getLabelChipStyle(label.color)}>
                        {label.name}
                      </span>
                    ))}
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  </aside>
);
