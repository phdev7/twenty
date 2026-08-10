import { styled } from '@linaria/react';
import { IconBriefcase, IconInbox, IconPlug } from 'diex-ui/icon';
import { IconButton } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { InboxCrmLabelsAndRelationships } from '@/inbox/components/InboxCrmLabelsAndRelationships';
import { InboxCrmOperations } from '@/inbox/components/InboxCrmOperations';
import { InboxCrmTasks } from '@/inbox/components/InboxCrmTasks';
import {
  type InboxConversation,
  type InboxLabel,
  type InboxTaskDraft,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { getActiveTeamMembers } from '@/inbox/utils/getActiveTeamMembers';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';

const StyledAside = styled.aside`
  background: ${themeCssVariables.background.secondary};
  border-left: 1px solid ${themeCssVariables.border.color.light};
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

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

const StyledContextScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${themeCssVariables.spacing[3]};
`;

type InboxCrmContextProps = {
  conversation: InboxConversation | null;
  labels: InboxLabel[];
  workspaceMembers: InboxWorkspaceMember[];
  teams: InboxTeam[];
  busyAction: string | null;
  onToggleLabel: (label: InboxLabel) => void;
  onAssign: (workspaceMemberId: string | null) => void;
  onTeamChange: (teamId: string | null) => void;
  onPriorityChange: (priority: string) => void;
  onCreateTask: (draft: InboxTaskDraft) => Promise<boolean>;
  onCompleteTask: (taskId: string) => void;
  onSnooze: (snoozedUntil: string) => void;
  onConfigureEvolution: () => void;
};

export const InboxCrmContext = ({
  conversation,
  labels,
  workspaceMembers,
  teams,
  busyAction,
  onToggleLabel,
  onAssign,
  onTeamChange,
  onPriorityChange,
  onCreateTask,
  onCompleteTask,
  onSnooze,
  onConfigureEvolution,
}: InboxCrmContextProps) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  if (conversation === null) {
    return (
      <StyledAside>
        <StyledHeader>
          <StyledTitleRow>
            <div>
              <StyledTitle>Contexto comercial</StyledTitle>
              <StyledSubtitle>Canal e dados do CRM</StyledSubtitle>
            </div>
            <IconButton
              variant="secondary"
              Icon={IconPlug}
              ariaLabel="Configurar canal Evolution"
              disabled={busyAction !== null}
              onClick={onConfigureEvolution}
            />
          </StyledTitleRow>
        </StyledHeader>
        <StyledEmptyState>
          <IconBriefcase
            size={themeCssVariables.icon.size.xl}
            stroke={themeCssVariables.icon.stroke.sm}
          />
          Selecione uma conversa para operar o contexto comercial. Depois da primeira mensagem, o CRM identifica contato, empresa, oportunidade, responsável e próxima ação.
        </StyledEmptyState>
      </StyledAside>
    );
  }

  const selectedTeam = conversation.inboxTeam
    ? teams.find(({ id }) => id === conversation.inboxTeam?.id)
    : null;
  const eligibleAssignees = selectedTeam
    ? getActiveTeamMembers(selectedTeam)
    : workspaceMembers;

  return (
    <StyledAside>
      <StyledHeader>
        <StyledTitleRow>
          <div>
            <StyledTitle>Contexto comercial</StyledTitle>
            <StyledSubtitle>Dados do CRM ligados à conversa</StyledSubtitle>
          </div>
          <StyledHeaderActions>
            <IconButton
              variant="secondary"
              Icon={IconPlug}
              ariaLabel="Configurar canal Evolution"
              disabled={busyAction !== null}
              onClick={onConfigureEvolution}
            />
            <IconButton
              variant="secondary"
              Icon={IconInbox}
              ariaLabel="Abrir registro da conversa"
              onClick={() =>
                openRecordInSidePanel({
                  recordId: conversation.id,
                  objectNameSingular: 'inboxConversation',
                })
              }
            />
          </StyledHeaderActions>
        </StyledTitleRow>
      </StyledHeader>

      <StyledContextScroll>
        <InboxCrmLabelsAndRelationships
          conversation={conversation}
          labels={labels}
          teams={teams}
          workspaceMembers={workspaceMembers}
          busyAction={busyAction}
          onToggleLabel={onToggleLabel}
          onTeamChange={onTeamChange}
          onAssign={onAssign}
        />
        <InboxCrmOperations
          conversation={conversation}
          busyAction={busyAction}
          onSnooze={onSnooze}
          onPriorityChange={onPriorityChange}
        />
        <InboxCrmTasks
          conversation={conversation}
          eligibleAssignees={eligibleAssignees}
          busyAction={busyAction}
          onCreateTask={onCreateTask}
          onCompleteTask={onCompleteTask}
        />
      </StyledContextScroll>
    </StyledAside>
  );
};
