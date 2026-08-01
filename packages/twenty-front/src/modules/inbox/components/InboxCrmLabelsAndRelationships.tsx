import { styled } from '@linaria/react';
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconTags,
  IconUser,
  IconUserPin,
  IconUsers,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  InboxRecordCard,
  StyledCard,
  StyledCardBody,
  StyledCardIcon,
  StyledCardLabel,
} from '@/inbox/components/InboxRecordCard';
import {
  type InboxConversation,
  type InboxLabel,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { getActiveTeamMembers } from '@/inbox/utils/getActiveTeamMembers';
import { getRecordName } from '@/inbox/utils/getRecordName';

const StyledSection = styled.section`
  margin-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.08em;
  margin: 0 0 ${themeCssVariables.spacing[2]};
  text-transform: uppercase;
`;

const StyledLabelPicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const labelChipPalette: Record<string, { background: string; color: string }> =
  {
    BLUE: {
      background: themeCssVariables.tag.background.blue,
      color: themeCssVariables.tag.text.blue,
    },
    GREEN: {
      background: themeCssVariables.tag.background.green,
      color: themeCssVariables.tag.text.green,
    },
    ORANGE: {
      background: themeCssVariables.tag.background.orange,
      color: themeCssVariables.tag.text.orange,
    },
    RED: {
      background: themeCssVariables.tag.background.red,
      color: themeCssVariables.tag.text.red,
    },
    TURQUOISE: {
      background: themeCssVariables.tag.background.turquoise,
      color: themeCssVariables.tag.text.turquoise,
    },
    YELLOW: {
      background: themeCssVariables.tag.background.yellow,
      color: themeCssVariables.tag.text.yellow,
    },
    GRAY: {
      background: themeCssVariables.tag.background.gray,
      color: themeCssVariables.tag.text.gray,
    },
  };

const StyledLabelToggle = styled.button<{
  isActive: boolean;
  background: string;
  color: string;
}>`
  align-items: center;
  background: ${({ isActive, background }) =>
    isActive ? background : themeCssVariables.background.primary};
  border: 1px solid
    ${({ isActive, color }) => (isActive ? 'transparent' : color)};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ isActive, color }) => (isActive ? color : color)};
  cursor: pointer;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  max-width: 100%;
  opacity: ${({ isActive }) => (isActive ? 1 : 0.76)};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledMissingHint = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.45;
  margin: 0;
`;

const StyledSelect = styled.select`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  display: block;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-top: ${themeCssVariables.spacing['0.5']};
  max-width: 100%;
  outline: none;
  padding: 0;
  width: 100%;
`;

const StyledTaskMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  display: block;
  font-size: ${themeCssVariables.font.size.xxs};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const listRelations = (relations: string[]): string =>
  relations.length < 2
    ? relations.join('')
    : `${relations.slice(0, -1).join(', ')} nem ${relations[relations.length - 1]}`;

type InboxCrmLabelsAndRelationshipsProps = {
  conversation: InboxConversation;
  labels: InboxLabel[];
  teams: InboxTeam[];
  workspaceMembers: InboxWorkspaceMember[];
  busyAction: string | null;
  onToggleLabel: (label: InboxLabel) => void;
  onTeamChange: (teamId: string | null) => void;
  onAssign: (workspaceMemberId: string | null) => void;
};

export const InboxCrmLabelsAndRelationships = ({
  conversation,
  labels,
  teams,
  workspaceMembers,
  busyAction,
  onToggleLabel,
  onTeamChange,
  onAssign,
}: InboxCrmLabelsAndRelationshipsProps) => {
  const activeLabelIds = new Set(
    conversation.labelAssignments
      .filter(({ isActive }) => isActive)
      .map(({ label }) => label.id),
  );
  const missingRelations = [
    conversation.person ? null : 'pessoa',
    conversation.company ? null : 'empresa',
    conversation.opportunity ? null : 'oportunidade',
  ].filter((relation): relation is string => relation !== null);
  const selectedTeam = conversation.inboxTeam
    ? teams.find(({ id }) => id === conversation.inboxTeam?.id)
    : null;
  const eligibleAssignees = selectedTeam
    ? getActiveTeamMembers(selectedTeam)
    : workspaceMembers;

  return (
    <>
      <StyledSection>
        <StyledSectionTitle>
          Etiquetas ({activeLabelIds.size})
        </StyledSectionTitle>
        {labels.length === 0 ? (
          <StyledCard>
            <StyledCardIcon>
              <IconTags
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            </StyledCardIcon>
            <StyledCardBody>
              Cadastre etiquetas em Diex &gt; Etiquetas da inbox
            </StyledCardBody>
          </StyledCard>
        ) : (
          <StyledLabelPicker>
            {labels.map((label) => {
              const isActive = activeLabelIds.has(label.id);
              const palette =
                labelChipPalette[label.color.toUpperCase()] ??
                labelChipPalette.GRAY;

              return (
                <StyledLabelToggle
                  key={label.id}
                  type="button"
                  title={label.description ?? label.name}
                  disabled={busyAction !== null}
                  isActive={isActive}
                  background={palette.background}
                  color={palette.color}
                  onClick={() => onToggleLabel(label)}
                >
                  {isActive ? '✓ ' : '+ '}
                  {label.name}
                </StyledLabelToggle>
              );
            })}
          </StyledLabelPicker>
        )}
      </StyledSection>

      <StyledSection>
        <StyledSectionTitle>Relacionamentos</StyledSectionTitle>
        {conversation.person ? (
          <InboxRecordCard
            icon={
              <IconUser
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Pessoa"
            objectNameSingular="person"
            record={conversation.person}
          />
        ) : null}
        {conversation.company ? (
          <InboxRecordCard
            icon={
              <IconBuildingSkyscraper
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Empresa"
            objectNameSingular="company"
            record={conversation.company}
          />
        ) : null}
        {conversation.opportunity ? (
          <InboxRecordCard
            icon={
              <IconBriefcase
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Oportunidade"
            objectNameSingular="opportunity"
            record={conversation.opportunity}
            value={`${conversation.opportunity.name ?? ''}${conversation.opportunity.stage ? ` · ${conversation.opportunity.stage}` : ''}`}
          />
        ) : null}
        {missingRelations.length > 0 ? (
          <StyledMissingHint>
            Sem {listRelations(missingRelations)} vinculada
            {missingRelations.length > 1 ? 's' : ''} a esta conversa.
          </StyledMissingHint>
        ) : null}
        <StyledCard>
          <StyledCardIcon>
            <IconUsers
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          </StyledCardIcon>
          <StyledCardBody>
            <StyledCardLabel>Equipe</StyledCardLabel>
            <StyledSelect
              aria-label="Equipe responsável pela conversa"
              disabled={busyAction !== null}
              value={conversation.inboxTeam?.id ?? ''}
              onChange={(event) => onTeamChange(event.target.value || null)}
            >
              <option value="">Sem equipe</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                  {team.routingStrategy === 'BALANCED' ? ' · menor carga' : ''}
                </option>
              ))}
            </StyledSelect>
            {selectedTeam ? (
              <StyledTaskMeta>
                SLA de {selectedTeam.defaultResponseSlaMinutes} min ·{' '}
                {eligibleAssignees.length} membro
                {eligibleAssignees.length === 1 ? '' : 's'} ativo
                {eligibleAssignees.length === 1 ? '' : 's'}
              </StyledTaskMeta>
            ) : null}
          </StyledCardBody>
        </StyledCard>
        <StyledCard>
          <StyledCardIcon>
            <IconUserPin
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          </StyledCardIcon>
          <StyledCardBody>
            <StyledCardLabel>Responsável</StyledCardLabel>
            <StyledSelect
              aria-label="Responsável pela conversa"
              disabled={busyAction !== null || eligibleAssignees.length === 0}
              value={conversation.assignee?.id ?? ''}
              onChange={(event) => onAssign(event.target.value || null)}
            >
              <option value="">Sem responsável</option>
              {eligibleAssignees.map((workspaceMember) => (
                <option key={workspaceMember.id} value={workspaceMember.id}>
                  {getRecordName(workspaceMember) || 'Usuário sem nome'}
                </option>
              ))}
            </StyledSelect>
          </StyledCardBody>
        </StyledCard>
      </StyledSection>
    </>
  );
};
