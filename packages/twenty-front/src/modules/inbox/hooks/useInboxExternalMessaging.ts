import { useCallback, useEffect, useRef, useState } from 'react';

import { useApolloClient } from '@apollo/client/react';
import { isDefined } from 'twenty-shared/utils';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { EVOLUTION_CONFIGURE_ROUTE } from '@/inbox/constants/EVOLUTION_CONFIGURE_ROUTE';
import { getEvolutionMediaRoute } from '@/inbox/constants/EVOLUTION_MEDIA_ROUTE';
import { getEvolutionSendTextRoute } from '@/inbox/constants/EVOLUTION_SEND_TEXT_ROUTE';
import { INBOX_TRIAGE_ROUTE } from '@/inbox/constants/INBOX_TRIAGE_ROUTE';
import { SEND_TWENTY_EMAIL } from '@/inbox/graphql/inboxEmailSyncQueries';
import {
  type InboxConversation,
  type InboxTeam,
} from '@/inbox/types/inboxEntityTypes';
import {
  type EvolutionConfigureReceipt,
  type EvolutionMediaPayload,
  type EvolutionTextPreview,
  type EvolutionTextReceipt,
  type InboxExternalMessagePreview,
  type InboxTriageResult,
} from '@/inbox/types/inboxExternalMessageTypes';
import { getInboxAppRoute } from '@/inbox/utils/getInboxAppRoute';
import { loadEligibleTwentyEmailChannels } from '@/inbox/utils/loadEligibleTwentyEmailChannels';
import { postInboxAppRoute } from '@/inbox/utils/postInboxAppRoute';
import { reconcileInboxAutomationEvaluations } from '@/inbox/utils/reconcileInboxAutomationEvaluations';
import { readTwentyEmailConversationMetadata } from '@/inbox/utils/readTwentyEmailConversationMetadata';
import { getUnresolvedSavedReplyVariables } from '@/inbox/utils/renderSavedReplyTemplate';
import { syncTwentyEmailToInbox } from '@/inbox/utils/syncTwentyEmailToInbox';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const AUTOMATION_RECONCILIATION_INTERVAL_MS = 30_000;

