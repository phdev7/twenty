import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  type InboxConversationLabelAssignment,
  type InboxLabel,
  type InboxMessage,
  type InboxSavedReply,
  type InboxTask,
  type InboxTriageResult,
  type SavedReplyRenderResult,
} from 'src/modules/inbox/front-components/types/inbox.types';
import {
  getUnresolvedSavedReplyVariables,
  renderSavedReplyTemplate,
} from 'src/modules/inbox/front-components/utils/saved-reply-template';

type ConversationNode = Omit<
  InboxConversation,
  'tasks' | 'labelAssignments'
> & {
  tasks?: {
    edges?: Array<{
      node: InboxTask;
    }>;
  } | null;
  labelAssignments?: {
    edges?: Array<{
      node: Omit<InboxConversationLabelAssignment, 'label'> & {
        inboxLabel?: InboxLabel | null;
      };
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

type SavedReplyQueryResult = {
  inboxSavedReplies?: {
    edges?: Array<{
      node: InboxSavedReply;
    }>;
  };
};

type LabelQueryResult = {
  inboxLabels?: {
    edges?: Array<{
      node: InboxLabel;
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
  const [savedReplies, setSavedReplies] = useState<InboxSavedReply[]>([]);
  const [labels, setLabels] = useState<InboxLabel[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<InboxTriageResult | null>(
    null,
  );
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
              labelAssignments: {
                edges: {
                  node: {
                    id: true,
                    isActive: true,
                    assignedAt: true,
                    removedAt: true,
                    inboxLabel: {
                      id: true,
                      name: true,
                      slug: true,
                      color: true,
                      description: true,
                      status: true,
                      usageCount: true,
                    },
                  },
                },
              },
            },
          },
        },
      } as never)) as unknown as ConversationQueryResult;

      const nextConversations =
        queryResult.inboxConversations?.edges?.map(({ node }) => {
          const { tasks, labelAssignments, ...conversation } = node;

          return {
            ...conversation,
            unreadCount: conversation.unreadCount ?? 0,
            tasks: tasks?.edges?.map(({ node: task }) => task) ?? [],
            labelAssignments:
              labelAssignments?.edges?.flatMap(({ node: assignment }) =>
                assignment.inboxLabel
                  ? [
                      {
                        id: assignment.id,
                        isActive: assignment.isActive,
                        assignedAt: assignment.assignedAt,
                        removedAt: assignment.removedAt,
                        label: {
                          ...assignment.inboxLabel,
                          usageCount: assignment.inboxLabel.usageCount ?? 0,
                        },
                      },
                    ]
                  : [],
              ) ?? [],
          };
        }) ?? [];

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

  const loadSavedReplies = useCallback(async () => {
    try {
      const client = new CoreApiClient();
      const queryResult = (await client.query({
        inboxSavedReplies: {
          __args: {
            filter: {
              status: {
                eq: 'ACTIVE',
              },
            },
            first: 100,
            orderBy: [
              { usageCount: 'DescNullsLast' },
              { name: 'AscNullsLast' },
            ],
          },
          edges: {
            node: {
              id: true,
              name: true,
              shortcut: true,
              body: true,
              status: true,
              channel: true,
              category: true,
              usageCount: true,
              lastUsedAt: true,
            },
          },
        },
      } as never)) as unknown as SavedReplyQueryResult;

      setSavedReplies(
        queryResult.inboxSavedReplies?.edges?.map(({ node }) => ({
          ...node,
          usageCount: node.usageCount ?? 0,
        })) ?? [],
      );
    } catch {
      setSavedReplies([]);
      await enqueueSnackbar({
        message: 'Não foi possível carregar as respostas prontas.',
        variant: 'error',
      });
    }
  }, []);

  const loadLabels = useCallback(async () => {
    try {
      const queryResult = (await new CoreApiClient().query({
        inboxLabels: {
          __args: {
            filter: {
              status: {
                eq: 'ACTIVE',
              },
            },
            first: 100,
            orderBy: [
              { usageCount: 'DescNullsLast' },
              { name: 'AscNullsLast' },
            ],
          },
          edges: {
            node: {
              id: true,
              name: true,
              slug: true,
              color: true,
              description: true,
              status: true,
              usageCount: true,
            },
          },
        },
      } as never)) as unknown as LabelQueryResult;

      setLabels(
        queryResult.inboxLabels?.edges?.map(({ node }) => ({
          ...node,
          usageCount: node.usageCount ?? 0,
        })) ?? [],
      );
    } catch {
      setLabels([]);
      await enqueueSnackbar({
        message: 'Não foi possível carregar as etiquetas da inbox.',
        variant: 'error',
      });
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    void loadSavedReplies();
  }, [loadSavedReplies]);

  useEffect(() => {
    void loadLabels();
  }, [loadLabels]);

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

      if (
        !response?.summary ||
        response.conversationId !== selectedConversationId
      ) {
        throw new Error(
          'A IA não retornou uma análise válida para esta conversa.',
        );
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
    () => conversations.find(({ id }) => id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const applySavedReply = useCallback(
    async (
      savedReply: InboxSavedReply,
    ): Promise<SavedReplyRenderResult | null> => {
      if (selectedConversation === null) {
        return null;
      }

      const renderResult = renderSavedReplyTemplate(
        savedReply.body,
        selectedConversation,
      );
      const usedAt = new Date().toISOString();
      const nextUsageCount = (savedReply.usageCount ?? 0) + 1;

      setSavedReplies((current) =>
        current.map((item) =>
          item.id === savedReply.id
            ? {
                ...item,
                usageCount: nextUsageCount,
                lastUsedAt: usedAt,
              }
            : item,
        ),
      );

      try {
        await new CoreApiClient().mutation({
          updateInboxSavedReply: {
            __args: {
              id: savedReply.id,
              data: {
                usageCount: nextUsageCount,
                lastUsedAt: usedAt,
              },
            },
            id: true,
          },
        } as never);
      } catch {
        await enqueueSnackbar({
          message: 'Resposta inserida, mas o uso não pôde ser contabilizado.',
          variant: 'warning',
        });
      }

      if (renderResult.unresolvedVariables.length > 0) {
        await enqueueSnackbar({
          message: `Complete antes de enviar: ${renderResult.unresolvedVariables
            .map((variable) => `{{${variable}}}`)
            .join(', ')}.`,
          variant: 'warning',
        });
      }

      return renderResult;
    },
    [selectedConversation],
  );

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
        const client = new CoreApiClient();
        let assignmentId = existingAssignment?.id;

        if (existingAssignment) {
          await client.mutation({
            updateInboxConversationLabel: {
              __args: {
                id: existingAssignment.id,
                data: {
                  isActive: shouldActivate,
                  assignedAt: shouldActivate
                    ? changedAt
                    : existingAssignment.assignedAt,
                  removedAt: shouldActivate ? null : changedAt,
                },
              },
              id: true,
            },
          } as never);
        } else {
          const result = (await client.mutation({
            createInboxConversationLabel: {
              __args: {
                data: {
                  name: `${selectedConversation.id}:${label.id}`,
                  isActive: true,
                  assignedAt: changedAt,
                  removedAt: null,
                  inboxConversationId: selectedConversation.id,
                  inboxLabelId: label.id,
                },
              },
              id: true,
            },
          } as never)) as unknown as {
            createInboxConversationLabel?: {
              id?: string | null;
            } | null;
          };

          assignmentId = result.createInboxConversationLabel?.id ?? undefined;

          if (!assignmentId) {
            throw new Error('Etiqueta não vinculada.');
          }
        }

        const nextAssignment: InboxConversationLabelAssignment = {
          id: assignmentId ?? existingAssignment?.id ?? '',
          isActive: shouldActivate,
          assignedAt: shouldActivate
            ? changedAt
            : existingAssignment?.assignedAt,
          removedAt: shouldActivate ? null : changedAt,
          label,
        };

        setConversations((current) =>
          current.map((conversation) => {
            if (conversation.id !== selectedConversation.id) {
              return conversation;
            }

            return {
              ...conversation,
              labelAssignments: existingAssignment
                ? conversation.labelAssignments.map((assignment) =>
                    assignment.id === existingAssignment.id
                      ? nextAssignment
                      : assignment,
                  )
                : [...conversation.labelAssignments, nextAssignment],
            };
          }),
        );

        if (shouldActivate) {
          const nextUsageCount = (label.usageCount ?? 0) + 1;

          setLabels((current) =>
            current.map((item) =>
              item.id === label.id
                ? { ...item, usageCount: nextUsageCount }
                : item,
            ),
          );

          try {
            await client.mutation({
              updateInboxLabel: {
                __args: {
                  id: label.id,
                  data: {
                    usageCount: nextUsageCount,
                  },
                },
                id: true,
              },
            } as never);
          } catch {
            await enqueueSnackbar({
              message:
                'Etiqueta aplicada, mas a contagem de uso não foi atualizada.',
              variant: 'warning',
            });
          }
        }
      } catch {
        await enqueueSnackbar({
          message: 'Não foi possível atualizar as etiquetas da conversa.',
          variant: 'error',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [selectedConversation],
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

      const unresolvedVariables = getUnresolvedSavedReplyVariables(trimmedText);

      if (unresolvedVariables.length > 0) {
        await enqueueSnackbar({
          message: `Resolva os placeholders antes do envio: ${unresolvedVariables
            .map((variable) => `{{${variable}}}`)
            .join(', ')}.`,
          variant: 'warning',
        });

        return null;
      }

      setBusyAction('send-preview');

      try {
        const response = await new RestApiClient().post<EvolutionTextPreview>(
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
        const response = await new RestApiClient().post<EvolutionTextReceipt>(
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
    savedReplies,
    labels,
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
    applySavedReply,
    toggleConversationLabel,
    setConversationStatus,
    saveInternalNote,
    previewEvolutionText,
    confirmEvolutionText,
    configureEvolution,
    triageConversation,
  };
};
