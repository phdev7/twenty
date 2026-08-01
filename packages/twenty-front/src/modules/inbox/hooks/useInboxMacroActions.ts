import { useCallback } from 'react';

import {
  type InboxConversation,
  type InboxConversationLabelAssignment,
  type InboxLabel,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import {
  type InboxMacro,
  type InboxMacroApplyResult,
  type InboxMacroPreview,
} from '@/inbox/types/inboxMacroTypes';
import { getActiveTeamMembers } from '@/inbox/utils/getActiveTeamMembers';
import { getRecordName } from '@/inbox/utils/getRecordName';
import { renderSavedReplyTemplate } from '@/inbox/utils/renderSavedReplyTemplate';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

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

const getLeastLoadedTeamMember = ({
  team,
  conversations,
  excludedConversationId,
}: {
  team: InboxTeam;
  conversations: InboxConversation[];
  excludedConversationId: string;
}): InboxWorkspaceMember | null => {
  const activeMembers = getActiveTeamMembers(team);

  if (activeMembers.length === 0) {
    return null;
  }

  const loadByMemberId = new Map(
    activeMembers.map((workspaceMember) => [workspaceMember.id, 0]),
  );

  for (const conversation of conversations) {
    if (
      conversation.id === excludedConversationId ||
      conversation.status === 'RESOLVED' ||
      conversation.inboxTeam?.id !== team.id ||
      !conversation.assignee?.id ||
      !loadByMemberId.has(conversation.assignee.id)
    ) {
      continue;
    }

    loadByMemberId.set(
      conversation.assignee.id,
      (loadByMemberId.get(conversation.assignee.id) ?? 0) + 1,
    );
  }

  return [...activeMembers].sort((left, right) => {
    const loadDifference =
      (loadByMemberId.get(left.id) ?? 0) - (loadByMemberId.get(right.id) ?? 0);

    return loadDifference !== 0
      ? loadDifference
      : left.id.localeCompare(right.id);
  })[0];
};

export const useInboxMacroActions = ({
  selectedConversation,
  conversations,
  labels,
  macros,
  teams,
  workspaceMembers,
  recordConversationEvent,
  refetchMessages,
  setBusyAction,
}: {
  selectedConversation: InboxConversation | null;
  conversations: InboxConversation[];
  labels: InboxLabel[];
  macros: InboxMacro[];
  teams: InboxTeam[];
  workspaceMembers: InboxWorkspaceMember[];
  recordConversationEvent: (input: {
    conversationId: string;
    eventType: string;
    summary: string;
    details?: string | null;
  }) => Promise<boolean>;
  refetchMessages: () => Promise<unknown>;
  setBusyAction: (action: string | null) => void;
}) => {
  const { enqueueSuccessSnackBar, enqueueWarningSnackBar } = useSnackBar();
  const { updateOneRecord: updateConversation } = useUpdateOneRecord();
  const { updateOneRecord: updateLabel } = useUpdateOneRecord();
  const { updateOneRecord: updateMacro } = useUpdateOneRecord();
  const { createOneRecord: createConversationLabel } = useCreateOneRecord({
    objectNameSingular: 'inboxConversationLabel',
  });
  const { createOneRecord: createInternalNoteMessage } = useCreateOneRecord({
    objectNameSingular: 'inboxMessage',
  });

  const previewInboxMacro = useCallback(
    async (macroId: string): Promise<InboxMacroPreview | null> => {
      if (selectedConversation === null) {
        return null;
      }

      const macro = macros.find(
        ({ id, status }) => id === macroId && status === 'ACTIVE',
      );

      if (!macro) {
        enqueueWarningSnackBar({
          message: 'A macro selecionada não está mais disponível.',
        });

        return null;
      }

      if (
        macro.channel !== 'ALL' &&
        macro.channel !== selectedConversation.channel
      ) {
        enqueueWarningSnackBar({
          message: 'Esta macro não está habilitada para o canal da conversa.',
        });

        return null;
      }

      if (macro.inboxLabel && macro.inboxLabel.status !== 'ACTIVE') {
        enqueueWarningSnackBar({
          message: 'A etiqueta configurada na macro está inativa.',
        });

        return null;
      }

      if (macro.inboxTeam && macro.inboxTeam.status !== 'ACTIVE') {
        enqueueWarningSnackBar({
          message: 'A equipe configurada na macro está inativa.',
        });

        return null;
      }

      if (
        macro.savedReply &&
        (macro.savedReply.status !== 'ACTIVE' ||
          (macro.savedReply.channel !== 'ALL' &&
            macro.savedReply.channel !== selectedConversation.channel))
      ) {
        enqueueWarningSnackBar({
          message:
            'A resposta pronta configurada na macro não está disponível para este canal.',
        });

        return null;
      }

      const actions: string[] = [];
      let replyDraft: string | null = null;
      let internalNote: string | null = null;
      let unresolvedReplyVariables: string[] = [];
      let unresolvedNoteVariables: string[] = [];

      if (macro.targetConversationStatus !== 'KEEP') {
        actions.push(
          `Status → ${conversationStatusLabels[macro.targetConversationStatus] ?? macro.targetConversationStatus}`,
        );
      }

      if (macro.targetPriority !== 'KEEP') {
        actions.push(
          `Prioridade → ${priorityLabels[macro.targetPriority] ?? macro.targetPriority}`,
        );
      }

      if (macro.inboxTeam) {
        actions.push(`Equipe → ${macro.inboxTeam.name}`);
      }

      if (macro.assignee) {
        actions.push(
          `Responsável → ${getRecordName(macro.assignee) || 'Usuário sem nome'}`,
        );
      }

      if (macro.inboxLabel) {
        actions.push(`Aplicar etiqueta → ${macro.inboxLabel.name}`);
      }

      if (macro.internalNoteTemplate?.trim()) {
        const noteRender = renderSavedReplyTemplate(
          macro.internalNoteTemplate,
          selectedConversation,
        );

        internalNote = noteRender.text.trim();
        unresolvedNoteVariables = noteRender.unresolvedVariables;
        actions.push('Registrar nota interna contextual');
      }

      if (macro.savedReply) {
        const replyRender = renderSavedReplyTemplate(
          macro.savedReply.body,
          selectedConversation,
        );

        replyDraft = replyRender.text;
        unresolvedReplyVariables = replyRender.unresolvedVariables;
        actions.push(
          `Preparar resposta /${macro.savedReply.shortcut} como rascunho`,
        );
      }

      if (actions.length === 0) {
        enqueueWarningSnackBar({
          message: 'Esta macro ainda não possui ações configuradas.',
        });

        return null;
      }

      return {
        macroId: macro.id,
        actions,
        replyDraft,
        internalNote,
        unresolvedReplyVariables,
        unresolvedNoteVariables,
      };
    },
    [enqueueWarningSnackBar, macros, selectedConversation],
  );

  const applyInboxMacro = useCallback(
    async (macroId: string): Promise<InboxMacroApplyResult | null> => {
      if (selectedConversation === null) {
        return null;
      }

      const macro = macros.find(
        ({ id, status }) => id === macroId && status === 'ACTIVE',
      );
      const preview = await previewInboxMacro(macroId);

      if (!macro || !preview) {
        return null;
      }

      if (preview.unresolvedNoteVariables.length > 0) {
        enqueueWarningSnackBar({
          message: `A nota da macro possui variáveis sem valor: ${preview.unresolvedNoteVariables
            .map((variable) => `{{${variable}}}`)
            .join(', ')}.`,
        });

        return null;
      }

      const targetTeam = macro.inboxTeam ?? null;
      const currentTeam = selectedConversation.inboxTeam
        ? (teams.find(({ id }) => id === selectedConversation.inboxTeam?.id) ??
          null)
        : null;
      const assignmentTeam = targetTeam ?? currentTeam;
      const availableAssignee = macro.assignee
        ? (workspaceMembers.find(({ id }) => id === macro.assignee?.id) ?? null)
        : null;

      if (macro.assignee && !availableAssignee) {
        enqueueWarningSnackBar({
          message: 'O responsável configurado na macro não está disponível.',
        });

        return null;
      }

      if (
        macro.assignee &&
        !targetTeam &&
        selectedConversation.inboxTeam &&
        !currentTeam
      ) {
        enqueueWarningSnackBar({
          message:
            'A equipe atual não pôde ser validada para aplicar o responsável da macro.',
        });

        return null;
      }

      if (
        availableAssignee &&
        assignmentTeam &&
        !getActiveTeamMembers(assignmentTeam).some(
          ({ id }) => id === availableAssignee.id,
        )
      ) {
        enqueueWarningSnackBar({
          message:
            'O responsável da macro não pertence à equipe ativa da conversa.',
        });

        return null;
      }

      let nextAssignee = selectedConversation.assignee;

      if (targetTeam) {
        const targetMemberIds = new Set(
          getActiveTeamMembers(targetTeam).map(({ id }) => id),
        );

        nextAssignee = availableAssignee;

        if (!nextAssignee && targetTeam.routingStrategy === 'BALANCED') {
          nextAssignee = getLeastLoadedTeamMember({
            team: targetTeam,
            conversations,
            excludedConversationId: selectedConversation.id,
          });
        } else if (
          !nextAssignee &&
          selectedConversation.assignee &&
          targetMemberIds.has(selectedConversation.assignee.id)
        ) {
          nextAssignee = selectedConversation.assignee;
        }
      } else if (availableAssignee) {
        nextAssignee = availableAssignee;
      }

      const conversationUpdate: Record<string, unknown> = {};
      const nextStatus =
        macro.targetConversationStatus === 'KEEP'
          ? selectedConversation.status
          : macro.targetConversationStatus;
      const nextPriority =
        macro.targetPriority === 'KEEP'
          ? selectedConversation.priority
          : macro.targetPriority;
      const shouldResetResponseSla =
        targetTeam !== null && !selectedConversation.firstRespondedAt;
      const nextFirstResponseDueAt = shouldResetResponseSla
        ? new Date(
            Date.now() +
              Math.max(1, targetTeam.defaultResponseSlaMinutes) * 60_000,
          ).toISOString()
        : selectedConversation.firstResponseDueAt;

      if (macro.targetConversationStatus !== 'KEEP') {
        conversationUpdate.status = nextStatus;
        conversationUpdate.snoozedUntil = null;

        if (nextStatus === 'RESOLVED') {
          conversationUpdate.unreadCount = 0;
        }
      }

      if (macro.targetPriority !== 'KEEP') {
        conversationUpdate.priority = nextPriority;
      }

      if (targetTeam) {
        conversationUpdate.inboxTeamId = targetTeam.id;
        conversationUpdate.assigneeId = nextAssignee?.id ?? null;
        conversationUpdate.firstResponseDueAt = nextFirstResponseDueAt;

        if (shouldResetResponseSla) {
          conversationUpdate.slaBreachedAt = null;
        }
      } else if (availableAssignee) {
        conversationUpdate.assigneeId = availableAssignee.id;
      }

      setBusyAction(`macro:${macro.id}`);

      try {
        const appliedActions: string[] = [];
        const warnings: string[] = [];
        const usedAt = new Date().toISOString();

        if (Object.keys(conversationUpdate).length > 0) {
          await updateConversation({
            objectNameSingular: 'inboxConversation',
            idToUpdate: selectedConversation.id,
            updateOneRecordInput: conversationUpdate,
          });

          if (macro.targetConversationStatus !== 'KEEP') {
            appliedActions.push(
              `Status → ${conversationStatusLabels[nextStatus] ?? nextStatus}`,
            );
          }

          if (macro.targetPriority !== 'KEEP') {
            appliedActions.push(
              `Prioridade → ${priorityLabels[nextPriority] ?? nextPriority}`,
            );
          }

          if (targetTeam) {
            appliedActions.push(`Equipe → ${targetTeam.name}`);

            if (nextAssignee) {
              appliedActions.push(
                `Responsável → ${getRecordName(nextAssignee) || 'Usuário sem nome'}`,
              );
            }
          } else if (availableAssignee) {
            appliedActions.push(
              `Responsável → ${getRecordName(availableAssignee) || 'Usuário sem nome'}`,
            );
          }
        }

        if (macro.inboxLabel) {
          const label =
            labels.find(({ id }) => id === macro.inboxLabel?.id) ??
            macro.inboxLabel;
          const existingAssignment:
            | InboxConversationLabelAssignment
            | undefined = selectedConversation.labelAssignments.find(
            (assignment) => assignment.label.id === label.id,
          );

          try {
            if (existingAssignment?.isActive) {
              appliedActions.push(`Etiqueta mantida → ${label.name}`);
            } else {
              if (existingAssignment) {
                await updateConversation({
                  objectNameSingular: 'inboxConversationLabel',
                  idToUpdate: existingAssignment.id,
                  updateOneRecordInput: {
                    isActive: true,
                    assignedAt: usedAt,
                    removedAt: null,
                  },
                });
              } else {
                await createConversationLabel({
                  name: `${selectedConversation.id}:${label.id}`,
                  isActive: true,
                  assignedAt: usedAt,
                  removedAt: null,
                  inboxConversationId: selectedConversation.id,
                  inboxLabelId: label.id,
                });
              }

              appliedActions.push(`Etiqueta aplicada → ${label.name}`);

              try {
                await updateLabel({
                  objectNameSingular: 'inboxLabel',
                  idToUpdate: label.id,
                  updateOneRecordInput: {
                    usageCount: (label.usageCount ?? 0) + 1,
                  },
                });
              } catch {
                warnings.push(
                  'A etiqueta foi aplicada, mas sua contagem não foi atualizada.',
                );
              }
            }
          } catch {
            warnings.push(`A etiqueta ${label.name} não pôde ser aplicada.`);
          }
        }

        if (preview.internalNote) {
          try {
            await createInternalNoteMessage({
              name:
                preview.internalNote.length > 70
                  ? `${preview.internalNote.slice(0, 67)}...`
                  : preview.internalNote,
              providerMessageKey: `internal:${crypto.randomUUID()}`,
              direction: 'OUTBOUND',
              type: 'TEXT',
              body: preview.internalNote,
              deliveryStatus: 'SENT',
              sentAt: usedAt,
              isInternalNote: true,
              inboxConversationId: selectedConversation.id,
            });
            await refetchMessages();
            appliedActions.push('Nota interna registrada');
          } catch {
            warnings.push('A nota interna da macro não pôde ser registrada.');
          }
        }

        if (preview.replyDraft && macro.savedReply) {
          appliedActions.push(
            `Rascunho /${macro.savedReply.shortcut} preparado`,
          );
        }

        if (appliedActions.length === 0) {
          throw new Error('Nenhuma ação da macro pôde ser aplicada.');
        }

        const usageUpdates = [
          updateMacro({
            objectNameSingular: 'inboxMacro',
            idToUpdate: macro.id,
            updateOneRecordInput: {
              usageCount: (macro.usageCount ?? 0) + 1,
              lastUsedAt: usedAt,
            },
          }),
        ];

        if (preview.replyDraft && macro.savedReply) {
          usageUpdates.push(
            updateMacro({
              objectNameSingular: 'inboxSavedReply',
              idToUpdate: macro.savedReply.id,
              updateOneRecordInput: {
                usageCount: (macro.savedReply.usageCount ?? 0) + 1,
                lastUsedAt: usedAt,
              },
            }),
          );
        }

        const usageResults = await Promise.allSettled(usageUpdates);

        if (usageResults.some(({ status }) => status === 'rejected')) {
          warnings.push(
            'As ações foram aplicadas, mas parte das métricas de uso não foi atualizada.',
          );
        }

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'MACRO_APPLIED',
          summary: `Macro aplicada: ${macro.name}`,
          details: [
            ...appliedActions,
            ...warnings.map((warning) => `Aviso: ${warning}`),
          ].join('\n'),
        });

        if (!eventRecorded) {
          warnings.push('O evento da macro não entrou no histórico.');
        }

        if (warnings.length > 0) {
          enqueueWarningSnackBar({
            message: `Macro aplicada com ${warnings.length} aviso${warnings.length === 1 ? '' : 's'}.`,
          });
        } else {
          enqueueSuccessSnackBar({
            message: `Macro aplicada: ${appliedActions.length} ação${appliedActions.length === 1 ? '' : 'ões'}.`,
          });
        }

        return {
          macroId: macro.id,
          appliedActions,
          warnings,
          replyDraft: preview.replyDraft,
          unresolvedReplyVariables: preview.unresolvedReplyVariables,
        };
      } catch {
        enqueueWarningSnackBar({
          message: 'Não foi possível aplicar a macro selecionada.',
        });

        return null;
      } finally {
        setBusyAction(null);
      }
    },
    [
      conversations,
      createConversationLabel,
      createInternalNoteMessage,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      labels,
      macros,
      previewInboxMacro,
      recordConversationEvent,
      refetchMessages,
      selectedConversation,
      setBusyAction,
      teams,
      updateConversation,
      updateLabel,
      updateMacro,
      workspaceMembers,
    ],
  );

  return { previewInboxMacro, applyInboxMacro };
};
