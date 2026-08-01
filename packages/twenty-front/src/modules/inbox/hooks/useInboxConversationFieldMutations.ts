import { useCallback } from 'react';

import {
  type InboxConversation,
  type InboxLabel,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { getActiveTeamMembers } from '@/inbox/utils/getActiveTeamMembers';
import { getRecordName } from '@/inbox/utils/getRecordName';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

const conversationStatusLabels: Record<string, string> = {
  OPEN: 'Aberta',
  PENDING: 'Pendente',
  SNOOZED: 'Adiada',
  RESOLVED: 'Resolvida',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const useInboxConversationFieldMutations = ({
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
  const { createOneRecord: createConversationLabel } = useCreateOneRecord({
    objectNameSingular: 'inboxConversationLabel',
  });

  const toggleConversationLabel = useCallback(
    async (label: InboxLabel): Promise<void> => {
      if (selectedConversation === null) {
        return;
      }

      const existingAssignment = selectedConversation.labelAssignments.find(
        (assignment) => assignment.label.id === label.id,
      );
      const shouldActivate = !existingAssignment?.isActive;
      const changedAt = new Date().toISOString();

      setBusyAction(`label:${label.id}`);

      try {
        if (existingAssignment) {
          await updateConversation({
            objectNameSingular: 'inboxConversationLabel',
            idToUpdate: existingAssignment.id,
            updateOneRecordInput: {
              isActive: shouldActivate,
              assignedAt: shouldActivate
                ? changedAt
                : existingAssignment.assignedAt,
              removedAt: shouldActivate ? null : changedAt,
            },
          });
        } else {
          await createConversationLabel({
            name: `${selectedConversation.id}:${label.id}`,
            isActive: true,
            assignedAt: changedAt,
            removedAt: null,
            inboxConversationId: selectedConversation.id,
            inboxLabelId: label.id,
          });
        }

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'LABEL_CHANGED',
          summary: shouldActivate
            ? `Etiqueta aplicada: ${label.name}`
            : `Etiqueta removida: ${label.name}`,
        });

        if (!eventRecorded) {
          enqueueWarningSnackBar({
            message:
              'Etiqueta atualizada, mas o evento não entrou no histórico.',
          });
        }
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível atualizar as etiquetas da conversa.',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [
      createConversationLabel,
      enqueueErrorSnackBar,
      enqueueWarningSnackBar,
      recordConversationEvent,
      selectedConversation,
      setBusyAction,
      updateConversation,
    ],
  );

  const setConversationAssignee = useCallback(
    async (workspaceMemberId: string | null): Promise<void> => {
      if (selectedConversation === null) {
        return;
      }

      const nextAssignee =
        workspaceMemberId === null
          ? null
          : (workspaceMembers.find(({ id }) => id === workspaceMemberId) ??
            null);

      if (workspaceMemberId !== null && nextAssignee === null) {
        enqueueWarningSnackBar({
          message: 'O responsável selecionado não está mais disponível.',
        });

        return;
      }

      const selectedTeam = selectedConversation.inboxTeam
        ? teams.find(({ id }) => id === selectedConversation.inboxTeam?.id)
        : null;
      const activeTeamMemberIds = new Set(
        getActiveTeamMembers(selectedTeam).map(({ id }) => id),
      );

      if (
        workspaceMemberId !== null &&
        selectedTeam &&
        !activeTeamMemberIds.has(workspaceMemberId)
      ) {
        enqueueWarningSnackBar({
          message:
            'O responsável precisa ser membro ativo da equipe selecionada.',
        });

        return;
      }

      setBusyAction('assign-conversation');

      try {
        await updateConversation({
          objectNameSingular: 'inboxConversation',
          idToUpdate: selectedConversation.id,
          updateOneRecordInput: { assigneeId: workspaceMemberId },
        });

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'ASSIGNEE_CHANGED',
          summary: nextAssignee
            ? `Responsável definido: ${getRecordName(nextAssignee) || 'Usuário sem nome'}`
            : 'Responsável removido',
          details: `Anterior: ${getRecordName(selectedConversation.assignee) || 'Sem responsável'}`,
        });

        if (!eventRecorded) {
          enqueueWarningSnackBar({
            message:
              'Responsável atualizado, mas o evento não entrou no histórico.',
          });
        }
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível alterar o responsável da conversa.',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [
      enqueueErrorSnackBar,
      enqueueWarningSnackBar,
      recordConversationEvent,
      selectedConversation,
      setBusyAction,
      teams,
      updateConversation,
      workspaceMembers,
    ],
  );

  const setConversationTeam = useCallback(
    async (teamId: string | null): Promise<void> => {
      if (selectedConversation === null) {
        return;
      }

      const nextTeam =
        teamId === null
          ? null
          : (teams.find(({ id }) => id === teamId) ?? null);

      if (teamId !== null && nextTeam === null) {
        enqueueWarningSnackBar({
          message: 'A equipe selecionada não está mais disponível.',
        });

        return;
      }

      const activeMembers = getActiveTeamMembers(nextTeam);
      const activeMemberIds = new Set(activeMembers.map(({ id }) => id));
      const nextAssignee =
        selectedConversation.assignee &&
        (nextTeam === null ||
          activeMemberIds.has(selectedConversation.assignee.id))
          ? selectedConversation.assignee
          : null;

      const shouldResetResponseSla =
        nextTeam !== null && !selectedConversation.firstRespondedAt;
      const nextFirstResponseDueAt = shouldResetResponseSla
        ? new Date(
            Date.now() +
              Math.max(1, nextTeam.defaultResponseSlaMinutes) * 60_000,
          ).toISOString()
        : selectedConversation.firstResponseDueAt;

      setBusyAction('assign-team');

      try {
        await updateConversation({
          objectNameSingular: 'inboxConversation',
          idToUpdate: selectedConversation.id,
          updateOneRecordInput: {
            inboxTeamId: teamId,
            assigneeId: nextAssignee?.id ?? null,
            firstResponseDueAt: nextFirstResponseDueAt,
            ...(shouldResetResponseSla ? { slaBreachedAt: null } : {}),
          },
        });

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'TEAM_CHANGED',
          summary: nextTeam
            ? `Equipe definida: ${nextTeam.name}`
            : 'Equipe removida',
          details: [
            `Anterior: ${selectedConversation.inboxTeam?.name ?? 'Sem equipe'}`,
            `Responsável: ${getRecordName(nextAssignee) || 'Sem responsável'}`,
          ].join('\n'),
        });

        if (eventRecorded) {
          enqueueSuccessSnackBar({
            message: nextTeam
              ? nextAssignee
                ? `Conversa enviada para ${nextTeam.name} e distribuída.`
                : `Conversa enviada para ${nextTeam.name}, aguardando responsável.`
              : 'Conversa removida da fila de equipe.',
          });
        } else {
          enqueueWarningSnackBar({
            message: 'Equipe atualizada, mas o evento não entrou no histórico.',
          });
        }
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível alterar a equipe da conversa.',
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
      teams,
      updateConversation,
    ],
  );

  const setConversationPriority = useCallback(
    async (priority: string): Promise<void> => {
      if (selectedConversation === null) {
        return;
      }

      if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
        enqueueWarningSnackBar({
          message: 'A prioridade selecionada não é válida.',
        });

        return;
      }

      const previousPriority = selectedConversation.priority;

      setBusyAction('priority');

      try {
        await updateConversation({
          objectNameSingular: 'inboxConversation',
          idToUpdate: selectedConversation.id,
          updateOneRecordInput: { priority },
        });

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'PRIORITY_CHANGED',
          summary: `Prioridade definida: ${priorityLabels[priority] ?? priority}`,
          details: `Anterior: ${priorityLabels[previousPriority] ?? previousPriority}`,
        });

        if (eventRecorded) {
          enqueueSuccessSnackBar({
            message: 'Prioridade da conversa atualizada.',
          });
        } else {
          enqueueWarningSnackBar({
            message:
              'Prioridade atualizada, mas o evento não entrou no histórico.',
          });
        }
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível atualizar a prioridade da conversa.',
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
    ],
  );

  const setConversationStatus = useCallback(
    async (status: string): Promise<void> => {
      if (selectedConversation === null) {
        return;
      }

      const previousStatus = selectedConversation.status;

      setBusyAction('status');

      try {
        await updateConversation({
          objectNameSingular: 'inboxConversation',
          idToUpdate: selectedConversation.id,
          updateOneRecordInput: {
            status,
            ...(status !== 'SNOOZED' ? { snoozedUntil: null } : {}),
            ...(status === 'RESOLVED' ? { unreadCount: 0 } : {}),
          },
        });

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'STATUS_CHANGED',
          summary: `Status definido: ${conversationStatusLabels[status] ?? status}`,
          details: `Anterior: ${conversationStatusLabels[previousStatus] ?? previousStatus}`,
        });

        if (eventRecorded) {
          enqueueSuccessSnackBar({
            message:
              status === 'RESOLVED'
                ? 'Conversa resolvida.'
                : status === 'PENDING'
                  ? 'Conversa marcada como pendente.'
                  : 'Conversa reaberta.',
          });
        } else {
          enqueueWarningSnackBar({
            message: 'Status atualizado, mas o evento não entrou no histórico.',
          });
        }
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível atualizar o status da conversa.',
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
    ],
  );

  const snoozeConversation = useCallback(
    async (snoozedUntil: string): Promise<void> => {
      if (selectedConversation === null) {
        return;
      }

      const targetTime = new Date(snoozedUntil).getTime();
      const minimumTime = Date.now() + 60_000;
      const maximumTime = Date.now() + 365 * 24 * 60 * 60_000;

      if (
        !Number.isFinite(targetTime) ||
        targetTime < minimumTime ||
        targetTime > maximumTime
      ) {
        enqueueWarningSnackBar({
          message:
            'Escolha um prazo futuro entre um minuto e um ano para adiar.',
        });

        return;
      }

      const normalizedSnoozedUntil = new Date(targetTime).toISOString();

      setBusyAction('snooze');

      try {
        await updateConversation({
          objectNameSingular: 'inboxConversation',
          idToUpdate: selectedConversation.id,
          updateOneRecordInput: {
            status: 'SNOOZED',
            snoozedUntil: normalizedSnoozedUntil,
          },
        });

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'SNOOZED',
          summary: `Conversa adiada até ${new Date(normalizedSnoozedUntil).toLocaleString('pt-BR')}`,
        });

        if (eventRecorded) {
          enqueueSuccessSnackBar({
            message: `Conversa adiada até ${new Date(normalizedSnoozedUntil).toLocaleString('pt-BR')}.`,
          });
        } else {
          enqueueWarningSnackBar({
            message: 'Conversa adiada, mas o evento não entrou no histórico.',
          });
        }
      } catch {
        enqueueErrorSnackBar({ message: 'Não foi possível adiar a conversa.' });
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
    ],
  );

  return {
    toggleConversationLabel,
    setConversationAssignee,
    setConversationTeam,
    setConversationPriority,
    setConversationStatus,
    snoozeConversation,
  };
};
