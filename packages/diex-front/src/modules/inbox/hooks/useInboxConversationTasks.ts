import { useCallback } from 'react';

import {
  type InboxConversation,
  type InboxTask,
  type InboxTaskDraft,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { getActiveTeamMembers } from '@/inbox/utils/getActiveTeamMembers';
import { getRecordName } from '@/inbox/utils/getRecordName';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

const getNextFollowUpDueAt = (tasks: InboxTask[]): string | null => {
  const dueAtTimestamps = tasks
    .filter(({ status, dueAt }) => status !== 'DONE' && Boolean(dueAt))
    .map(({ dueAt }) => new Date(dueAt as string).getTime())
    .filter(Number.isFinite);

  return dueAtTimestamps.length > 0
    ? new Date(Math.min(...dueAtTimestamps)).toISOString()
    : null;
};

export const useInboxConversationTasks = ({
  selectedConversation,
  teams,
  workspaceMembers,
  recordConversationEvent,
  setBusyAction,
}: {
  selectedConversation: InboxConversation | null;
  teams: InboxTeam[];
  workspaceMembers: InboxWorkspaceMember[];
  recordConversationEvent: (input: {
    conversationId: string;
    eventType: string;
    summary: string;
    details?: string | null;
  }) => Promise<boolean>;
  setBusyAction: (action: string | null) => void;
}) => {
  const {
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
    enqueueErrorSnackBar,
  } = useSnackBar();
  const { updateOneRecord: updateConversation } = useUpdateOneRecord();
  const { updateOneRecord: updateTask } = useUpdateOneRecord();
  const { createOneRecord: createTask } = useCreateOneRecord({
    objectNameSingular: 'task',
  });
  const { createOneRecord: createTaskTarget } = useCreateOneRecord({
    objectNameSingular: 'taskTarget',
    skipPostOptimisticEffect: true,
  });

  const createConversationTask = useCallback(
    async ({ title, dueAt, assigneeId }: InboxTaskDraft): Promise<boolean> => {
      if (selectedConversation === null) {
        return false;
      }

      const normalizedTitle = title.trim();
      const dueAtTimestamp = new Date(dueAt).getTime();
      const minimumDueAt = Date.now() + 60_000;
      const maximumDueAt = Date.now() + 2 * 365 * 24 * 60 * 60_000;
      const assignee =
        assigneeId === null
          ? null
          : (workspaceMembers.find(({ id }) => id === assigneeId) ?? null);

      if (normalizedTitle.length === 0 || normalizedTitle.length > 255) {
        enqueueWarningSnackBar({
          message: 'A próxima ação precisa ter entre 1 e 255 caracteres.',
        });

        return false;
      }

      if (
        !Number.isFinite(dueAtTimestamp) ||
        dueAtTimestamp < minimumDueAt ||
        dueAtTimestamp > maximumDueAt
      ) {
        enqueueWarningSnackBar({
          message: 'Defina um prazo futuro de até dois anos.',
        });

        return false;
      }

      if (assigneeId !== null && assignee === null) {
        enqueueWarningSnackBar({
          message: 'O responsável selecionado não está mais disponível.',
        });

        return false;
      }

      const selectedTeam = selectedConversation.inboxTeam
        ? teams.find(({ id }) => id === selectedConversation.inboxTeam?.id)
        : null;

      if (selectedConversation.inboxTeam && !selectedTeam) {
        enqueueWarningSnackBar({
          message:
            'A equipe da conversa não pôde ser validada. Atualize a Inbox.',
        });

        return false;
      }

      if (
        assigneeId !== null &&
        selectedTeam &&
        !getActiveTeamMembers(selectedTeam).some(({ id }) => id === assigneeId)
      ) {
        enqueueWarningSnackBar({
          message:
            'O responsável da tarefa precisa pertencer à equipe da conversa.',
        });

        return false;
      }

      const normalizedDueAt = new Date(dueAtTimestamp).toISOString();

      setBusyAction('create-task');

      try {
        const createdTask = await createTask({
          title: normalizedTitle,
          status: 'TODO',
          dueAt: normalizedDueAt,
          assigneeId,
          diexInboxConversationId: selectedConversation.id,
          bodyV2: {
            markdown: [
              'Próxima ação criada pela Inbox Diex.',
              `Conversa: ${selectedConversation.name}`,
              selectedConversation.opportunity
                ? `Oportunidade: ${
                    getRecordName(selectedConversation.opportunity) ||
                    selectedConversation.opportunity.id
                  }`
                : null,
            ]
              .filter(Boolean)
              .join('\n\n'),
            blocknote: null,
          },
        });

        if (!createdTask?.id) {
          throw new Error('A tarefa não retornou um identificador.');
        }

        const targets = [
          selectedConversation.person?.id
            ? { targetPersonId: selectedConversation.person.id }
            : null,
          selectedConversation.company?.id
            ? { targetCompanyId: selectedConversation.company.id }
            : null,
          selectedConversation.opportunity?.id
            ? { targetOpportunityId: selectedConversation.opportunity.id }
            : null,
        ].filter(
          (
            target,
          ): target is
            | { targetPersonId: string }
            | { targetCompanyId: string }
            | { targetOpportunityId: string } => target !== null,
        );
        const targetResults = await Promise.allSettled(
          targets.map((target) =>
            createTaskTarget({ taskId: createdTask.id, ...target }),
          ),
        );
        const nextTasks = [
          ...selectedConversation.tasks,
          {
            id: createdTask.id,
            title: normalizedTitle,
            status: 'TODO',
            dueAt: normalizedDueAt,
            assignee,
          },
        ];
        let followUpWasSynced = true;

        try {
          await updateConversation({
            objectNameSingular: 'inboxConversation',
            idToUpdate: selectedConversation.id,
            updateOneRecordInput: {
              followUpDueAt: getNextFollowUpDueAt(nextTasks),
            },
          });
        } catch {
          followUpWasSynced = false;
        }

        const failedTargetCount = targetResults.filter(
          ({ status }) => status === 'rejected',
        ).length;
        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'TASK_CREATED',
          summary: `Próxima ação criada: ${normalizedTitle}`,
          details: [
            `Prazo: ${new Date(normalizedDueAt).toLocaleString('pt-BR')}`,
            `Responsável: ${getRecordName(assignee) || 'Sem responsável'}`,
          ].join('\n'),
        });
        const hasWarnings =
          failedTargetCount > 0 || !followUpWasSynced || !eventRecorded;

        if (hasWarnings) {
          enqueueWarningSnackBar({
            message:
              'Tarefa criada. Alguns vínculos ou o histórico precisam ser revisados.',
          });
        } else {
          enqueueSuccessSnackBar({
            message: 'Próxima ação criada e vinculada ao contexto comercial.',
          });
        }

        return true;
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível criar a próxima ação.',
        });

        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [
      createTask,
      createTaskTarget,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      recordConversationEvent,
      selectedConversation,
      setBusyAction,
      teams,
      updateConversation,
      workspaceMembers,
    ],
  );

  const completeConversationTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (selectedConversation === null) {
        return;
      }

      const task = selectedConversation.tasks.find(({ id }) => id === taskId);

      if (!task || task.status === 'DONE') {
        return;
      }

      setBusyAction(`complete-task:${taskId}`);

      try {
        await updateTask({
          objectNameSingular: 'task',
          idToUpdate: taskId,
          updateOneRecordInput: { status: 'DONE' },
        });

        const nextTasks = selectedConversation.tasks.map((currentTask) =>
          currentTask.id === taskId
            ? { ...currentTask, status: 'DONE' }
            : currentTask,
        );
        let followUpWasSynced = true;

        try {
          await updateConversation({
            objectNameSingular: 'inboxConversation',
            idToUpdate: selectedConversation.id,
            updateOneRecordInput: {
              followUpDueAt: getNextFollowUpDueAt(nextTasks),
            },
          });
        } catch {
          followUpWasSynced = false;
        }

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'TASK_COMPLETED',
          summary: `Próxima ação concluída: ${task.title ?? task.id}`,
          details: task.assignee
            ? `Responsável: ${getRecordName(task.assignee) || 'Usuário sem nome'}`
            : null,
        });

        if (followUpWasSynced && eventRecorded) {
          enqueueSuccessSnackBar({ message: 'Próxima ação concluída.' });
        } else {
          enqueueWarningSnackBar({
            message: 'Tarefa concluída. Revise o follow-up ou o histórico.',
          });
        }
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível concluir a próxima ação.',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      recordConversationEvent,
      selectedConversation,
      setBusyAction,
      updateConversation,
      updateTask,
    ],
  );

  return { createConversationTask, completeConversationTask };
};
