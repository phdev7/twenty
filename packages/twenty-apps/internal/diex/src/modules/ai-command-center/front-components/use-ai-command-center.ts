import { useCallback, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar, useUserId } from 'twenty-sdk/front-component';

import { AI_ACTION_EXECUTOR_ROUTE } from 'src/modules/ai-command-center/constants/ai-command-center.constants';
import {
  type AiAction,
  type AiActionExecutionPreview,
  type AiActionExecutionResult,
  type CurrentReviewer,
} from 'src/modules/ai-command-center/front-components/ai-command-center.types';
import { getRouteErrorMessage } from 'src/utils/route-error-message';

type AiActionsQueryResult = {
  aiActions?: {
    edges?: Array<{
      node: AiAction;
    }>;
  };
};

type WorkspaceMembersQueryResult = {
  workspaceMembers?: {
    edges?: Array<{
      node: CurrentReviewer;
    }>;
  };
};

export const useAiCommandCenter = () => {
  const userId = useUserId();
  const [actions, setActions] = useState<AiAction[]>([]);
  const [currentReviewer, setCurrentReviewer] =
    useState<CurrentReviewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [busyExecution, setBusyExecution] = useState<{
    actionId: string;
    mode: 'PREVIEW' | 'APPLY';
  } | null>(null);
  const [executionPreviews, setExecutionPreviews] = useState<
    Record<string, AiActionExecutionPreview>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const client = new CoreApiClient();
      const [actionsResult, membersResult] = await Promise.all([
        client.query({
          aiActions: {
            __args: {
              first: 100,
              orderBy: [{ requestedAt: 'DescNullsLast' }],
            },
            edges: {
              node: {
                id: true,
                name: true,
                actionType: true,
                status: true,
                confidence: true,
                requiresApproval: true,
                rationale: {
                  markdown: true,
                },
                proposedAction: {
                  markdown: true,
                },
                approvalNotes: {
                  markdown: true,
                },
                executionReceipt: {
                  markdown: true,
                },
                requestedAt: true,
                approvedAt: true,
                executedAt: true,
                opportunity: {
                  id: true,
                  name: true,
                  stage: true,
                },
                commercialSignal: {
                  id: true,
                  name: true,
                },
                successPlan: {
                  id: true,
                  name: true,
                },
                customerRenewal: {
                  id: true,
                  name: true,
                },
                inboxConversation: {
                  id: true,
                  name: true,
                },
                reviewer: {
                  id: true,
                  name: {
                    firstName: true,
                    lastName: true,
                  },
                },
                executor: {
                  id: true,
                  name: {
                    firstName: true,
                    lastName: true,
                  },
                },
                executionTask: {
                  id: true,
                  title: true,
                  dueAt: true,
                  status: true,
                },
              },
            },
          },
        } as never),
        userId
          ? client.query({
              workspaceMembers: {
                __args: {
                  filter: {
                    userId: {
                      eq: userId,
                    },
                  },
                  first: 1,
                },
                edges: {
                  node: {
                    id: true,
                    userId: true,
                    name: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            } as never)
          : Promise.resolve({}),
      ]);

      setActions(
        (
          actionsResult as unknown as AiActionsQueryResult
        ).aiActions?.edges?.map(({ node }) => node) ?? [],
      );
      setCurrentReviewer(
        (membersResult as unknown as WorkspaceMembersQueryResult)
          .workspaceMembers?.edges?.[0]?.node ?? null,
      );
    } catch {
      setErrorMessage('Não foi possível carregar o Centro de IA.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewAction = useCallback(
    async (
      actionId: string,
      decision: 'APPROVED' | 'REJECTED',
      note: string,
    ): Promise<boolean> => {
      const action = actions.find(({ id }) => id === actionId);

      if (!action || action.status !== 'PENDING_APPROVAL') {
        await enqueueSnackbar({
          message: 'Esta ação não está mais aguardando aprovação.',
          variant: 'warning',
        });

        return false;
      }

      if (!currentReviewer) {
        await enqueueSnackbar({
          message:
            'Não foi possível identificar o membro responsável pela decisão.',
          variant: 'error',
        });

        return false;
      }

      const reviewedAt = new Date().toISOString();
      const normalizedNote =
        note.trim() ||
        (decision === 'APPROVED'
          ? 'Proposta aprovada manualmente no Centro de IA.'
          : 'Proposta rejeitada manualmente no Centro de IA.');

      setBusyActionId(actionId);

      try {
        await new CoreApiClient().mutation({
          updateAiAction: {
            __args: {
              id: actionId,
              data: {
                status: decision,
                approvedAt: decision === 'APPROVED' ? reviewedAt : null,
                reviewerId: currentReviewer.id,
                approvalNotes: {
                  markdown: normalizedNote,
                  blocknote: null,
                },
              },
            },
            id: true,
          },
        } as never);

        setActions((current) =>
          current.map((item) =>
            item.id === actionId
              ? {
                  ...item,
                  status: decision,
                  approvedAt: decision === 'APPROVED' ? reviewedAt : null,
                  approvalNotes: {
                    markdown: normalizedNote,
                  },
                  reviewer: currentReviewer,
                }
              : item,
          ),
        );

        await enqueueSnackbar({
          message:
            decision === 'APPROVED'
              ? 'Proposta aprovada. Nenhum efeito externo foi executado.'
              : 'Proposta rejeitada e registrada na trilha de governança.',
          variant: 'success',
        });

        return true;
      } catch {
        await enqueueSnackbar({
          message: 'Não foi possível registrar a decisão.',
          variant: 'error',
        });

        return false;
      } finally {
        setBusyActionId(null);
      }
    },
    [actions, currentReviewer],
  );

  const executeAction = useCallback(
    async (
      actionId: string,
      mode: 'PREVIEW' | 'APPLY',
      options?: {
        confirmationToken?: string;
        targetStage?: string;
      },
    ): Promise<boolean> => {
      const action = actions.find(({ id }) => id === actionId);

      if (!action || action.status !== 'APPROVED') {
        await enqueueSnackbar({
          message: 'Somente propostas aprovadas podem entrar no executor.',
          variant: 'warning',
        });

        return false;
      }

      setBusyExecution({ actionId, mode });

      try {
        const result = await new RestApiClient().post<AiActionExecutionResult>(
          `/s${AI_ACTION_EXECUTOR_ROUTE}`,
          {
            actionId,
            previewOnly: mode === 'PREVIEW',
            confirmExecute: mode === 'APPLY',
            ...(mode === 'APPLY'
              ? { confirmationToken: options?.confirmationToken }
              : {}),
            ...(options?.targetStage
              ? { targetStage: options.targetStage }
              : {}),
          },
        );

        if (mode === 'PREVIEW') {
          if (result.mode !== 'PREVIEW' || result.actionId !== actionId) {
            throw new Error('O executor retornou uma prévia inválida.');
          }

          setExecutionPreviews((current) => ({
            ...current,
            [actionId]: result,
          }));

          await enqueueSnackbar({
            message: result.supported
              ? 'Prévia gerada sem alterar o CRM.'
              : result.blockedReason,
            variant: result.supported ? 'success' : 'warning',
          });

          return result.supported;
        }

        if (
          result.mode !== 'APPLY' ||
          result.actionId !== actionId ||
          result.executed !== true
        ) {
          throw new Error('O executor não confirmou a operação no CRM.');
        }

        setExecutionPreviews((current) => {
          const next = { ...current };

          delete next[actionId];

          return next;
        });
        await load();
        await enqueueSnackbar({
          message: result.message,
          variant: 'success',
        });

        return true;
      } catch (error) {
        await enqueueSnackbar({
          message: getRouteErrorMessage(
            error,
            'Não foi possível operar o executor interno.',
          ),
          variant: 'error',
        });

        return false;
      } finally {
        setBusyExecution(null);
      }
    },
    [actions, load],
  );

  return {
    actions,
    currentReviewer,
    isLoading,
    busyActionId,
    busyExecution,
    executionPreviews,
    errorMessage,
    load,
    reviewAction,
    executeAction,
  };
};
