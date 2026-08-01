import { useCallback } from 'react';

import {
  type InboxConversation,
  type InboxMention,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

const createInternalMessageKey = (): string => {
  const randomPart =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `internal:${randomPart}`;
};

export const useInboxNotesAndMentions = ({
  selectedConversation,
  workspaceMembers,
  currentWorkspaceMemberId,
  pendingMentions,
  conversationMentions,
  recordConversationEvent,
  refetchMentions,
  refetchMessages,
  setBusyAction,
}: {
  selectedConversation: InboxConversation | null;
  workspaceMembers: InboxWorkspaceMember[];
  currentWorkspaceMemberId: string | null;
  pendingMentions: InboxMention[];
  conversationMentions: InboxMention[];
  recordConversationEvent: (input: {
    conversationId: string;
    eventType: string;
    summary: string;
    details?: string | null;
  }) => Promise<boolean>;
  refetchMentions: () => Promise<void>;
  refetchMessages: () => Promise<unknown>;
  setBusyAction: (action: string | null) => void;
}) => {
  const {
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
    enqueueErrorSnackBar,
  } = useSnackBar();
  const { updateOneRecord: updateConversation } = useUpdateOneRecord();
  const { updateOneRecord: updateMention } = useUpdateOneRecord();
  const { createOneRecord: createMessage } = useCreateOneRecord({
    objectNameSingular: 'inboxMessage',
  });
  const { createOneRecord: createMention } = useCreateOneRecord({
    objectNameSingular: 'inboxMention',
  });

  const selectedConversationId = selectedConversation?.id ?? null;

  const saveInternalNote = useCallback(
    async (
      body: string,
      mentionedWorkspaceMemberIds: string[] = [],
    ): Promise<boolean> => {
      const trimmedBody = body.trim();

      if (selectedConversationId === null || trimmedBody.length === 0) {
        return false;
      }

      const allowedWorkspaceMemberIds = new Set(
        workspaceMembers.map(({ id }) => id),
      );
      const normalizedMentionedWorkspaceMemberIds = [
        ...new Set(mentionedWorkspaceMemberIds),
      ]
        .filter(
          (workspaceMemberId) =>
            workspaceMemberId !== currentWorkspaceMemberId &&
            allowedWorkspaceMemberIds.has(workspaceMemberId),
        )
        .slice(0, 20);

      setBusyAction('note');

      try {
        const mentionedAt = new Date().toISOString();
        const createdMessage = await createMessage({
          name:
            trimmedBody.length > 70
              ? `${trimmedBody.slice(0, 67)}...`
              : trimmedBody,
          providerMessageKey: createInternalMessageKey(),
          direction: 'OUTBOUND',
          messageType: 'TEXT',
          body: trimmedBody,
          deliveryStatus: 'SENT',
          sentAt: mentionedAt,
          isInternalNote: true,
          inboxConversationId: selectedConversationId,
        });

        if (!createdMessage?.id) {
          throw new Error('A nota não retornou um identificador.');
        }

        const mentionResults = await Promise.allSettled(
          normalizedMentionedWorkspaceMemberIds.map((workspaceMemberId) =>
            createMention({
              name: `${createdMessage.id}:${workspaceMemberId}`,
              excerpt: trimmedBody.slice(0, 500),
              status: 'UNREAD',
              mentionedAt,
              readAt: null,
              resolvedAt: null,
              inboxConversationId: selectedConversationId,
              inboxMessageId: createdMessage.id,
              mentionedWorkspaceMemberId: workspaceMemberId,
              authorWorkspaceMemberId: currentWorkspaceMemberId,
            }),
          ),
        );
        const failedMentionCount = mentionResults.filter(
          ({ status }) => status === 'rejected',
        ).length;

        await Promise.all([refetchMessages(), refetchMentions()]);

        if (failedMentionCount > 0) {
          enqueueWarningSnackBar({
            message: `Nota salva. ${failedMentionCount} menção não pôde ser criada.`,
          });
        } else {
          enqueueSuccessSnackBar({
            message:
              normalizedMentionedWorkspaceMemberIds.length > 0
                ? 'Nota interna salva e equipe mencionada.'
                : 'Nota interna adicionada.',
          });
        }

        return true;
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível salvar a nota interna.',
        });

        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [
      createMention,
      createMessage,
      currentWorkspaceMemberId,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      refetchMentions,
      refetchMessages,
      selectedConversationId,
      setBusyAction,
      workspaceMembers,
    ],
  );

  const resolveMention = useCallback(
    async (mentionId: string): Promise<void> => {
      const mention =
        pendingMentions.find(({ id }) => id === mentionId) ??
        conversationMentions.find(({ id }) => id === mentionId);

      if (
        !mention ||
        mention.mentionedWorkspaceMember?.id !== currentWorkspaceMemberId ||
        mention.status === 'RESOLVED'
      ) {
        enqueueWarningSnackBar({
          message: 'Esta menção não está disponível para resolução.',
        });

        return;
      }

      setBusyAction(`resolve-mention:${mentionId}`);

      try {
        const resolvedAt = new Date().toISOString();

        await updateMention({
          objectNameSingular: 'inboxMention',
          idToUpdate: mentionId,
          updateOneRecordInput: {
            status: 'RESOLVED',
            readAt: mention.readAt ?? resolvedAt,
            resolvedAt,
          },
        });
        await refetchMentions();

        const eventRecorded = mention.inboxConversation?.id
          ? await recordConversationEvent({
              conversationId: mention.inboxConversation.id,
              eventType: 'MENTION_RESOLVED',
              summary: 'Menção interna resolvida',
              details: mention.excerpt ?? null,
            })
          : false;

        if (eventRecorded) {
          enqueueSuccessSnackBar({ message: 'Menção resolvida.' });
        } else {
          enqueueWarningSnackBar({
            message: 'Menção resolvida, mas o evento não entrou no histórico.',
          });
        }
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível resolver a menção.',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [
      conversationMentions,
      currentWorkspaceMemberId,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      pendingMentions,
      recordConversationEvent,
      refetchMentions,
      setBusyAction,
      updateMention,
    ],
  );

  const selectConversationSideEffects = useCallback(
    async (conversation: InboxConversation | undefined): Promise<void> => {
      const unreadMentions = pendingMentions.filter(
        (mention) =>
          mention.inboxConversation?.id === conversation?.id &&
          mention.mentionedWorkspaceMember?.id === currentWorkspaceMemberId &&
          mention.status === 'UNREAD',
      );

      if (
        (!conversation || conversation.unreadCount <= 0) &&
        unreadMentions.length === 0
      ) {
        return;
      }

      const readAt = new Date().toISOString();

      try {
        const results = await Promise.allSettled([
          ...(conversation && conversation.unreadCount > 0
            ? [
                updateConversation({
                  objectNameSingular: 'inboxConversation',
                  idToUpdate: conversation.id,
                  updateOneRecordInput: { unreadCount: 0 },
                }),
              ]
            : []),
          ...unreadMentions.map((mention) =>
            updateMention({
              objectNameSingular: 'inboxMention',
              idToUpdate: mention.id,
              updateOneRecordInput: { status: 'READ', readAt },
            }),
          ),
        ]);

        if (unreadMentions.length > 0) {
          void refetchMentions();
        }

        if (results.some(({ status }) => status === 'rejected')) {
          throw new Error('partial-sync-failure');
        }
      } catch {
        enqueueWarningSnackBar({
          message:
            'A conversa foi aberta, mas parte dos indicadores não pôde ser sincronizada.',
        });
      }
    },
    [
      currentWorkspaceMemberId,
      enqueueWarningSnackBar,
      pendingMentions,
      refetchMentions,
      updateConversation,
      updateMention,
    ],
  );

  return { saveInternalNote, resolveMention, selectConversationSideEffects };
};
