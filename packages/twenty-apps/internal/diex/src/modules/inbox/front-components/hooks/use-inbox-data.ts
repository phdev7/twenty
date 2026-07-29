import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import {
  EVOLUTION_CONFIGURE_ROUTE,
  EVOLUTION_SEND_TEXT_ROUTE,
} from 'src/modules/inbox/constants/evolution.constants';
import { INBOX_TRIAGE_ROUTE } from 'src/modules/inbox/constants/inbox-ai.constants';
import {
  type EvolutionConfigureReceipt,
  type InboxExternalMessagePreview,
  type EvolutionTextPreview,
  type EvolutionTextReceipt,
  type InboxConversation,
  type InboxConversationLabelAssignment,
  type InboxLabel,
  type InboxMacro,
  type InboxMacroApplyResult,
  type InboxMacroPreview,
  type InboxMention,
  type InboxMessage,
  type InboxSavedReply,
  type InboxTask,
  type InboxTaskDraft,
  type InboxTeam,
  type InboxTeamMembership,
  type InboxTriageResult,
  type InboxWorkspaceMember,
  type SavedReplyRenderResult,
} from 'src/modules/inbox/front-components/types/inbox.types';
import {
  getUnresolvedSavedReplyVariables,
  renderSavedReplyTemplate,
} from 'src/modules/inbox/front-components/utils/saved-reply-template';
import { getRecordName } from 'src/modules/inbox/front-components/utils/inbox-formatters';
import { useInboxConversationActivity } from 'src/modules/inbox/front-components/hooks/use-inbox-conversation-activity';
import {
  loadEligibleTwentyEmailChannels,
  readTwentyEmailConversationMetadata,
  syncTwentyEmailToInbox,
} from 'src/modules/inbox/front-components/utils/twenty-email';

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

