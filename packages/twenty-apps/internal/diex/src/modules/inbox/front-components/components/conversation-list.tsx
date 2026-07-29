import {
  IconArrowDown,
  IconArrowUpRight,
  IconAt,
  IconInbox,
  IconMail,
  IconMessage,
  IconRefresh,
  IconSearch,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  type InboxAttentionFilter,
  type InboxConversation,
  type InboxConversationFilter,
  type InboxLabel,
  type InboxTeam,
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
  teams: InboxTeam[];
  teamFilterId: string;
  attentionFilter: InboxAttentionFilter;
  pendingMentionCounts: Record<string, number>;
  isLoading: boolean;
  isEmailSyncing: boolean;
  errorMessage: string | null;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: InboxConversationFilter) => void;
  onLabelFilterChange: (labelId: string) => void;
  onAssigneeFilterChange: (workspaceMemberId: string) => void;
  onTeamFilterChange: (teamId: string) => void;
  onAttentionFilterChange: (filter: InboxAttentionFilter) => void;
  onSelect: (conversationId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onSyncEmail: () => Promise<void>;
  hasMore: boolean;
  onLoadMore: () => void;
};

export const ConversationList = ({
  conversations,
  hasMore,
  onLoadMore,
  selectedConversationId,
  query,
  filter,
  labels,
  labelFilterId,
  workspaceMembers,
  assigneeFilterId,
  teams,
  teamFilterId,
  attentionFilter,
  pendingMentionCounts,
  isLoading,
  isEmailSyncing,
  errorMessage,
  onQueryChange,
  onFilterChange,
  onLabelFilterChange,
  onAssigneeFilterChange,
  onTeamFilterChange,
  onAttentionFilterChange,
  onSelect,
  onRefresh,
  onSyncEmail,
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
        <div style={inboxStyles.headerActions}>
          <button
            type="button"
            aria-label="Sincronizar e-mail"
            title="Sincronizar e-mail nativo do Twenty"
            style={{
              ...inboxStyles.iconButton,
              ...(isEmailSyncing ? inboxStyles.disabledButton : {}),
            }}
            disabled={isEmailSyncing}
            onClick={() => void onSyncEmail()}
          >
            <IconMail
              size={themeCssVariables.icon.size.md}
              stroke={themeCssVariables.icon.stroke.md}
            />
          </button>
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
      <div style={inboxStyles.filterRow}>
        <select
          aria-label="Filtrar conversas por equipe"
          value={teamFilterId}
          onChange={(event) => onTeamFilterChange(event.target.value)}
          style={inboxStyles.filterSelect}
        >
          <option value="ALL">Todas as equipes</option>
          <option value="UNASSIGNED">Sem equipe</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar conversas por responsável"
          value={assigneeFilterId}
          onChange={(event) => onAssigneeFilterChange(event.target.value)}
          style={inboxStyles.filterSelect}
        >
          <option value="ALL">Todos os responsáveis</option>
          <option value="UNASSIGNED">Sem responsável</option>
          {workspaceMembers.map((workspaceMember) => (
            <option key={workspaceMember.id} value={workspaceMember.id}>
              {getRecordName(workspaceMember) || 'Usuário sem nome'}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar conversas que exigem atenção"
          value={attentionFilter}
          onChange={(event) =>
            onAttentionFilterChange(event.target.value as InboxAttentionFilter)
          }
          style={inboxStyles.filterSelect}
        >
          <option value="ALL">Toda atenção</option>
          <option value="UNREAD">Não lidas</option>
          <option value="MENTIONED">Minhas menções</option>
          <option value="SLA_BREACHED">SLA estourado</option>
          <option value="URGENT">Alta ou urgente</option>
          <option value="FOLLOW_UP_DUE">Follow-up vencido</option>
        </select>
      </div>
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
          const pendingMentionCount =
            pendingMentionCounts[conversation.id] ?? 0;

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
                  {pendingMentionCount > 0 ? (
                    <span
                      style={inboxStyles.mentionBadge}
                      title={`${pendingMentionCount} menção ${
                        pendingMentionCount === 1 ? 'pendente' : 'pendentes'
                      }`}
                    >
                      <IconAt
                        size={themeCssVariables.icon.size.sm}
                        stroke={themeCssVariables.icon.stroke.md}
                      />
                      {pendingMentionCount > 99 ? '99+' : pendingMentionCount}
                    </span>
                  ) : null}
                  {conversation.priority === 'HIGH' ||
                  conversation.priority === 'URGENT' ? (
                    <span style={getPriorityChipStyle(conversation.priority)}>
                      {getPriorityLabel(conversation.priority)}
                    </span>
                  ) : null}
                  {conversation.inboxTeam ? (
                    <span style={getLabelChipStyle('BLUE')}>
                      {conversation.inboxTeam.name}
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
      {hasMore && !isLoading ? (
        <button
          type="button"
          style={inboxStyles.loadMoreButton}
          onClick={onLoadMore}
        >
          Carregar mais conversas
        </button>
      ) : null}
    </div>
  </aside>
);
