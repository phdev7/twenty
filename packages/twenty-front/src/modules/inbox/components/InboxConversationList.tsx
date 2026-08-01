import { styled } from '@linaria/react';
import { IconInbox, IconMail, IconRefresh } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { InboxConversationListFilters } from '@/inbox/components/InboxConversationListFilters';
import { InboxConversationListItem } from '@/inbox/components/InboxConversationListItem';
import {
  type InboxAttentionFilter,
  type InboxConversation,
  type InboxConversationFilter,
  type InboxLabel,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';

const StyledAside = styled.aside`
  border-right: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`;

const StyledHeader = styled.header`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  flex-shrink: 0;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTitleRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.45;
  margin: ${themeCssVariables.spacing[1]} 0 0;
`;

const StyledHeaderActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  line-height: 1.5;
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

const StyledErrorState = styled.div`
  background: ${themeCssVariables.background.transparent.danger};
  border: 1px solid ${themeCssVariables.border.color.danger};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xs};
  margin: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSkeleton = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 52px;
  margin: ${themeCssVariables.spacing[3]};
`;

const StyledLoadMoreButton = styled.button`
  background: transparent;
  border: 0;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[3]};
  width: 100%;
`;

type InboxConversationListProps = {
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
  onSelect: (conversationId: string) => void;
  onRefresh: () => void;
  onSyncEmail: () => void;
  hasMore: boolean;
  totalCount: number;
  onLoadMore: () => void;
};

export const InboxConversationList = ({
  conversations,
  hasMore,
  totalCount,
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
}: InboxConversationListProps) => (
  <StyledAside>
    <StyledHeader>
      <StyledTitleRow>
        <div>
          <StyledTitle>Inbox</StyledTitle>
          <StyledSubtitle>
            {totalCount} conversa{totalCount === 1 ? '' : 's'} no filtro
            {hasMore ? ` · ${conversations.length} carregadas` : ''}
          </StyledSubtitle>
        </div>
        <StyledHeaderActions>
          <IconButton
            variant="secondary"
            Icon={IconMail}
            ariaLabel="Sincronizar e-mail"
            disabled={isEmailSyncing}
            onClick={onSyncEmail}
          />
          <IconButton
            variant="secondary"
            Icon={IconRefresh}
            ariaLabel="Atualizar inbox"
            disabled={isLoading}
            onClick={onRefresh}
          />
        </StyledHeaderActions>
      </StyledTitleRow>

      <InboxConversationListFilters
        query={query}
        onQueryChange={onQueryChange}
        filter={filter}
        onFilterChange={onFilterChange}
        labels={labels}
        labelFilterId={labelFilterId}
        onLabelFilterChange={onLabelFilterChange}
        workspaceMembers={workspaceMembers}
        assigneeFilterId={assigneeFilterId}
        onAssigneeFilterChange={onAssigneeFilterChange}
        teams={teams}
        teamFilterId={teamFilterId}
        onTeamFilterChange={onTeamFilterChange}
        attentionFilter={attentionFilter}
        onAttentionFilterChange={onAttentionFilterChange}
      />
    </StyledHeader>

    {errorMessage ? <StyledErrorState>{errorMessage}</StyledErrorState> : null}

    <StyledScrollArea>
      {isLoading && conversations.length === 0 ? (
        <>
          <StyledSkeleton />
          <StyledSkeleton />
          <StyledSkeleton />
          <StyledSkeleton />
        </>
      ) : conversations.length === 0 ? (
        <StyledEmptyState>
          <IconInbox
            size={themeCssVariables.icon.size.xl}
            stroke={themeCssVariables.icon.stroke.sm}
          />
          Nenhuma conversa encontrada neste filtro.
        </StyledEmptyState>
      ) : (
        conversations.map((conversation) => (
          <InboxConversationListItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedConversationId}
            pendingMentionCount={pendingMentionCounts[conversation.id] ?? 0}
            onSelect={onSelect}
          />
        ))
      )}
      {hasMore && !isLoading ? (
        <StyledLoadMoreButton type="button" onClick={onLoadMore}>
          Carregar mais conversas
        </StyledLoadMoreButton>
      ) : null}
    </StyledScrollArea>
  </StyledAside>
);
