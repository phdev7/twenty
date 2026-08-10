import { useEffect, useState } from 'react';
import { styled } from '@linaria/react';
import {
  IconCheck,
  IconChevronRight,
  IconListCheck,
  IconPlus,
} from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  StyledCard,
  StyledCardBody,
  StyledCardIcon,
} from '@/inbox/components/InboxRecordCard';
import {
  type InboxConversation,
  type InboxTaskDraft,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { getRecordName } from '@/inbox/utils/getRecordName';
import {
  formatDateTime,
  getTaskStatusLabel,
} from '@/inbox/utils/inboxFormatters';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';

const StyledSection = styled.section`
  margin-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledSectionHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
`;

const StyledTaskComposer = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledFieldLabel = styled.label`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
`;

const StyledFieldInput = styled.input`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: block;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  height: ${themeCssVariables.spacing[8]};
  margin-top: ${themeCssVariables.spacing[1]};
  outline: none;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledFieldSelect = styled.select`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: block;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  height: ${themeCssVariables.spacing[8]};
  margin-top: ${themeCssVariables.spacing[1]};
  outline: none;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledActionRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTaskCard = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledTaskCompleteButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  height: ${themeCssVariables.spacing[7]};
  justify-content: center;
  width: ${themeCssVariables.spacing[7]};
`;

const StyledTaskOpenButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  padding: 0;
  text-align: left;
`;

const StyledTaskTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  display: block;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTaskMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  display: block;
  font-size: ${themeCssVariables.font.size.xxs};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const toLocalDateTimeInputValue = (value: string): string => {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

const getTomorrowNineAm = (): string => {
  const target = new Date();

  target.setDate(target.getDate() + 1);
  target.setHours(9, 0, 0, 0);

  return target.toISOString();
};

type InboxCrmTasksProps = {
  conversation: InboxConversation;
  eligibleAssignees: InboxWorkspaceMember[];
  busyAction: string | null;
  onCreateTask: (draft: InboxTaskDraft) => Promise<boolean>;
  onCompleteTask: (taskId: string) => void;
};

export const InboxCrmTasks = ({
  conversation,
  eligibleAssignees,
  busyAction,
  onCreateTask,
  onCompleteTask,
}: InboxCrmTasksProps) => {
  const [isTaskComposerOpen, setIsTaskComposerOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueAt, setTaskDueAt] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  useEffect(() => {
    setIsTaskComposerOpen(false);
    setTaskTitle('');
    setTaskDueAt(toLocalDateTimeInputValue(getTomorrowNineAm()));
    setTaskAssigneeId(conversation.assignee?.id ?? '');
  }, [conversation.assignee?.id, conversation.id]);

  const openTasks = conversation.tasks.filter(
    ({ status }) => status !== 'DONE',
  );

  return (
    <StyledSection>
      <StyledSectionHeader>
        <StyledSectionTitle>
          Próximas tarefas ({openTasks.length})
        </StyledSectionTitle>
        <Button
          variant="tertiary"
          size="small"
          Icon={IconPlus}
          title="Nova"
          disabled={busyAction !== null}
          onClick={() => setIsTaskComposerOpen((current) => !current)}
        />
      </StyledSectionHeader>
      {isTaskComposerOpen ? (
        <StyledTaskComposer>
          <StyledFieldLabel>
            Próxima ação
            <StyledFieldInput
              aria-label="Título da próxima ação"
              maxLength={255}
              placeholder="Ex.: Retornar com proposta revisada"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
            />
          </StyledFieldLabel>
          <StyledFieldLabel>
            Prazo
            <StyledFieldInput
              aria-label="Prazo da próxima ação"
              type="datetime-local"
              min={toLocalDateTimeInputValue(
                new Date(Date.now() + 60_000).toISOString(),
              )}
              value={taskDueAt}
              onChange={(event) => setTaskDueAt(event.target.value)}
            />
          </StyledFieldLabel>
          <StyledFieldLabel>
            Responsável
            <StyledFieldSelect
              aria-label="Responsável pela próxima ação"
              value={taskAssigneeId}
              onChange={(event) => setTaskAssigneeId(event.target.value)}
            >
              <option value="">Sem responsável</option>
              {eligibleAssignees.map((workspaceMember) => (
                <option key={workspaceMember.id} value={workspaceMember.id}>
                  {getRecordName(workspaceMember) || 'Usuário sem nome'}
                </option>
              ))}
            </StyledFieldSelect>
          </StyledFieldLabel>
          <StyledActionRow>
            <Button
              variant="secondary"
              size="small"
              title="Cancelar"
              onClick={() => setIsTaskComposerOpen(false)}
            />
            <Button
              variant="primary"
              size="small"
              title="Criar ação"
              disabled={
                busyAction !== null ||
                taskTitle.trim().length === 0 ||
                taskDueAt.length === 0
              }
              onClick={async () => {
                const target = new Date(taskDueAt);

                if (!Number.isFinite(target.getTime())) {
                  return;
                }

                const wasCreated = await onCreateTask({
                  title: taskTitle,
                  dueAt: target.toISOString(),
                  assigneeId: taskAssigneeId || null,
                });

                if (wasCreated) {
                  setTaskTitle('');
                  setTaskDueAt(toLocalDateTimeInputValue(getTomorrowNineAm()));
                  setIsTaskComposerOpen(false);
                }
              }}
            />
          </StyledActionRow>
        </StyledTaskComposer>
      ) : null}
      {openTasks.length === 0 ? (
        <StyledCard>
          <StyledCardIcon>
            <IconListCheck
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          </StyledCardIcon>
          <StyledCardBody>Nenhuma tarefa aberta</StyledCardBody>
        </StyledCard>
      ) : (
        openTasks.map((task) => (
          <StyledTaskCard key={task.id}>
            <StyledTaskCompleteButton
              type="button"
              aria-label={`Concluir ${task.title || 'tarefa'}`}
              title="Marcar como concluída"
              disabled={busyAction !== null}
              onClick={() => onCompleteTask(task.id)}
            >
              <IconCheck
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            </StyledTaskCompleteButton>
            <StyledTaskOpenButton
              type="button"
              onClick={() =>
                openRecordInSidePanel({
                  recordId: task.id,
                  objectNameSingular: 'task',
                })
              }
            >
              <StyledCardBody>
                <StyledTaskTitle>
                  {task.title || 'Tarefa sem título'}
                </StyledTaskTitle>
                <StyledTaskMeta>
                  {getTaskStatusLabel(task.status)} ·{' '}
                  {formatDateTime(task.dueAt)}
                  {task.assignee
                    ? ` · ${getRecordName(task.assignee) || 'Responsável sem nome'}`
                    : ''}
                </StyledTaskMeta>
              </StyledCardBody>
              <IconChevronRight
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            </StyledTaskOpenButton>
          </StyledTaskCard>
        ))
      )}
    </StyledSection>
  );
};
