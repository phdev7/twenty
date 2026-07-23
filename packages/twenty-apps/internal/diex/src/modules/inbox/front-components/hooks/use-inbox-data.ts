import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import {
  EVOLUTION_CONFIGURE_ROUTE,
  EVOLUTION_SEND_TEXT_ROUTE,
} from 'src/modules/inbox/constants/evolution.constants';
import { INBOX_TRIAGE_ROUTE } from 'src/modules/inbox/constants/inbox-ai.constants';
import {
  type EvolutionConfigureReceipt,
  type EvolutionTextPreview,
  type EvolutionTextReceipt,
  type InboxConversation,
  type InboxMessage,
  type InboxTask,
  type InboxTriageResult,
} from 'src/modules/inbox/front-components/types/inbox.types';

type ConversationNode = Omit<InboxConversation, 'tasks'> & {
  tasks?: {
    edges?: Array<{
      node: InboxTask;
    }>;
  } | null;
};

type ConversationQueryResult = {
  inboxConversations?: {
    edges?: Array<{
      node: ConversationNode;
    }>;
  };
};

type MessageQueryResult = {
  inboxMessages?: {
    edges?: Array<{
      node: InboxMessage;
    }>;
  };
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Não foi possível carregar a inbox.';

const createInternalMessageKey = (): string => {
  const randomPart =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `internal:${randomPart}`;
};

export const useInboxData = () => {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [triageResult, setTriageResult] =
    useState<InboxTriageResult | null>(null);
  const messageRequestVersionRef = useRef(0);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setErrorMessage(null);

    try {
      const client = new CoreApiClient();
      const queryResult = (await client.query({
        inboxConversations: {
          __args: {
            first: 100,
            orderBy: [{ lastMessageAt: 'DescNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              name: true,
              providerThreadKey: true,
              channel: true,
              provider: true,
              status: true,
              priority: true,
              contactHandle: true,
              unreadCount: true,
              lastMessagePreview: true,
              lastMessageDirection: true,
              lastMessageAt: true,
              firstResponseDueAt: true,
              firstRespondedAt: true,
              followUpDueAt: true,
              snoozedUntil: true,
              slaBreachedAt: true,
              person: {
                id: true,
                name: {
                  firstName: true,
                  lastName: true,
                },
              },
              company: {
                id: true,
                name: true,
              },
              opportunity: {
                id: true,
                name: true,
                stage: true,
              },
              assignee: {
                id: true,
                name: {
                  firstName: true,
                  lastName: true,
                },
                avatarUrl: true,
              },
              tasks: {
                edges: {
                  node: {
                    id: true,
                    title: true,
                    status: true,
                    dueAt: true,
                  },
                },
              },
            },
          },
        },
      } as never)) as unknown as ConversationQueryResult;

      const nextConversations =
        queryResult.inboxConversations?.edges?.map(({ node }) => ({
          ...node,
          unreadCount: node.unreadCount ?? 0,
          tasks: node.tasks?.edges?.map(({ node: task }) => task) ?? [],
        })) ?? [];

      setConversations(nextConversations);
      setSelectedConversationId((currentId) => {
        if (
          currentId !== null &&
          nextConversations.some(({ id }) => id === currentId)
        ) {
          return currentId;
        }

        return nextConversations[0]?.id ?? null;
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const requestVersion = messageRequestVersionRef.current + 1;

    messageRequestVersionRef.current = requestVersion;
    setIsLoadingMessages(true);

    try {
      const client = new CoreApiClient();
      const queryResult = (await client.query({
        inboxMessages: {
          __args: {
            filter: {
              inboxConversationId: {
                eq: conversationId,
              },
            },
            first: 200,
            orderBy: [{ sentAt: 'AscNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              name: true,
              providerMessageKey: true,
              direction: true,
              type: true,
              body: true,
              deliveryStatus: true,
              sentAt: true,
              senderHandle: true,
              senderDisplayName: true,
              mediaUrl: true,
              isInternalNote: true,
            },
          },
        },
      } as never)) as unknown as MessageQueryResult;

      if (requestVersion === messageRequestVersionRef.current) {
        setMessages(
          queryResult.inboxMessages?.edges?.map(({ node }) => node) ?? [],
        );
      }
    } catch (error) {
      if (requestVersion === messageRequestVersionRef.current) {
        setErrorMessage(getErrorMessage(error));
        setMessages([]);
      }
    } finally {
      if (requestVersion === messageRequestVersionRef.current) {
        setIsLoadingMessages(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    setTriageResult(null);

    if (selectedConversationId === null) {
      messageRequestVersionRef.current += 1;
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    void loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  const triageConversation = useCallback(async (): Promise<void> => {
    if (selectedConversationId === null) {
      return;
    }

    setBusyAction('ai-triage');

    try {
      const response = await new RestApiClient().post<InboxTriageResult>(
        `/s${INBOX_TRIAGE_ROUTE}`,
        {
          conversationId: selectedConversationId,
          registerSignal: true,
          proposeReply: true,
        },
      );

      if (!response?.summary || response.conversationId !== selectedConversationId) {
        throw new Error('A IA não retornou uma análise válida para esta conversa.');
      }

      setTriageResult(response);
      await enqueueSnackbar({
        message:
          'Conversa analisada. O rascunho não foi enviado e exige sua revisão.',
        variant: 'success',
      });
    } catch (error) {
      await enqueueSnackbar({
        message: getErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setBusyAction(null);
    }
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(({ id }) => id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const selectConversation = useCallback(
    async (conversationId: string) => {
      setSelectedConversationId(conversationId);

      const conversation = conversations.find(
        ({ id }) => id === conversationId,
      );

      if (!conversation || conversation.unreadCount <= 0) {
        return;
      }

      setConversations((current) =>
        current.map((item) =>
          item.id === conversationId ? { ...item, unreadCount: 0 } : item,
        ),
      );

      try {
        const client = new CoreApiClient();
        await client.mutation({
          updateInboxConversation: {
            __args: {
              id: conversationId,
              data: {
                unreadCount: 0,
              },
            },
            id: true,
          },
        } as never);
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });
      }
    },
    [conversations],
  );

  const setConversationStatus = useCallback(
    async (status: string) => {
      if (selectedConversationId === null) {
        return;
      }

      setBusyAction('status');

      try {
        const client = new CoreApiClient();
        await client.mutation({
          updateInboxConversation: {
            __args: {
              id: selectedConversationId,
              data: {
                status,
                ...(status === 'RESOLVED' ? { unreadCount: 0 } : {}),
              },
            },
            id: true,
            status: true,
          },
        } as never);

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversationId
              ? {
                  ...conversation,
                  status,
                  unreadCount:
                    status === 'RESOLVED' ? 0 : conversation.unreadCount,
                }
              : conversation,
          ),
        );

        await enqueueSnackbar({
          message:
            status === 'RESOLVED'
              ? 'Conversa resolvida.'
              : status === 'PENDING'
                ? 'Conversa marcada como pendente.'
                : 'Conversa reaberta.',
          variant: 'success',
        });
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [selectedConversationId],
  );

  const saveInternalNote = useCallback(
    async (body: string) => {
      const trimmedBody = body.trim();

      if (selectedConversationId === null || trimmedBody.length === 0) {
        return false;
      }

      setBusyAction('note');

      try {
        const client = new CoreApiClient();
        await client.mutation({
          createInboxMessage: {
            __args: {
              data: {
                name:
                  trimmedBody.length > 70
                    ? `${trimmedBody.slice(0, 67)}...`
                    : trimmedBody,
                providerMessageKey: createInternalMessageKey(),
                direction: 'OUTBOUND',
                type: 'TEXT',
                body: trimmedBody,
                deliveryStatus: 'SENT',
                sentAt: new Date().toISOString(),
                isInternalNote: true,
                inboxConversationId: selectedConversationId,
              },
            },
            id: true,
          },
        } as never);

        await loadMessages(selectedConversationId);
        await enqueueSnackbar({
          message: 'Nota interna adicionada.',
          variant: 'success',
        });

        return true;
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });

        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [loadMessages, selectedConversationId],
  );

  const previewEvolutionText = useCallback(
    async (text: string): Promise<EvolutionTextPreview | null> => {
      const trimmedText = text.trim();

      if (selectedConversationId === null || trimmedText.length === 0) {
        return null;
      }

      setBusyAction('send-preview');

      try {
        const response =
          await new RestApiClient().post<EvolutionTextPreview>(
            `/s${EVOLUTION_SEND_TEXT_ROUTE}`,
            {
              conversationId: selectedConversationId,
              text: trimmedText,
              previewOnly: true,
            },
          );

        if (
          !response ||
          response.previewOnly !== true ||
          !response.confirmationToken
        ) {
          throw new Error('O provedor não retornou uma prévia válida.');
        }

        return response;
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });

        return null;
      } finally {
        setBusyAction(null);
      }
    },
    [selectedConversationId],
  );

  const confirmEvolutionText = useCallback(
    async ({
      text,
      confirmationToken,
    }: {
      text: string;
      confirmationToken: string;
    }): Promise<boolean> => {
      const trimmedText = text.trim();

      if (
        selectedConversationId === null ||
        trimmedText.length === 0 ||
        confirmationToken.length === 0
      ) {
        return false;
      }

      setBusyAction('send-confirm');

      try {
        const response =
          await new RestApiClient().post<EvolutionTextReceipt>(
            `/s${EVOLUTION_SEND_TEXT_ROUTE}`,
            {
              conversationId: selectedConversationId,
              text: trimmedText,
              previewOnly: false,
              confirmSend: true,
              confirmationToken,
            },
          );

        if (!response?.sent) {
          throw new Error(
            'A tentativa já foi processada e não foi aceita pelo provedor.',
          );
        }

        await Promise.all([
          loadMessages(selectedConversationId),
          loadConversations(),
        ]);
        await enqueueSnackbar({
          message: 'Mensagem aceita pelo WhatsApp e registrada na inbox.',
          variant: 'success',
        });

        return true;
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });

        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [loadConversations, loadMessages, selectedConversationId],
  );

  const configureEvolution = useCallback(async (): Promise<void> => {
    setBusyAction('configure');

    try {
      const response =
        await new RestApiClient().post<EvolutionConfigureReceipt>(
          `/s${EVOLUTION_CONFIGURE_ROUTE}`,
          {},
        );

      if (!response?.configured) {
        throw new Error('A configuração do WhatsApp não foi concluída.');
      }

      await enqueueSnackbar({
        message: 'Canal Evolution configurado para esta workspace.',
        variant: 'success',
      });
    } catch {
      await enqueueSnackbar({
        message:
          'Não foi possível configurar o canal. Revise a configuração segura no servidor.',
        variant: 'error',
      });
    } finally {
      setBusyAction(null);
    }
  }, []);

  return {
    conversations,
    selectedConversation,
    selectedConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    busyAction,
    errorMessage,
    triageResult,
    loadConversations,
    selectConversation,
    setConversationStatus,
    saveInternalNote,
    previewEvolutionText,
    confirmEvolutionText,
    configureEvolution,
    triageConversation,
  };
};