type MentionQueryResult = {
  inboxMentions?: {
    edges?: Array<{
      node: InboxMention;
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

type MacroQueryResult = {
  inboxMacros?: {
    edges?: Array<{
      node: Omit<InboxMacro, 'inboxTeam'> & {
        inboxTeam?: TeamNode | null;
      };
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

type WorkspaceMemberQueryResult = {
  workspaceMembers?: {
    edges?: Array<{
      node: InboxWorkspaceMember;
    }>;
  };
};

type TeamNode = Omit<InboxTeam, 'memberships'> & {
  memberships?: {
    edges?: Array<{
      node: InboxTeamMembership;
    }>;
  } | null;
};

type TeamQueryResult = {
  inboxTeams?: {
    edges?: Array<{
      node: TeamNode;
    }>;
  };
};

const mentionNodeSelection = {
  id: true,
  name: true,
  excerpt: true,
  status: true,
  mentionedAt: true,
  readAt: true,
  resolvedAt: true,
  inboxConversation: {
    id: true,
    name: true,
  },
  inboxMessage: {
    id: true,
    name: true,
  },
  mentionedWorkspaceMember: {
    id: true,
    name: {
      firstName: true,
      lastName: true,
    },
    avatarUrl: true,
  },
  authorWorkspaceMember: {
    id: true,
    name: {
      firstName: true,
      lastName: true,
    },
    avatarUrl: true,
  },
} as const;

const macroConversationStatusLabels: Record<string, string> = {
  OPEN: 'Aberta',
  PENDING: 'Pendente',
  SNOOZED: 'Adiada',
  RESOLVED: 'Resolvida',
};

const macroPriorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const INBOX_POLL_INTERVAL_MS = 10_000;

type SilentLoadOptions = { silent?: boolean };

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Não foi possível carregar a inbox.';

const createInternalMessageKey = (): string => {
  const randomPart =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `internal:${randomPart}`;
};

const getNextFollowUpDueAt = (tasks: InboxTask[]): string | null => {
  const dueAtTimestamps = tasks
    .filter(({ status, dueAt }) => status !== 'DONE' && Boolean(dueAt))
    .map(({ dueAt }) => new Date(dueAt as string).getTime())
    .filter(Number.isFinite);

  return dueAtTimestamps.length > 0
    ? new Date(Math.min(...dueAtTimestamps)).toISOString()
    : null;
};

const getActiveTeamMembers = (team?: InboxTeam | null) =>
  team?.memberships
    ?.filter(({ isActive, workspaceMember }) => isActive && workspaceMember)
    .flatMap(({ workspaceMember }) =>
      workspaceMember ? [workspaceMember] : [],
    ) ?? [];

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

export const useInboxData = () => {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [conversationMentions, setConversationMentions] = useState<
    InboxMention[]
  >([]);
  const [pendingMentions, setPendingMentions] = useState<InboxMention[]>([]);
  const [currentWorkspaceMemberId, setCurrentWorkspaceMemberId] = useState<
    string | null
  >(null);
  const [savedReplies, setSavedReplies] = useState<InboxSavedReply[]>([]);
  const [macros, setMacros] = useState<InboxMacro[]>([]);
  const [labels, setLabels] = useState<InboxLabel[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<
    InboxWorkspaceMember[]
  >([]);
  const [teams, setTeams] = useState<InboxTeam[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<InboxTriageResult | null>(
    null,
  );
  const messageRequestVersionRef = useRef(0);
  const mentionRequestVersionRef = useRef(0);
  const isPollingRef = useRef(false);
  const consumedEmailConfirmationTokensRef = useRef(new Set<string>());
  const {
    conversationEvents,
    loadConversationEvents,
    recordConversationEvent,
  } = useInboxConversationActivity({
    selectedConversationId,
    currentWorkspaceMemberId,
  });

  const loadConversations = useCallback(async (options?: SilentLoadOptions) => {
    if (options?.silent !== true) {
      setIsLoadingConversations(true);
    }

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
              metadata: true,
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
              inboxTeam: {
                id: true,
                name: true,
                key: true,
                description: true,
                status: true,
                routingStrategy: true,
                defaultResponseSlaMinutes: true,
                isDefault: true,
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
                    assignee: {
                      id: true,
                      name: {
                        firstName: true,
                        lastName: true,
                      },
                      avatarUrl: true,
                    },
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

      const loadedConversations =
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
      const expiredSnoozes = loadedConversations.filter(
        (conversation) =>
          conversation.status === 'SNOOZED' &&
          typeof conversation.snoozedUntil === 'string' &&
          new Date(conversation.snoozedUntil).getTime() <= Date.now(),
      );
      const reopenedConversationIds = new Set(
        (
          await Promise.all(
            expiredSnoozes.map(async (conversation) => {
              try {
                await client.mutation({
                  updateInboxConversation: {
                    __args: {
                      id: conversation.id,
                      data: {
                        status: 'OPEN',
                        snoozedUntil: null,
                      },
                    },
                    id: true,
                  },
                } as never);

                return conversation.id;
              } catch {
                return null;
              }
            }),
          )
        ).filter((id): id is string => typeof id === 'string'),
      );
      const nextConversations = loadedConversations.map((conversation) =>
        reopenedConversationIds.has(conversation.id)
          ? {
              ...conversation,
              status: 'OPEN',
              snoozedUntil: null,
            }
          : conversation,
      );

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

  const loadMessages = useCallback(
    async (conversationId: string, options?: SilentLoadOptions) => {
      const requestVersion = messageRequestVersionRef.current + 1;

      messageRequestVersionRef.current = requestVersion;

      if (options?.silent !== true) {
        setIsLoadingMessages(true);
      }

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
                messageType: true,
                body: true,
                deliveryStatus: true,
                sentAt: true,
                senderHandle: true,
                senderDisplayName: true,
                mediaUrl: true,
                isInternalNote: true,
                metadata: true,
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
    },
    [],
  );

  const refreshInbox = useCallback(
    async (options?: SilentLoadOptions): Promise<void> => {
      await Promise.all([
        loadConversations(options),
        ...(selectedConversationId
          ? [
              loadMessages(selectedConversationId, options),
              loadConversationEvents(selectedConversationId),
            ]
          : []),
      ]);
    },
    [
      loadConversationEvents,
      loadConversations,
      loadMessages,
      selectedConversationId,
    ],
  );

  const loadCurrentWorkspaceMember = useCallback(async () => {
    try {
      const { currentUser } = await new MetadataApiClient().query({
        currentUser: {
          id: true,
          workspaceMember: {
            id: true,
          },
        },
      });

      setCurrentWorkspaceMemberId(currentUser.workspaceMember?.id ?? null);
    } catch {
      setCurrentWorkspaceMemberId(null);
      await enqueueSnackbar({
        message:
          'Não foi possível identificar seu usuário para carregar as menções.',
        variant: 'warning',
      });
    }
  }, []);

  const loadMentions = useCallback(
    async (conversationId: string | null, workspaceMemberId: string | null) => {
      const requestVersion = mentionRequestVersionRef.current + 1;

      mentionRequestVersionRef.current = requestVersion;

      try {
        const client = new CoreApiClient();
        const [conversationResult, memberResult] = await Promise.all([
          conversationId
            ? client.query({
                inboxMentions: {
                  __args: {
                    filter: {
                      inboxConversationId: {
                        eq: conversationId,
                      },
                    },
                    first: 200,
                    orderBy: [{ mentionedAt: 'DescNullsLast' }],
                  },
                  edges: {
                    node: mentionNodeSelection,
                  },
                },
              } as never)
            : Promise.resolve({}),
          workspaceMemberId
            ? client.query({
                inboxMentions: {
                  __args: {
                    filter: {
                      mentionedWorkspaceMemberId: {
                        eq: workspaceMemberId,
                      },
                    },
                    first: 500,
                    orderBy: [{ mentionedAt: 'DescNullsLast' }],
                  },
                  edges: {
                    node: mentionNodeSelection,
                  },
                },
              } as never)
            : Promise.resolve({}),
        ]);
        const conversationQuery =
          conversationResult as unknown as MentionQueryResult;
        const memberQuery = memberResult as unknown as MentionQueryResult;

        if (requestVersion === mentionRequestVersionRef.current) {
          setConversationMentions(
            conversationQuery.inboxMentions?.edges?.map(({ node }) => node) ??
              [],
          );
          setPendingMentions(
            memberQuery.inboxMentions?.edges
              ?.map(({ node }) => node)
              .filter(({ status }) => status !== 'RESOLVED') ?? [],
          );
        }
      } catch {
        if (requestVersion === mentionRequestVersionRef.current) {
          setConversationMentions([]);
          setPendingMentions([]);
          await enqueueSnackbar({
            message: 'Não foi possível carregar as menções da Inbox.',
            variant: 'warning',
          });
        }
      }
    },
    [],
  );

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

  const loadMacros = useCallback(async () => {
    try {
      const queryResult = (await new CoreApiClient().query({
        inboxMacros: {
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
              description: true,
              status: true,
              channel: true,
              targetConversationStatus: true,
              targetPriority: true,
              internalNoteTemplate: true,
              usageCount: true,
              lastUsedAt: true,
              savedReply: {
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
              inboxLabel: {
                id: true,
                name: true,
                slug: true,
                color: true,
                description: true,
                status: true,
                usageCount: true,
              },
              inboxTeam: {
                id: true,
                name: true,
                key: true,
                description: true,
                status: true,
                routingStrategy: true,
                defaultResponseSlaMinutes: true,
                isDefault: true,
                memberships: {
                  edges: {
                    node: {
                      id: true,
                      memberRole: true,
                      isActive: true,
                      joinedAt: true,
                      workspaceMember: {
                        id: true,
                        name: {
                          firstName: true,
                          lastName: true,
                        },
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
              assignee: {
                id: true,
                name: {
                  firstName: true,
                  lastName: true,
                },
                avatarUrl: true,
              },
            },
          },
        },
      } as never)) as unknown as MacroQueryResult;

      setMacros(
        queryResult.inboxMacros?.edges?.map(({ node }) => {
          const { inboxTeam, ...macro } = node;

          return {
            ...macro,
            usageCount: macro.usageCount ?? 0,
            savedReply: macro.savedReply
              ? {
                  ...macro.savedReply,
                  usageCount: macro.savedReply.usageCount ?? 0,
                }
              : null,
            inboxLabel: macro.inboxLabel
              ? {
                  ...macro.inboxLabel,
                  usageCount: macro.inboxLabel.usageCount ?? 0,
                }
              : null,
            inboxTeam: inboxTeam
              ? {
                  ...inboxTeam,
                  defaultResponseSlaMinutes:
                    inboxTeam.defaultResponseSlaMinutes > 0
                      ? inboxTeam.defaultResponseSlaMinutes
                      : 60,
                  memberships:
                    inboxTeam.memberships?.edges?.map(
                      ({ node: membership }) => membership,
                    ) ?? [],
                }
              : null,
          };
        }) ?? [],
      );
    } catch {
      setMacros([]);
      await enqueueSnackbar({
        message: 'Não foi possível carregar as macros da Inbox.',
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

  const loadWorkspaceMembers = useCallback(async () => {
    try {
      const queryResult = (await new CoreApiClient().query({
        workspaceMembers: {
          __args: {
            first: 100,
          },
          edges: {
            node: {
              id: true,
              name: {
                firstName: true,
                lastName: true,
              },
              avatarUrl: true,
            },
          },
        },
      } as never)) as unknown as WorkspaceMemberQueryResult;

      setWorkspaceMembers(
        queryResult.workspaceMembers?.edges?.map(({ node }) => node) ?? [],
      );
    } catch {
      setWorkspaceMembers([]);
      await enqueueSnackbar({
        message: 'Não foi possível carregar os responsáveis da Inbox.',
        variant: 'error',
      });
    }
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      const queryResult = (await new CoreApiClient().query({
        inboxTeams: {
          __args: {
            filter: {
              status: {
                eq: 'ACTIVE',
              },
            },
            first: 100,
            orderBy: [{ name: 'AscNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              name: true,
              key: true,
              description: true,
              status: true,
              routingStrategy: true,
              defaultResponseSlaMinutes: true,
              isDefault: true,
              memberships: {
                edges: {
                  node: {
                    id: true,
                    memberRole: true,
                    isActive: true,
                    joinedAt: true,
                    workspaceMember: {
                      id: true,
                      name: {
                        firstName: true,
                        lastName: true,
                      },
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      } as never)) as unknown as TeamQueryResult;

      setTeams(
        queryResult.inboxTeams?.edges?.map(({ node }) => {
          const { memberships, ...team } = node;

          return {
            ...team,
            defaultResponseSlaMinutes:
              team.defaultResponseSlaMinutes > 0
                ? team.defaultResponseSlaMinutes
                : 60,
            memberships:
              memberships?.edges?.map(({ node: membership }) => membership) ??
              [],
          };
        }) ?? [],
      );
    } catch {
      setTeams([]);
      await enqueueSnackbar({
        message: 'Não foi possível carregar as equipes da Inbox.',
        variant: 'error',
      });
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Nothing pushes provider messages down to a front component, so a live
  // conversation only stays live if the inbox re-reads on its own. One request
  // at a time, otherwise a slow round trip stacks up behind the next tick.
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;

      void refreshInbox({ silent: true }).finally(() => {
        isPollingRef.current = false;
      });
    }, INBOX_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refreshInbox]);

  useEffect(() => {
    void loadSavedReplies();
  }, [loadSavedReplies]);

  useEffect(() => {
    void loadMacros();
  }, [loadMacros]);

  useEffect(() => {
    void loadLabels();
  }, [loadLabels]);

  useEffect(() => {
    void loadWorkspaceMembers();
  }, [loadWorkspaceMembers]);

  useEffect(() => {
    void loadCurrentWorkspaceMember();
  }, [loadCurrentWorkspaceMember]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    void loadMentions(selectedConversationId, currentWorkspaceMemberId);
  }, [currentWorkspaceMemberId, loadMentions, selectedConversationId]);

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
      await enqueueSnackbar({
        message: eventRecorded
          ? 'Conversa analisada. O rascunho não foi enviado e exige sua revisão.'
          : 'Conversa analisada, mas o evento não entrou no histórico.',
        variant: eventRecorded ? 'success' : 'warning',
      });
    } catch (error) {
      await enqueueSnackbar({
        message: getErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setBusyAction(null);
    }
  }, [recordConversationEvent, selectedConversationId]);

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

  const previewInboxMacro = useCallback(
    async (macroId: string): Promise<InboxMacroPreview | null> => {
      if (selectedConversation === null) {
        return null;
      }

      const macro = macros.find(
        ({ id, status }) => id === macroId && status === 'ACTIVE',
      );

      if (!macro) {
        await enqueueSnackbar({
          message: 'A macro selecionada não está mais disponível.',
          variant: 'warning',
        });

        return null;
      }

      if (
        macro.channel !== 'ALL' &&
        macro.channel !== selectedConversation.channel
      ) {
        await enqueueSnackbar({
          message: 'Esta macro não está habilitada para o canal da conversa.',
          variant: 'warning',
        });

        return null;
      }

      if (macro.inboxLabel && macro.inboxLabel.status !== 'ACTIVE') {
        await enqueueSnackbar({
          message: 'A etiqueta configurada na macro está inativa.',
          variant: 'warning',
        });

        return null;
      }

      if (macro.inboxTeam && macro.inboxTeam.status !== 'ACTIVE') {
        await enqueueSnackbar({
          message: 'A equipe configurada na macro está inativa.',
          variant: 'warning',
        });

        return null;
      }

      if (
        macro.savedReply &&
        (macro.savedReply.status !== 'ACTIVE' ||
          (macro.savedReply.channel !== 'ALL' &&
            macro.savedReply.channel !== selectedConversation.channel))
      ) {
        await enqueueSnackbar({
          message:
            'A resposta pronta configurada na macro não está disponível para este canal.',
          variant: 'warning',
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
          `Status → ${
            macroConversationStatusLabels[macro.targetConversationStatus] ??
            macro.targetConversationStatus
          }`,
        );
      }

      if (macro.targetPriority !== 'KEEP') {
        actions.push(
          `Prioridade → ${
            macroPriorityLabels[macro.targetPriority] ?? macro.targetPriority
          }`,
        );
      }

      if (macro.inboxTeam) {
        actions.push(`Equipe → ${macro.inboxTeam.name}`);
      }

      if (macro.assignee) {
        actions.push(
          `Responsável → ${
            getRecordName(macro.assignee) || 'Usuário sem nome'
          }`,
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
        await enqueueSnackbar({
          message: 'Esta macro ainda não possui ações configuradas.',
          variant: 'warning',
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
    [macros, selectedConversation],
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
        await enqueueSnackbar({
          message: `A nota da macro possui variáveis sem valor: ${preview.unresolvedNoteVariables
            .map((variable) => `{{${variable}}}`)
            .join(', ')}.`,
          variant: 'warning',
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
      const macroSavedReply = macro.savedReply
        ? (savedReplies.find(({ id }) => id === macro.savedReply?.id) ??
          macro.savedReply)
        : null;

      if (macro.assignee && !availableAssignee) {
        await enqueueSnackbar({
          message: 'O responsável configurado na macro não está disponível.',
          variant: 'warning',
        });

        return null;
      }

      if (
        macro.assignee &&
        !targetTeam &&
        selectedConversation.inboxTeam &&
        !currentTeam
      ) {
        await enqueueSnackbar({
          message:
            'A equipe atual não pôde ser validada para aplicar o responsável da macro.',
          variant: 'warning',
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
        await enqueueSnackbar({
          message:
            'O responsável da macro não pertence à equipe ativa da conversa.',
          variant: 'warning',
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
        const client = new CoreApiClient();
        const appliedActions: string[] = [];
        const warnings: string[] = [];
        const usedAt = new Date().toISOString();

        if (Object.keys(conversationUpdate).length > 0) {
          await client.mutation({
            updateInboxConversation: {
              __args: {
                id: selectedConversation.id,
                data: conversationUpdate,
              },
              id: true,
            },
          } as never);

          if (macro.targetConversationStatus !== 'KEEP') {
            appliedActions.push(
              `Status → ${
                macroConversationStatusLabels[nextStatus] ?? nextStatus
              }`,
            );
          }

          if (macro.targetPriority !== 'KEEP') {
            appliedActions.push(
              `Prioridade → ${
                macroPriorityLabels[nextPriority] ?? nextPriority
              }`,
            );
          }

          if (targetTeam) {
            appliedActions.push(`Equipe → ${targetTeam.name}`);

            if (nextAssignee) {
              appliedActions.push(
                `Responsável → ${
                  getRecordName(nextAssignee) || 'Usuário sem nome'
                }`,
              );
            }
          } else if (availableAssignee) {
            appliedActions.push(
              `Responsável → ${
                getRecordName(availableAssignee) || 'Usuário sem nome'
              }`,
            );
          }

          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === selectedConversation.id
                ? {
                    ...conversation,
                    status: nextStatus,
                    priority: nextPriority,
                    snoozedUntil:
                      macro.targetConversationStatus === 'KEEP'
                        ? conversation.snoozedUntil
                        : null,
                    unreadCount:
                      nextStatus === 'RESOLVED' ? 0 : conversation.unreadCount,
                    inboxTeam: targetTeam ?? conversation.inboxTeam,
                    assignee:
                      targetTeam || availableAssignee
                        ? nextAssignee
                        : conversation.assignee,
                    firstResponseDueAt: targetTeam
                      ? nextFirstResponseDueAt
                      : conversation.firstResponseDueAt,
                    slaBreachedAt: shouldResetResponseSla
                      ? null
                      : conversation.slaBreachedAt,
                  }
                : conversation,
            ),
          );
        }

        if (macro.inboxLabel) {
          const label =
            labels.find(({ id }) => id === macro.inboxLabel?.id) ??
            macro.inboxLabel;
          const existingAssignment = selectedConversation.labelAssignments.find(
            (assignment) => assignment.label.id === label.id,
          );

          try {
            let assignmentId = existingAssignment?.id;

            if (existingAssignment?.isActive) {
              appliedActions.push(`Etiqueta mantida → ${label.name}`);
            } else {
              if (existingAssignment) {
                await client.mutation({
                  updateInboxConversationLabel: {
                    __args: {
                      id: existingAssignment.id,
                      data: {
                        isActive: true,
                        assignedAt: usedAt,
                        removedAt: null,
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
                        assignedAt: usedAt,
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

                assignmentId =
                  result.createInboxConversationLabel?.id ?? undefined;
              }

              if (!assignmentId) {
                throw new Error('A etiqueta não retornou um vínculo.');
              }

              const nextAssignment: InboxConversationLabelAssignment = {
                id: assignmentId,
                isActive: true,
                assignedAt: usedAt,
                removedAt: null,
                label,
              };

              setConversations((current) =>
                current.map((conversation) =>
                  conversation.id === selectedConversation.id
                    ? {
                        ...conversation,
                        labelAssignments: existingAssignment
                          ? conversation.labelAssignments.map((assignment) =>
                              assignment.id === existingAssignment.id
                                ? nextAssignment
                                : assignment,
                            )
                          : [...conversation.labelAssignments, nextAssignment],
                      }
                    : conversation,
                ),
              );
              appliedActions.push(`Etiqueta aplicada → ${label.name}`);

              const nextLabelUsageCount = (label.usageCount ?? 0) + 1;

              setLabels((current) =>
                current.map((item) =>
                  item.id === label.id
                    ? {
                        ...item,
                        usageCount: nextLabelUsageCount,
                      }
                    : item,
                ),
              );

              try {
                await client.mutation({
                  updateInboxLabel: {
                    __args: {
                      id: label.id,
                      data: {
                        usageCount: nextLabelUsageCount,
                      },
                    },
                    id: true,
                  },
                } as never);
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
            await client.mutation({
              createInboxMessage: {
                __args: {
                  data: {
                    name:
                      preview.internalNote.length > 70
                        ? `${preview.internalNote.slice(0, 67)}...`
                        : preview.internalNote,
                    providerMessageKey: createInternalMessageKey(),
                    direction: 'OUTBOUND',
                    type: 'TEXT',
                    body: preview.internalNote,
                    deliveryStatus: 'SENT',
                    sentAt: usedAt,
                    isInternalNote: true,
                    inboxConversationId: selectedConversation.id,
                  },
                },
                id: true,
              },
            } as never);
            await loadMessages(selectedConversation.id);
            appliedActions.push('Nota interna registrada');
          } catch {
            warnings.push('A nota interna da macro não pôde ser registrada.');
          }
        }

        if (preview.replyDraft && macroSavedReply) {
          appliedActions.push(
            `Rascunho /${macroSavedReply.shortcut} preparado`,
          );
        }

        if (appliedActions.length === 0) {
          throw new Error('Nenhuma ação da macro pôde ser aplicada.');
        }

        const nextMacroUsageCount = (macro.usageCount ?? 0) + 1;
        const usageUpdates = [
          client.mutation({
            updateInboxMacro: {
              __args: {
                id: macro.id,
                data: {
                  usageCount: nextMacroUsageCount,
                  lastUsedAt: usedAt,
                },
              },
              id: true,
            },
          } as never),
        ];

        setMacros((current) =>
          current.map((item) =>
            item.id === macro.id
              ? {
                  ...item,
                  usageCount: nextMacroUsageCount,
                  lastUsedAt: usedAt,
                }
              : item,
          ),
        );

        if (preview.replyDraft && macroSavedReply) {
          const savedReply = macroSavedReply;
          const nextSavedReplyUsageCount = (savedReply.usageCount ?? 0) + 1;

          usageUpdates.push(
            client.mutation({
              updateInboxSavedReply: {
                __args: {
                  id: savedReply.id,
                  data: {
                    usageCount: nextSavedReplyUsageCount,
                    lastUsedAt: usedAt,
                  },
                },
                id: true,
              },
            } as never),
          );
          setSavedReplies((current) =>
            current.map((item) =>
              item.id === savedReply.id
                ? {
                    ...item,
                    usageCount: nextSavedReplyUsageCount,
                    lastUsedAt: usedAt,
                  }
                : item,
            ),
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

        await enqueueSnackbar({
          message:
            warnings.length > 0
              ? `Macro aplicada com ${warnings.length} aviso${
                  warnings.length === 1 ? '' : 's'
                }.`
              : `Macro aplicada: ${appliedActions.length} ação${
                  appliedActions.length === 1 ? '' : 'ões'
                }.`,
          variant: warnings.length > 0 ? 'warning' : 'success',
        });

        return {
          macroId: macro.id,
          appliedActions,
          warnings,
          replyDraft: preview.replyDraft,
          unresolvedReplyVariables: preview.unresolvedReplyVariables,
        };
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
    [
      conversations,
      labels,
      loadMessages,
      macros,
      previewInboxMacro,
      recordConversationEvent,
      savedReplies,
      selectedConversation,
      teams,
      workspaceMembers,
    ],
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

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'LABEL_CHANGED',
          summary: shouldActivate
            ? `Etiqueta aplicada: ${label.name}`
            : `Etiqueta removida: ${label.name}`,
        });

        if (!eventRecorded) {
          await enqueueSnackbar({
            message:
              'Etiqueta atualizada, mas o evento não entrou no histórico.',
            variant: 'warning',
          });
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
    [recordConversationEvent, selectedConversation],
  );

  const setConversationAssignee = useCallback(
    async (workspaceMemberId: string | null): Promise<void> => {
      if (selectedConversation === null) {
        return;
      }

      const nextAssignee =
        workspaceMemberId === null
          ? null
          : (workspaceMembers.find(
              (workspaceMember) => workspaceMember.id === workspaceMemberId,
            ) ?? null);

      if (workspaceMemberId !== null && nextAssignee === null) {
        await enqueueSnackbar({
          message: 'O responsável selecionado não está mais disponível.',
          variant: 'warning',
        });

        return;
      }

      const selectedTeam = selectedConversation.inboxTeam
        ? teams.find(({ id }) => id === selectedConversation.inboxTeam?.id)
        : null;

      if (selectedConversation.inboxTeam && !selectedTeam) {
        await enqueueSnackbar({
          message:
            'A equipe da conversa não pôde ser validada. Atualize a Inbox.',
          variant: 'warning',
        });

        return;
      }

      const activeTeamMemberIds = new Set(
        getActiveTeamMembers(selectedTeam).map(({ id }) => id),
      );

      if (
        workspaceMemberId !== null &&
        selectedTeam &&
        !activeTeamMemberIds.has(workspaceMemberId)
      ) {
        await enqueueSnackbar({
          message:
            'O responsável precisa ser membro ativo da equipe selecionada.',
          variant: 'warning',
        });

        return;
      }

      setBusyAction('assign-conversation');

      try {
        await new CoreApiClient().mutation({
          updateInboxConversation: {
            __args: {
              id: selectedConversation.id,
              data: {
                assigneeId: workspaceMemberId,
              },
            },
            id: true,
          },
        } as never);

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversation.id
              ? {
                  ...conversation,
                  assignee: nextAssignee,
                }
              : conversation,
          ),
        );

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'ASSIGNEE_CHANGED',
          summary: nextAssignee
            ? `Responsável definido: ${
                getRecordName(nextAssignee) || 'Usuário sem nome'
              }`
            : 'Responsável removido',
          details: `Anterior: ${
            getRecordName(selectedConversation.assignee) || 'Sem responsável'
          }`,
        });

        if (!eventRecorded) {
          await enqueueSnackbar({
            message:
              'Responsável atualizado, mas o evento não entrou no histórico.',
            variant: 'warning',
          });
        }
      } catch {
        await enqueueSnackbar({
          message: 'Não foi possível alterar o responsável da conversa.',
          variant: 'error',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [recordConversationEvent, selectedConversation, teams, workspaceMembers],
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
        await enqueueSnackbar({
          message: 'A equipe selecionada não está mais disponível.',
          variant: 'warning',
        });

        return;
      }

      const activeMembers = getActiveTeamMembers(nextTeam);
      const activeMemberIds = new Set(activeMembers.map(({ id }) => id));
      let nextAssignee =
        selectedConversation.assignee &&
        (nextTeam === null ||
          activeMemberIds.has(selectedConversation.assignee.id))
          ? selectedConversation.assignee
          : null;

      if (nextTeam?.routingStrategy === 'BALANCED') {
        nextAssignee = getLeastLoadedTeamMember({
          team: nextTeam,
          conversations,
          excludedConversationId: selectedConversation.id,
        });
      }

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
        await new CoreApiClient().mutation({
          updateInboxConversation: {
            __args: {
              id: selectedConversation.id,
              data: {
                inboxTeamId: teamId,
                assigneeId: nextAssignee?.id ?? null,
                firstResponseDueAt: nextFirstResponseDueAt,
                ...(shouldResetResponseSla
                  ? {
                      slaBreachedAt: null,
                    }
                  : {}),
              },
            },
            id: true,
          },
        } as never);

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversation.id
              ? {
                  ...conversation,
                  inboxTeam: nextTeam
                    ? {
                        ...nextTeam,
                        memberships: undefined,
                      }
                    : null,
                  assignee: nextAssignee,
                  firstResponseDueAt: nextFirstResponseDueAt,
                  slaBreachedAt: shouldResetResponseSla
                    ? null
                    : conversation.slaBreachedAt,
                }
              : conversation,
          ),
        );

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

        await enqueueSnackbar({
          message: eventRecorded
            ? nextTeam
              ? nextAssignee
                ? `Conversa enviada para ${nextTeam.name} e distribuída.`
                : `Conversa enviada para ${nextTeam.name}, aguardando responsável.`
              : 'Conversa removida da fila de equipe.'
            : 'Equipe atualizada, mas o evento não entrou no histórico.',
          variant: eventRecorded ? 'success' : 'warning',
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
    [conversations, recordConversationEvent, selectedConversation, teams],
  );

  const setConversationPriority = useCallback(
    async (priority: string): Promise<void> => {
      if (selectedConversationId === null) {
        return;
      }

      if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
        await enqueueSnackbar({
          message: 'A prioridade selecionada não é válida.',
          variant: 'warning',
        });

        return;
      }

      const previousPriority =
        conversations.find(({ id }) => id === selectedConversationId)
          ?.priority ?? 'NORMAL';

      setBusyAction('priority');

      try {
        await new CoreApiClient().mutation({
          updateInboxConversation: {
            __args: {
              id: selectedConversationId,
              data: {
                priority,
              },
            },
            id: true,
          },
        } as never);

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversationId
              ? {
                  ...conversation,
                  priority,
                }
              : conversation,
          ),
        );

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversationId,
          eventType: 'PRIORITY_CHANGED',
          summary: `Prioridade definida: ${
            macroPriorityLabels[priority] ?? priority
          }`,
          details: `Anterior: ${
            macroPriorityLabels[previousPriority] ?? previousPriority
          }`,
        });

        await enqueueSnackbar({
          message: eventRecorded
            ? 'Prioridade da conversa atualizada.'
            : 'Prioridade atualizada, mas o evento não entrou no histórico.',
          variant: eventRecorded ? 'success' : 'warning',
        });
      } catch {
        await enqueueSnackbar({
          message: 'Não foi possível atualizar a prioridade da conversa.',
          variant: 'error',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [conversations, recordConversationEvent, selectedConversationId],
  );

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
        await enqueueSnackbar({
          message: 'A próxima ação precisa ter entre 1 e 255 caracteres.',
          variant: 'warning',
        });

        return false;
      }

      if (
        !Number.isFinite(dueAtTimestamp) ||
        dueAtTimestamp < minimumDueAt ||
        dueAtTimestamp > maximumDueAt
      ) {
        await enqueueSnackbar({
          message: 'Defina um prazo futuro de até dois anos.',
          variant: 'warning',
        });

        return false;
      }

      if (assigneeId !== null && assignee === null) {
        await enqueueSnackbar({
          message: 'O responsável selecionado não está mais disponível.',
          variant: 'warning',
        });

        return false;
      }

      const selectedTeam = selectedConversation.inboxTeam
        ? teams.find(({ id }) => id === selectedConversation.inboxTeam?.id)
        : null;

      if (selectedConversation.inboxTeam && !selectedTeam) {
        await enqueueSnackbar({
          message:
            'A equipe da conversa não pôde ser validada. Atualize a Inbox.',
          variant: 'warning',
        });

        return false;
      }

      if (
        assigneeId !== null &&
        selectedTeam &&
        !getActiveTeamMembers(selectedTeam).some(({ id }) => id === assigneeId)
      ) {
        await enqueueSnackbar({
          message:
            'O responsável da tarefa precisa pertencer à equipe da conversa.',
          variant: 'warning',
        });

        return false;
      }

      const normalizedDueAt = new Date(dueAtTimestamp).toISOString();

      setBusyAction('create-task');

      try {
        const client = new CoreApiClient();
        const result = (await client.mutation({
          createTask: {
            __args: {
              data: {
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
                          selectedConversation.opportunity.name ||
                          selectedConversation.opportunity.id
                        }`
                      : null,
                  ]
                    .filter(Boolean)
                    .join('\n\n'),
                  blocknote: null,
                },
              },
            },
            id: true,
          },
        } as never)) as unknown as {
          createTask?: {
            id?: string | null;
          } | null;
        };
        const taskId = result.createTask?.id;

        if (!taskId) {
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
            client.mutation({
              createTaskTarget: {
                __args: {
                  data: {
                    taskId,
                    ...target,
                  },
                },
                id: true,
              },
            } as never),
          ),
        );
        const createdTask: InboxTask = {
          id: taskId,
          title: normalizedTitle,
          status: 'TODO',
          dueAt: normalizedDueAt,
          assignee,
        };
        const nextTasks = [...selectedConversation.tasks, createdTask];
        const nextFollowUpDueAt = getNextFollowUpDueAt(nextTasks);
        let followUpWasSynced = true;

        try {
          await client.mutation({
            updateInboxConversation: {
              __args: {
                id: selectedConversation.id,
                data: {
                  followUpDueAt: nextFollowUpDueAt,
                },
              },
              id: true,
            },
          } as never);
        } catch {
          followUpWasSynced = false;
        }

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversation.id
              ? {
                  ...conversation,
                  tasks: nextTasks,
                  followUpDueAt: followUpWasSynced
                    ? nextFollowUpDueAt
                    : conversation.followUpDueAt,
                }
              : conversation,
          ),
        );

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

        await enqueueSnackbar({
          message: hasWarnings
            ? 'Tarefa criada. Alguns vínculos ou o histórico precisam ser revisados.'
            : 'Próxima ação criada e vinculada ao contexto comercial.',
          variant: hasWarnings ? 'warning' : 'success',
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
    [recordConversationEvent, selectedConversation, teams, workspaceMembers],
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
        const client = new CoreApiClient();

        await client.mutation({
          updateTask: {
            __args: {
              id: taskId,
              data: {
                status: 'DONE',
              },
            },
            id: true,
          },
        } as never);

        const nextTasks = selectedConversation.tasks.map((currentTask) =>
          currentTask.id === taskId
            ? {
                ...currentTask,
                status: 'DONE',
              }
            : currentTask,
        );
        const nextFollowUpDueAt = getNextFollowUpDueAt(nextTasks);
        let followUpWasSynced = true;

        try {
          await client.mutation({
            updateInboxConversation: {
              __args: {
                id: selectedConversation.id,
                data: {
                  followUpDueAt: nextFollowUpDueAt,
                },
              },
              id: true,
            },
          } as never);
        } catch {
          followUpWasSynced = false;
        }

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversation.id
              ? {
                  ...conversation,
                  tasks: nextTasks,
                  followUpDueAt: followUpWasSynced
                    ? nextFollowUpDueAt
                    : conversation.followUpDueAt,
                }
              : conversation,
          ),
        );

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversation.id,
          eventType: 'TASK_COMPLETED',
          summary: `Próxima ação concluída: ${task.title ?? task.id}`,
          details: task.assignee
            ? `Responsável: ${
                getRecordName(task.assignee) || 'Usuário sem nome'
              }`
            : null,
        });

        await enqueueSnackbar({
          message:
            followUpWasSynced && eventRecorded
              ? 'Próxima ação concluída.'
              : 'Tarefa concluída. Revise o follow-up ou o histórico.',
          variant: followUpWasSynced && eventRecorded ? 'success' : 'warning',
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
    [recordConversationEvent, selectedConversation],
  );

  const selectConversation = useCallback(
    async (conversationId: string) => {
      setSelectedConversationId(conversationId);

      const conversation = conversations.find(
        ({ id }) => id === conversationId,
      );
      const unreadMentions = pendingMentions.filter(
        (mention) =>
          mention.inboxConversation?.id === conversationId &&
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
      const markMentionRead = (mention: InboxMention): InboxMention =>
        unreadMentions.some(({ id }) => id === mention.id)
          ? {
              ...mention,
              status: 'READ',
              readAt,
            }
          : mention;

      if (unreadMentions.length > 0) {
        mentionRequestVersionRef.current += 1;
      }

      if (conversation && conversation.unreadCount > 0) {
        setConversations((current) =>
          current.map((item) =>
            item.id === conversationId ? { ...item, unreadCount: 0 } : item,
          ),
        );
      }

      setPendingMentions((current) => current.map(markMentionRead));
      setConversationMentions((current) => current.map(markMentionRead));

      try {
        const client = new CoreApiClient();
        const results = await Promise.allSettled([
          ...(conversation && conversation.unreadCount > 0
            ? [
                client.mutation({
                  updateInboxConversation: {
                    __args: {
                      id: conversationId,
                      data: {
                        unreadCount: 0,
                      },
                    },
                    id: true,
                  },
                } as never),
              ]
            : []),
          ...unreadMentions.map((mention) =>
            client.mutation({
              updateInboxMention: {
                __args: {
                  id: mention.id,
                  data: {
                    status: 'READ',
                    readAt,
                  },
                },
                id: true,
              },
            } as never),
          ),
        ]);

        if (results.some(({ status }) => status === 'rejected')) {
          throw new Error(
            'A conversa foi aberta, mas parte dos indicadores não pôde ser sincronizada.',
          );
        }
      } catch {
        await enqueueSnackbar({
          message:
            'A conversa foi aberta, mas parte dos indicadores não pôde ser sincronizada.',
          variant: 'warning',
        });
      }
    },
    [conversations, currentWorkspaceMemberId, pendingMentions],
  );

  useEffect(() => {
    if (selectedConversationId !== null) {
      void selectConversation(selectedConversationId);
    }
  }, [selectConversation, selectedConversationId]);

  const snoozeConversation = useCallback(
    async (snoozedUntil: string): Promise<void> => {
      if (selectedConversationId === null) {
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
        await enqueueSnackbar({
          message:
            'Escolha um prazo futuro entre um minuto e um ano para adiar.',
          variant: 'warning',
        });

        return;
      }

      const normalizedSnoozedUntil = new Date(targetTime).toISOString();

      setBusyAction('snooze');

      try {
        await new CoreApiClient().mutation({
          updateInboxConversation: {
            __args: {
              id: selectedConversationId,
              data: {
                status: 'SNOOZED',
                snoozedUntil: normalizedSnoozedUntil,
              },
            },
            id: true,
          },
        } as never);

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversationId
              ? {
                  ...conversation,
                  status: 'SNOOZED',
                  snoozedUntil: normalizedSnoozedUntil,
                }
              : conversation,
          ),
        );

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversationId,
          eventType: 'SNOOZED',
          summary: `Conversa adiada até ${new Date(
            normalizedSnoozedUntil,
          ).toLocaleString('pt-BR')}`,
        });

        await enqueueSnackbar({
          message: eventRecorded
            ? `Conversa adiada até ${new Date(
                normalizedSnoozedUntil,
              ).toLocaleString('pt-BR')}.`
            : 'Conversa adiada, mas o evento não entrou no histórico.',
          variant: eventRecorded ? 'success' : 'warning',
        });
      } catch {
        await enqueueSnackbar({
          message: 'Não foi possível adiar a conversa.',
          variant: 'error',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [recordConversationEvent, selectedConversationId],
  );

  const setConversationStatus = useCallback(
    async (status: string) => {
      if (selectedConversationId === null) {
        return;
      }

      const previousStatus =
        conversations.find(({ id }) => id === selectedConversationId)?.status ??
        'OPEN';

      setBusyAction('status');

      try {
        const client = new CoreApiClient();
        await client.mutation({
          updateInboxConversation: {
            __args: {
              id: selectedConversationId,
              data: {
                status,
                ...(status !== 'SNOOZED' ? { snoozedUntil: null } : {}),
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
                  snoozedUntil:
                    status === 'SNOOZED' ? conversation.snoozedUntil : null,
                  unreadCount:
                    status === 'RESOLVED' ? 0 : conversation.unreadCount,
                }
              : conversation,
          ),
        );

        const eventRecorded = await recordConversationEvent({
          conversationId: selectedConversationId,
          eventType: 'STATUS_CHANGED',
          summary: `Status definido: ${
            macroConversationStatusLabels[status] ?? status
          }`,
          details: `Anterior: ${
            macroConversationStatusLabels[previousStatus] ?? previousStatus
          }`,
        });

        await enqueueSnackbar({
          message: eventRecorded
            ? status === 'RESOLVED'
              ? 'Conversa resolvida.'
              : status === 'PENDING'
                ? 'Conversa marcada como pendente.'
                : 'Conversa reaberta.'
            : 'Status atualizado, mas o evento não entrou no histórico.',
          variant: eventRecorded ? 'success' : 'warning',
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
    [conversations, recordConversationEvent, selectedConversationId],
  );

  const saveInternalNote = useCallback(
    async (body: string, mentionedWorkspaceMemberIds: string[] = []) => {
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
        const client = new CoreApiClient();
        const mentionedAt = new Date().toISOString();
        const result = (await client.mutation({
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
                sentAt: mentionedAt,
                isInternalNote: true,
                inboxConversationId: selectedConversationId,
              },
            },
            id: true,
          },
        } as never)) as unknown as {
          createInboxMessage?: {
            id?: string | null;
          } | null;
        };
        const messageId = result.createInboxMessage?.id;

        if (!messageId) {
          throw new Error('A nota não retornou um identificador.');
        }

        const mentionResults = await Promise.allSettled(
          normalizedMentionedWorkspaceMemberIds.map((workspaceMemberId) =>
            client.mutation({
              createInboxMention: {
                __args: {
                  data: {
                    name: `${messageId}:${workspaceMemberId}`,
                    excerpt: trimmedBody.slice(0, 500),
                    status: 'UNREAD',
                    mentionedAt,
                    readAt: null,
                    resolvedAt: null,
                    inboxConversationId: selectedConversationId,
                    inboxMessageId: messageId,
                    mentionedWorkspaceMemberId: workspaceMemberId,
                    authorWorkspaceMemberId: currentWorkspaceMemberId,
                  },
                },
                id: true,
              },
            } as never),
          ),
        );
        const failedMentionCount = mentionResults.filter(
          ({ status }) => status === 'rejected',
        ).length;

        await Promise.all([
          loadMessages(selectedConversationId),
          loadMentions(selectedConversationId, currentWorkspaceMemberId),
        ]);
        await enqueueSnackbar({
          message:
            failedMentionCount > 0
              ? `Nota salva. ${failedMentionCount} menção não pôde ser criada.`
              : normalizedMentionedWorkspaceMemberIds.length > 0
                ? 'Nota interna salva e equipe mencionada.'
                : 'Nota interna adicionada.',
          variant: failedMentionCount > 0 ? 'warning' : 'success',
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
    [
      currentWorkspaceMemberId,
      loadMentions,
      loadMessages,
      selectedConversationId,
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
        await enqueueSnackbar({
          message: 'Esta menção não está disponível para resolução.',
          variant: 'warning',
        });

        return;
      }

      setBusyAction(`resolve-mention:${mentionId}`);

      try {
        const resolvedAt = new Date().toISOString();

        await new CoreApiClient().mutation({
          updateInboxMention: {
            __args: {
              id: mentionId,
              data: {
                status: 'RESOLVED',
                readAt: mention.readAt ?? resolvedAt,
                resolvedAt,
              },
            },
            id: true,
          },
        } as never);

        mentionRequestVersionRef.current += 1;
        setPendingMentions((current) =>
          current.filter(({ id }) => id !== mentionId),
        );
        setConversationMentions((current) =>
          current.map((item) =>
            item.id === mentionId
              ? {
                  ...item,
                  status: 'RESOLVED',
                  readAt: item.readAt ?? resolvedAt,
                  resolvedAt,
                }
              : item,
          ),
        );
        const eventRecorded = mention.inboxConversation?.id
          ? await recordConversationEvent({
              conversationId: mention.inboxConversation.id,
              eventType: 'MENTION_RESOLVED',
              summary: 'Menção interna resolvida',
              details: mention.excerpt ?? null,
            })
          : false;

        await enqueueSnackbar({
          message: eventRecorded
            ? 'Menção resolvida.'
            : 'Menção resolvida, mas o evento não entrou no histórico.',
          variant: eventRecorded ? 'success' : 'warning',
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
    [
      conversationMentions,
      currentWorkspaceMemberId,
      pendingMentions,
      recordConversationEvent,
    ],
  );

  const getEmailSyncRouting = useCallback(() => {
    const defaultTeam =
      teams.find(
        (team) =>
          team.status === 'ACTIVE' &&
          team.isDefault &&
          currentWorkspaceMemberId !== null &&
          getActiveTeamMembers(team).some(
            ({ id }) => id === currentWorkspaceMemberId,
          ),
      ) ?? null;

    return {
      assigneeId: currentWorkspaceMemberId,
      inboxTeamId: defaultTeam?.id ?? null,
      responseSlaMinutes: defaultTeam?.defaultResponseSlaMinutes ?? 60,
    };
  }, [currentWorkspaceMemberId, teams]);

  const syncTwentyEmail = useCallback(async (): Promise<void> => {
    setBusyAction('email-sync');

    try {
      const result = await syncTwentyEmailToInbox({
        routing: getEmailSyncRouting(),
      });

      if (result.eligibleChannels === 0) {
        await enqueueSnackbar({
          message:
            'Nenhum canal de e-mail compartilhado está disponível. No Twenty, habilite a sincronização e a visibilidade “Compartilhar tudo” na conta que alimentará a Inbox.',
          variant: 'warning',
        });

        return;
      }

      await refreshInbox();
      const automationSummary =
        result.automationsApplied > 0
          ? ` ${result.automationsApplied} automação(ões) aplicada(s).`
          : '';
      const warningSummary =
        result.automationWarnings.length > 0
          ? ` ${result.automationWarnings.length} automação(ões) exigem revisão no histórico.`
          : '';

      await enqueueSnackbar({
        message:
          result.createdMessages > 0
            ? `${result.createdMessages} e-mail(s) sincronizado(s) em ${result.importedThreads} conversa(s).${automationSummary}${warningSummary}`
            : `Canais verificados. Nenhum e-mail novo em ${result.importedThreads} conversa(s).${warningSummary}`,
        variant: result.automationWarnings.length > 0 ? 'warning' : 'success',
      });
    } catch (error) {
      await enqueueSnackbar({
        message: getErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setBusyAction(null);
    }
  }, [getEmailSyncRouting, refreshInbox]);

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
        if (
          selectedConversation.channel === 'WHATSAPP' &&
          selectedConversation.provider === 'EVOLUTION'
        ) {
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

          return {
            ...response,
            channel: 'WHATSAPP',
            subjectPreview: null,
          };
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

        const channels = await loadEligibleTwentyEmailChannels();
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
        const confirmationToken =
          typeof globalThis.crypto?.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
          confirmationToken: `twenty-email:${confirmationToken}`,
          message:
            'Revise destinatário, assunto e corpo antes de confirmar o envio nativo do Twenty.',
        };
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
    [selectedConversation, selectedConversationId],
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
        await enqueueSnackbar({
          message: 'A prévia expirou ou não pertence à conversa atual.',
          variant: 'warning',
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
          await enqueueSnackbar({
            message:
              'A prévia do e-mail é inválida ou já foi consumida. Gere uma nova prévia.',
            variant: 'warning',
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
          const response = await new RestApiClient().post<EvolutionTextReceipt>(
            `/s${EVOLUTION_SEND_TEXT_ROUTE}`,
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

          await refreshInbox();
          await enqueueSnackbar({
            message: 'Mensagem aceita pelo WhatsApp e registrada na inbox.',
            variant: 'success',
          });

          return true;
        }

        const metadata = readTwentyEmailConversationMetadata(
          selectedConversation.metadata,
        );
        const channels = await loadEligibleTwentyEmailChannels();
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

        const result = (await new MetadataApiClient().mutation({
          sendEmail: {
            __args: {
              input: {
                connectedAccountId: preview.connectedAccountId,
                to: preview.destination,
                subject: preview.subjectPreview,
                body: preview.textPreview,
                inReplyTo: preview.inReplyTo ?? undefined,
              },
            },
            success: true,
            error: true,
            messageThreadId: true,
          },
        } as never)) as unknown as {
          sendEmail?: {
            success?: boolean | null;
            error?: string | null;
            messageThreadId?: string | null;
          } | null;
        };

        if (result.sendEmail?.success !== true) {
          throw new Error(
            result.sendEmail?.error ||
              'O Twenty não aceitou o envio do e-mail.',
          );
        }

        let syncSucceeded = true;

        try {
          await syncTwentyEmailToInbox({
            routing: getEmailSyncRouting(),
          });
        } catch {
          syncSucceeded = false;
        }

        await refreshInbox();
        await enqueueSnackbar({
          message: syncSucceeded
            ? 'E-mail enviado pela conta nativa do Twenty e sincronizado na Inbox.'
            : 'E-mail enviado, mas a cópia da Inbox ainda precisa ser sincronizada.',
          variant: syncSucceeded ? 'success' : 'warning',
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
    [
      getEmailSyncRouting,
      refreshInbox,
      selectedConversation,
      selectedConversationId,
    ],
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
    macros,
    labels,
    workspaceMembers,
    teams,
    selectedConversation,
    selectedConversationId,
    messages,
    conversationEvents,
    conversationMentions,
    pendingMentions,
    currentWorkspaceMemberId,
    isLoadingConversations,
    isLoadingMessages,
    busyAction,
    errorMessage,
    triageResult,
    loadConversations,
    refreshInbox,
    selectConversation,
    snoozeConversation,
    applySavedReply,
    previewInboxMacro,
    applyInboxMacro,
    toggleConversationLabel,
    setConversationAssignee,
    setConversationTeam,
    setConversationPriority,
    createConversationTask,
    completeConversationTask,
    setConversationStatus,
    saveInternalNote,
    resolveMention,
    previewExternalMessage,
    confirmExternalMessage,
    syncTwentyEmail,
    configureEvolution,
    triageConversation,
  };
};
