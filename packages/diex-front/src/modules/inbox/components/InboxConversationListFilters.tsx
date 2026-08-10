import { useState } from 'react';
import { styled } from '@linaria/react';
import { IconFilter, IconSearch } from 'diex-ui/icon';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  type InboxAttentionFilter,
  type InboxConversationFilter,
  type InboxLabel,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { getRecordName } from '@/inbox/utils/getRecordName';

const StyledSearchWrap = styled.label`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[3]};
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledSearchInput = styled.input`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  outline: none;
  width: 100%;
`;

const StyledFilterRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  outline: none;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledFilterToggle = styled.button<{ isActive: boolean }>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive
      ? themeCssVariables.background.transparent.blue
      : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ isActive }) =>
      isActive
        ? themeCssVariables.border.color.blue
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
  white-space: nowrap;
`;

const StyledFilterPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledClearButton = styled.button`
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 0;
  text-decoration: underline;
`;

type InboxConversationListFiltersProps = {
  query: string;
  onQueryChange: (query: string) => void;
  filter: InboxConversationFilter;
  onFilterChange: (filter: InboxConversationFilter) => void;
  labels: InboxLabel[];
  labelFilterId: string;
  onLabelFilterChange: (labelId: string) => void;
  workspaceMembers: InboxWorkspaceMember[];
  assigneeFilterId: string;
  onAssigneeFilterChange: (workspaceMemberId: string) => void;
  teams: InboxTeam[];
  teamFilterId: string;
  onTeamFilterChange: (teamId: string) => void;
  attentionFilter: InboxAttentionFilter;
  onAttentionFilterChange: (filter: InboxAttentionFilter) => void;
};

export const InboxConversationListFilters = ({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  labels,
  labelFilterId,
  onLabelFilterChange,
  workspaceMembers,
  assigneeFilterId,
  onAssigneeFilterChange,
  teams,
  teamFilterId,
  onTeamFilterChange,
  attentionFilter,
  onAttentionFilterChange,
}: InboxConversationListFiltersProps) => {
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const activeFilterCount = [
    labelFilterId !== 'ALL',
    teamFilterId !== 'ALL',
    assigneeFilterId !== 'ALL',
    attentionFilter !== 'ALL',
  ].filter(Boolean).length;

  return (
    <>
      <StyledSearchWrap>
        <IconSearch
          size={themeCssVariables.icon.size.sm}
          stroke={themeCssVariables.icon.stroke.md}
        />
        <StyledSearchInput
          aria-label="Buscar conversas"
          placeholder="Buscar contato, empresa ou telefone"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </StyledSearchWrap>

      <StyledFilterRow>
        <StyledSelect
          aria-label="Filtrar conversas por status"
          value={filter}
          onChange={(event) =>
            onFilterChange(event.target.value as InboxConversationFilter)
          }
        >
          <option value="ACTIVE">Ativas</option>
          <option value="OPEN">Abertas</option>
          <option value="PENDING">Pendentes</option>
          <option value="SNOOZED">Adiadas</option>
          <option value="RESOLVED">Resolvidas</option>
        </StyledSelect>
        <StyledFilterToggle
          type="button"
          aria-expanded={areFiltersOpen}
          isActive={activeFilterCount > 0}
          onClick={() => setAreFiltersOpen((current) => !current)}
        >
          <IconFilter
            size={themeCssVariables.icon.size.sm}
            stroke={themeCssVariables.icon.stroke.md}
          />
          {activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : 'Filtros'}
        </StyledFilterToggle>
      </StyledFilterRow>

      {areFiltersOpen ? (
        <StyledFilterPanel>
          <StyledSelect
            aria-label="Filtrar conversas que exigem atenção"
            value={attentionFilter}
            onChange={(event) =>
              onAttentionFilterChange(
                event.target.value as InboxAttentionFilter,
              )
            }
          >
            <option value="ALL">Toda atenção</option>
            <option value="UNREAD">Não lidas</option>
            <option value="MENTIONED">Minhas menções</option>
            <option value="SLA_BREACHED">SLA estourado</option>
            <option value="URGENT">Alta ou urgente</option>
            <option value="FOLLOW_UP_DUE">Follow-up vencido</option>
          </StyledSelect>
          <StyledSelect
            aria-label="Filtrar conversas por responsável"
            value={assigneeFilterId}
            onChange={(event) => onAssigneeFilterChange(event.target.value)}
          >
            <option value="ALL">Todos os responsáveis</option>
            <option value="UNASSIGNED">Sem responsável</option>
            {workspaceMembers.map((workspaceMember) => (
              <option key={workspaceMember.id} value={workspaceMember.id}>
                {getRecordName(workspaceMember) || 'Usuário sem nome'}
              </option>
            ))}
          </StyledSelect>
          <StyledSelect
            aria-label="Filtrar conversas por equipe"
            value={teamFilterId}
            onChange={(event) => onTeamFilterChange(event.target.value)}
          >
            <option value="ALL">Todas as equipes</option>
            <option value="UNASSIGNED">Sem equipe</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </StyledSelect>
          <StyledSelect
            aria-label="Filtrar conversas por etiqueta"
            value={labelFilterId}
            onChange={(event) => onLabelFilterChange(event.target.value)}
          >
            <option value="ALL">Todas as etiquetas</option>
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </StyledSelect>
          {activeFilterCount > 0 ? (
            <StyledClearButton
              type="button"
              onClick={() => {
                onAttentionFilterChange('ALL');
                onAssigneeFilterChange('ALL');
                onTeamFilterChange('ALL');
                onLabelFilterChange('ALL');
              }}
            >
              Limpar filtros
            </StyledClearButton>
          ) : null}
        </StyledFilterPanel>
      ) : null}
    </>
  );
};