export const useInboxExternalMessaging = ({
  selectedConversation,
  teams,
  currentWorkspaceMemberId,
  recordConversationEvent,
  refreshInbox,
  setBusyAction,
}: {
  selectedConversation: InboxConversation | null;
  teams: InboxTeam[];
  currentWorkspaceMemberId: string | null;
  recordConversationEvent: (input: {
    conversationId: string;
    eventType: string;
    summary: string;
    details?: string | null;
  }) => Promise<boolean>;
  refreshInbox: () => Promise<void>;
  setBusyAction: (action: string | null) => void;
}) => {
  const [triageResult, setTriageResult] = useState<InboxTriageResult | null>(
    null,
  );
  const {
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
    enqueueErrorSnackBar,
  } = useSnackBar();
  const apolloClient = useApolloClient();
  const apolloCoreClient = useApolloCoreClient();
  const workspaceId = useAtomStateValue(currentWorkspaceState)?.id ?? null;
  // A synchronous guard closes the re-entrant click window before sendEmail.
  // oxlint-disable-next-line twenty/no-state-useref
  const consumedEmailConfirmationTokensRef = useRef(new Set<string>());
  const selectedConversationId = selectedConversation?.id ?? null;

  useEffect(() => {
    setTriageResult(null);
  }, [selectedConversationId]);

  // Automation evaluations queued in a previous session/tab stay in
  // localStorage. Wake the queue conservatively so worker failures converge
  // without requiring another manual sync; the queue itself applies backoff.
  useEffect(() => {
    if (workspaceId === null) {
      return;
    }

    let reconciliationRunning = false;
    const reconcile = () => {
      if (reconciliationRunning) {
        return;
      }

      reconciliationRunning = true;

      void reconcileInboxAutomationEvaluations({ workspaceId })
        .catch(() => undefined)
        .finally(() => {
          reconciliationRunning = false;
        });
    };

    reconcile();
    const intervalId = setInterval(
      reconcile,
      AUTOMATION_RECONCILIATION_INTERVAL_MS,
    );

    return () => clearInterval(intervalId);
  }, [workspaceId]);

  const getEmailSyncRouting = useCallback(() => {
    const defaultTeam =
      teams.find(
        (team) =>
          team.status === 'ACTIVE' &&
          team.isDefault &&
          currentWorkspaceMemberId !== null &&
          (team.memberships ?? []).some(
            ({ isActive, workspaceMember }) =>
              isActive && workspaceMember?.id === currentWorkspaceMemberId,
          ),
      ) ?? null;

    return {
      assigneeId: currentWorkspaceMemberId,
      inboxTeamId: defaultTeam?.id ?? null,
      responseSlaMinutes: defaultTeam?.defaultResponseSlaMinutes ?? 60,
    };
  }, [currentWorkspaceMemberId, teams]);

  const triageConversation = useCallback(async (): Promise<void> => {
    if (selectedConversationId === null) {
      return;
    }

    setBusyAction('ai-triage');

    try {
      const response = await postInboxAppRoute<InboxTriageResult>(
        INBOX_TRIAGE_ROUTE,
        {
          conversationId: selectedConversationId,
          registerSignal: true,
          proposeReply: true,
        },
      );

      if (
        !response?.summary ||
        response.conversationId !== selectedConversationId
      ) {
        throw new Error(
          'A IA não retornou uma análise válida para esta conversa.',
        );
      }

      setTriageResult(response);
      const eventRecorded = await recordConversationEvent({
        conversationId: selectedConversationId,
        eventType: 'AI_TRIAGED',
        summary: 'Conversa analisada pela IA comercial',
        details: [
          `Intenção: ${response.intent}`,
          `Sentimento: ${response.sentiment}`,
          `Urgência: ${response.urgency}`,
          `Confiança: ${Math.round(response.confidence * 100)}%`,
          `Próxima ação: ${response.recommendedAction}`,
        ].join('\n'),
      });

      if (eventRecorded) {
        enqueueSuccessSnackBar({
          message:
            'Conversa analisada. O rascunho não foi enviado e exige sua revisão.',
        });
      } else {
        enqueueWarningSnackBar({
          message: 'Conversa analisada, mas o evento não entrou no histórico.',
        });
      }
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível analisar a conversa.',
      });
    } finally {
      setBusyAction(null);
    }
  }, [
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
    recordConversationEvent,
    selectedConversationId,
    setBusyAction,
  ]);

  const syncTwentyEmail = useCallback(async (): Promise<void> => {
    if (workspaceId === null) {
      enqueueErrorSnackBar({
        message: 'A workspace ainda não está pronta para sincronizar.',
      });

      return;
    }

    setBusyAction('email-sync');

    try {
      const result = await syncTwentyEmailToInbox({
        apolloClient,
        apolloCoreClient,
        workspaceId,
        routing: getEmailSyncRouting(),
      });

      if (result.eligibleChannels === 0) {
        enqueueWarningSnackBar({
          message:
            'Nenhum canal de e-mail compartilhado está disponível. No Twenty, habilite a sincronização e a visibilidade "Compartilhar tudo" na conta que alimentará a Inbox.',
        });

        return;
      }

      await refreshInbox();
      const automationSummary =
        result.automationEvaluationsQueued > 0
          ? ` ${result.automationEvaluationsQueued} automação(ões) enfileirada(s).`
          : '';
      // Warnings already carry the honest, specific reason (including
      // "N pendente(s), tentaremos novamente"); surface them verbatim
      // instead of a generic pointer to nonexistent history.
      const warningSummary =
        result.automationWarnings.length > 0
          ? ` ${result.automationWarnings.join(' ')}`
          : '';
      const message =
        result.createdMessages > 0
          ? `${result.createdMessages} e-mail(s) sincronizado(s) em ${result.importedThreads} conversa(s).${automationSummary}${warningSummary}`
          : `Canais verificados. Nenhum e-mail novo em ${result.importedThreads} conversa(s).${warningSummary}`;

      if (result.automationWarnings.length > 0) {
        enqueueWarningSnackBar({ message });
      } else {
        enqueueSuccessSnackBar({ message });
      }
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível sincronizar o e-mail do Twenty.',
      });
    } finally {
      setBusyAction(null);
    }
  }, [
    apolloClient,
    apolloCoreClient,
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
    getEmailSyncRouting,
    refreshInbox,
    setBusyAction,
    workspaceId,
  ]);

  const previewExternalMessage = useCallback(
    async ({
      text,
      subject,
    }: {
      text: string;
      subject?: string;
    }): Promise<InboxExternalMessagePreview | null> => {
      const trimmedText = text.trim();

      if (
        selectedConversationId === null ||
        selectedConversation === null ||
        trimmedText.length === 0
      ) {
        return null;
      }

      const unresolvedVariables = getUnresolvedSavedReplyVariables(trimmedText);

      if (unresolvedVariables.length > 0) {
        enqueueWarningSnackBar({
          message: `Resolva os placeholders antes do envio: ${unresolvedVariables
            .map((variable) => `{{${variable}}}`)
            .join(', ')}.`,
        });

        return null;
      }

      setBusyAction('send-preview');

      try {
        if (
          selectedConversation.channel === 'WHATSAPP' &&
          selectedConversation.provider === 'EVOLUTION'
        ) {
          const response = await postInboxAppRoute<EvolutionTextPreview>(
            getEvolutionSendTextRoute(selectedConversationId),
            {
              conversationId: selectedConversationId,
              text: trimmedText,
              previewOnly: true,
            },
          );

          if (
            !isDefined(response) ||
            response.previewOnly !== true ||
            !response.confirmationToken
          ) {
            throw new Error('O provedor não retornou uma prévia válida.');
          }

          return { ...response, channel: 'WHATSAPP', subjectPreview: null };
        }

        if (
          selectedConversation.channel !== 'EMAIL' ||
          selectedConversation.provider !== 'TWENTY_EMAIL'
        ) {
          throw new Error(
            'Esta conversa não possui um canal externo compatível.',
          );
        }

        if (trimmedText.length > 100_000) {
          throw new Error('O corpo do e-mail excede 100 mil caracteres.');
        }

        const metadata = readTwentyEmailConversationMetadata(
          selectedConversation.metadata,
        );

        if (!metadata) {
          throw new Error(
            'A conversa não possui metadados nativos suficientes para responder.',
          );
        }

        const channels = await loadEligibleTwentyEmailChannels(apolloClient);
        const channel = channels.find(
          ({ id, connectedAccountId }) =>
            id === metadata.messageChannelId &&
            connectedAccountId === metadata.connectedAccountId,
        );

        if (!channel) {
          throw new Error(
            'A conta que originou esta conversa não está disponível para seu usuário ou deixou de compartilhar as mensagens.',
          );
        }

        const destination = selectedConversation.contactHandle
          ?.trim()
          .toLowerCase();

        if (
          !destination ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination) ||
          destination === channel.handle.trim().toLowerCase()
        ) {
          throw new Error('O destinatário do e-mail não é válido.');
        }

        const normalizedSubject = (
          subject?.trim() ||
          metadata.subject?.trim() ||
          'Contato comercial'
        ).slice(0, 998);

        return {
          previewOnly: true,
          channel: 'EMAIL',
          conversationId: selectedConversationId,
          destination,
          subjectPreview: normalizedSubject,
          textPreview: trimmedText,
          connectedAccountId: channel.connectedAccountId,
          messageChannelId: channel.id,
          inReplyTo: metadata.lastMessageExternalId ?? null,
          expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
          confirmationToken: `twenty-email:${crypto.randomUUID()}`,
          message:
            'Revise destinatário, assunto e corpo antes de confirmar o envio nativo do Twenty.',
        };
      } catch (error) {
        enqueueErrorSnackBar({
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível preparar o envio.',
        });

        return null;
      } finally {
        setBusyAction(null);
      }
    },
    [
      apolloClient,
      enqueueErrorSnackBar,
      enqueueWarningSnackBar,
      selectedConversation,
      selectedConversationId,
      setBusyAction,
    ],
  );

  const confirmExternalMessage = useCallback(
    async (preview: InboxExternalMessagePreview): Promise<boolean> => {
      const previewExpiry = Date.parse(preview.expiresAt);

      if (
        selectedConversationId === null ||
        selectedConversation === null ||
        preview.conversationId !== selectedConversationId ||
        preview.textPreview.trim().length === 0 ||
        preview.confirmationToken.length === 0 ||
        !Number.isFinite(previewExpiry) ||
        previewExpiry <= Date.now()
      ) {
        enqueueWarningSnackBar({
          message: 'A prévia expirou ou não pertence à conversa atual.',
        });

        return false;
      }

      if (preview.channel === 'EMAIL') {
        const expectedDestination = selectedConversation.contactHandle
          ?.trim()
          .toLowerCase();
        const isInvalidEmailPreview =
          !preview.confirmationToken.startsWith('twenty-email:') ||
          !expectedDestination ||
          preview.destination !== expectedDestination ||
          preview.subjectPreview.trim().length === 0 ||
          preview.subjectPreview.length > 998 ||
          preview.textPreview.length > 100_000;

        if (
          isInvalidEmailPreview ||
          consumedEmailConfirmationTokensRef.current.has(
            preview.confirmationToken,
          )
        ) {
          enqueueWarningSnackBar({
            message:
              'A prévia do e-mail é inválida ou já foi consumida. Gere uma nova prévia.',
          });

          return false;
        }

        consumedEmailConfirmationTokensRef.current.add(
          preview.confirmationToken,
        );
      }

      setBusyAction('send-confirm');

      try {
        if (preview.channel === 'WHATSAPP') {
          const response = await postInboxAppRoute<EvolutionTextReceipt>(
            getEvolutionSendTextRoute(selectedConversationId),
            {
              conversationId: selectedConversationId,
              text: preview.textPreview.trim(),
              previewOnly: false,
              confirmSend: true,
              confirmationToken: preview.confirmationToken,
            },
          );

          if (!response?.sent) {
            throw new Error(
              'A tentativa já foi processada e não foi aceita pelo provedor.',
            );
          }

          void refreshInbox().catch(() => undefined);
          enqueueSuccessSnackBar({
            message: 'Mensagem aceita pelo WhatsApp e registrada na inbox.',
          });

          return true;
        }

        const metadata = readTwentyEmailConversationMetadata(
          selectedConversation.metadata,
        );
        const channels = await loadEligibleTwentyEmailChannels(apolloClient);
        const channel = channels.find(
          ({ id, connectedAccountId }) =>
            id === preview.messageChannelId &&
            connectedAccountId === preview.connectedAccountId &&
            id === metadata?.messageChannelId,
        );

        if (!metadata || !channel) {
          throw new Error(
            'A conta nativa de e-mail não está mais disponível para este envio.',
          );
        }

        const { data } = await apolloClient.mutate<{
          sendEmail?: {
            success?: boolean | null;
            error?: string | null;
          } | null;
        }>({
          mutation: SEND_TWENTY_EMAIL,
          variables: {
            input: {
              connectedAccountId: preview.connectedAccountId,
              to: preview.destination,
              subject: preview.subjectPreview,
              body: preview.textPreview,
              inReplyTo: preview.inReplyTo ?? undefined,
            },
          },
        });

        if (data?.sendEmail?.success !== true) {
          throw new Error(
            data?.sendEmail?.error || 'O Twenty não aceitou o envio do e-mail.',
          );
        }

        let reconciliationSucceeded = false;

        if (workspaceId !== null) {
          try {
            await syncTwentyEmailToInbox({
              apolloClient,
              apolloCoreClient,
              workspaceId,
              routing: getEmailSyncRouting(),
            });
            reconciliationSucceeded = true;
          } catch {
            reconciliationSucceeded = false;
          }
        }

        try {
          await refreshInbox();
        } catch {
          reconciliationSucceeded = false;
        }

        if (reconciliationSucceeded) {
          enqueueSuccessSnackBar({
            message:
              'E-mail enviado pela conta nativa do Twenty e sincronizado na Inbox.',
          });
        } else {
          enqueueWarningSnackBar({
            message:
              'E-mail enviado, mas a cópia da Inbox ainda precisa ser sincronizada.',
          });
        }

        return true;
      } catch (error) {
        enqueueErrorSnackBar({
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível enviar a mensagem.',
        });

        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [
      apolloClient,
      apolloCoreClient,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      getEmailSyncRouting,
      refreshInbox,
      selectedConversation,
      selectedConversationId,
      setBusyAction,
      workspaceId,
    ],
  );

  const configureEvolution = useCallback(async (): Promise<void> => {
    setBusyAction('configure');

    try {
      const response = await postInboxAppRoute<EvolutionConfigureReceipt>(
        EVOLUTION_CONFIGURE_ROUTE,
        {},
      );

      if (!response?.configured) {
        throw new Error('A configuração do WhatsApp não foi concluída.');
      }

      enqueueSuccessSnackBar({
        message: 'Canal Evolution configurado para esta workspace.',
      });
    } catch {
      enqueueErrorSnackBar({
        message:
          'Não foi possível configurar o canal. Revise a configuração segura no servidor.',
      });
    } finally {
      setBusyAction(null);
    }
  }, [enqueueErrorSnackBar, enqueueSuccessSnackBar, setBusyAction]);

  const loadMessageMedia = useCallback(
    async (inboxMessageId: string): Promise<EvolutionMediaPayload | null> => {
      try {
        return await getInboxAppRoute<EvolutionMediaPayload>(
          getEvolutionMediaRoute(inboxMessageId),
        );
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível carregar a mídia desta mensagem.',
        });

        return null;
      }
    },
    [enqueueErrorSnackBar],
  );

  return {
    triageResult,
    triageConversation,
    syncTwentyEmail,
    previewExternalMessage,
    confirmExternalMessage,
    configureEvolution,
    loadMessageMedia,
  };
};
