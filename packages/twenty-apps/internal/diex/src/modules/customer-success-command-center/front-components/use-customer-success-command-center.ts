import { useCallback, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar, useUserId } from 'twenty-sdk/front-component';

import {
  CUSTOMER_SUCCESS_HANDOFF_ROUTE,
  CUSTOMER_SUCCESS_MILESTONE_ACTION_ROUTE,
  CUSTOMER_SUCCESS_REVIEW_ROUTE,
} from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import {
  type CustomerSuccessAiAction,
  type CustomerSuccessHandoffApplyResult,
  type CustomerSuccessHandoffDraft,
  type CustomerSuccessHandoffOpportunity,
  type CustomerSuccessHandoffPreviewResult,
  type CustomerSuccessHandoffResult,
  type CustomerSuccessMilestone,
  type CustomerSuccessMilestoneActionApplyResult,
  type CustomerSuccessMilestoneActionDraft,
  type CustomerSuccessMilestoneActionPreviewResult,
  type CustomerSuccessMilestoneActionResult,
  type CustomerSuccessPlan,
  type CustomerSuccessReviewResult,
  type CustomerSuccessWorkspaceMember,
} from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.types';

type SuccessPlanNode = Omit<CustomerSuccessPlan, 'milestones' | 'aiActions'> & {
  milestones?: {
    edges?: Array<{
      node: CustomerSuccessMilestone;
    }>;
  } | null;
  aiActions?: {
    edges?: Array<{
      node: CustomerSuccessAiAction;
    }>;
  } | null;
};

type SuccessPlansQueryResult = {
  successPlans?: {
    edges?: Array<{
      node: SuccessPlanNode;
    }>;
  };
};

type ReviewMode = 'PREVIEW' | 'APPLY';

type HandoffOpportunitiesQueryResult = {
  opportunities?: {
    edges?: Array<{
      node: CustomerSuccessHandoffOpportunity;
    }>;
  };
};

type WorkspaceMembersQueryResult = {
  workspaceMembers?: {
    edges?: Array<{
      node: CustomerSuccessWorkspaceMember;
    }>;
  };
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Não foi possível carregar Customer Success.';

export const useCustomerSuccessCommandCenter = () => {
  const userId = useUserId();
  const [plans, setPlans] = useState<CustomerSuccessPlan[]>([]);
  const [handoffOpportunities, setHandoffOpportunities] = useState<
    CustomerSuccessHandoffOpportunity[]
  >([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<
    CustomerSuccessWorkspaceMember[]
  >([]);
  const [currentWorkspaceMemberId, setCurrentWorkspaceMemberId] = useState<
    string | null
  >(null);
  const [reviews, setReviews] = useState<
    Record<string, CustomerSuccessReviewResult>
  >({});
  const [handoffPreviews, setHandoffPreviews] = useState<
    Record<string, CustomerSuccessHandoffPreviewResult>
  >({});
  const [milestoneActionPreviews, setMilestoneActionPreviews] = useState<
    Record<string, CustomerSuccessMilestoneActionPreviewResult>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyReview, setBusyReview] = useState<{
    planId: string;
    mode: ReviewMode;
  } | null>(null);
  const [busyHandoff, setBusyHandoff] = useState<{
    opportunityId: string;
    mode: ReviewMode;
  } | null>(null);
  const [busyMilestoneAction, setBusyMilestoneAction] = useState<{
    milestoneId: string;
    mode: ReviewMode;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const client = new CoreApiClient();
      const [plansResult, opportunitiesResult, membersResult] =
        await Promise.all([
          client.query({
            successPlans: {
              __args: {
                first: 100,
                orderBy: [{ renewalDate: 'AscNullsLast' }],
              },
              edges: {
                node: {
                  id: true,
                  name: true,
                  lifecycle: true,
                  health: true,
                  healthScore: true,
                  activeUseRating: true,
                  valueEvidenceRating: true,
                  expansionSignal: true,
                  recurringRevenue: {
                    amountMicros: true,
                    currencyCode: true,
                  },
                  startDate: true,
                  renewalDate: true,
                  nextReviewAt: true,
                  objectives: {
                    markdown: true,
                  },
                  successCriteria: {
                    markdown: true,
                  },
                  risks: {
                    markdown: true,
                  },
                  executiveSummary: {
                    markdown: true,
                  },
                  updatedAt: true,
                  company: {
                    id: true,
                    name: true,
                  },
                  primaryContact: {
                    id: true,
                    name: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                  owner: {
                    id: true,
                    name: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                  opportunity: {
                    id: true,
                    name: true,
                  },
                  milestones: {
                    edges: {
                      node: {
                        id: true,
                        name: true,
                        category: true,
                        status: true,
                        dueAt: true,
                        completedAt: true,
                        impact: true,
                        outcome: {
                          markdown: true,
                        },
                        evidence: {
                          markdown: true,
                        },
                      },
                    },
                  },
                  aiActions: {
                    edges: {
                      node: {
                        id: true,
                        name: true,
                        status: true,
                        requestedAt: true,
                      },
                    },
                  },
                },
              },
            },
          } as never),
          client.query({
            opportunities: {
              __args: {
                filter: { stage: { eq: 'CUSTOMER' } },
                first: 100,
                orderBy: [{ updatedAt: 'DescNullsLast' }],
              },
              edges: {
                node: {
                  id: true,
                  name: true,
                  stage: true,
                  closeDate: true,
                  updatedAt: true,
                  amount: {
                    amountMicros: true,
                    currencyCode: true,
                  },
                  company: {
                    id: true,
                    name: true,
                    diexLifecycle: true,
                  },
                  pointOfContact: {
                    id: true,
                    name: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                  owner: {
                    id: true,
                    userId: true,
                    name: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                  diexOffer: {
                    id: true,
                    name: true,
                    pricingModel: true,
                    valueProposition: {
                      markdown: true,
                    },
                  },
                },
              },
            },
          } as never),
          client.query({
            workspaceMembers: {
              __args: {
                first: 200,
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
          } as never),
        ]);
      const nodes =
        (
          plansResult as unknown as SuccessPlansQueryResult
        ).successPlans?.edges?.map(({ node }) => node) ?? [];
      const nextPlans = nodes.map((node) => ({
        ...node,
        milestones:
          node.milestones?.edges?.map(({ node: milestone }) => milestone) ?? [],
        aiActions:
          node.aiActions?.edges?.map(({ node: aiAction }) => aiAction) ?? [],
      }));
      const coveredOpportunityIds = new Set(
        nextPlans
          .map(({ opportunity }) => opportunity?.id)
          .filter((id): id is string => Boolean(id)),
      );
      const nextOpportunities =
        (
          opportunitiesResult as unknown as HandoffOpportunitiesQueryResult
        ).opportunities?.edges
          ?.map(({ node }) => node)
          .filter(({ id }) => !coveredOpportunityIds.has(id)) ?? [];
      const nextMembers =
        (
          membersResult as unknown as WorkspaceMembersQueryResult
        ).workspaceMembers?.edges?.map(({ node }) => node) ?? [];

      setPlans(nextPlans);
      setHandoffOpportunities(nextOpportunities);
      setWorkspaceMembers(nextMembers);
      setCurrentWorkspaceMemberId(
        nextMembers.find((member) => member.userId === userId)?.id ?? null,
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewPlan = useCallback(
    async (
      successPlanId: string,
      mode: ReviewMode,
    ): Promise<CustomerSuccessReviewResult | null> => {
      setBusyReview({ planId: successPlanId, mode });

      try {
        const result =
          await new RestApiClient().post<CustomerSuccessReviewResult>(
            `/s${CUSTOMER_SUCCESS_REVIEW_ROUTE}`,
            {
              successPlanId,
              mode,
            },
          );

        if (!result?.summary || result.successPlanId !== successPlanId) {
          throw new Error('A revisão de CS retornou um resultado inválido.');
        }

        setReviews((current) => ({
          ...current,
          [successPlanId]: result,
        }));

        if (mode === 'APPLY') {
          await load();
        }

        await enqueueSnackbar({
          message:
            mode === 'APPLY'
              ? result.aiActionId
                ? 'Saúde atualizada e proposta enviada ao Centro de IA.'
                : 'Saúde e próxima revisão atualizadas sem ação externa.'
              : 'Prévia concluída sem alterar o plano.',
          variant: 'success',
        });

        return result;
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });

        return null;
      } finally {
        setBusyReview(null);
      }
    },
    [load],
  );

  const previewHandoff = useCallback(
    async (
      opportunityId: string,
      draft: CustomerSuccessHandoffDraft,
    ): Promise<boolean> => {
      setBusyHandoff({ opportunityId, mode: 'PREVIEW' });

      try {
        const result =
          await new RestApiClient().post<CustomerSuccessHandoffResult>(
            `/s${CUSTOMER_SUCCESS_HANDOFF_ROUTE}`,
            {
              opportunityId,
              ...draft,
              previewOnly: true,
              confirmCreate: false,
            },
          );

        if (
          result.mode !== 'PREVIEW' ||
          result.opportunityId !== opportunityId
        ) {
          throw new Error('O handoff retornou uma prévia inválida.');
        }

        setHandoffPreviews((current) => ({
          ...current,
          [opportunityId]: result,
        }));
        await enqueueSnackbar({
          message: result.supported
            ? 'Prévia do handoff gerada sem criar registros.'
            : result.blockedReason,
          variant: result.supported ? 'success' : 'warning',
        });

        return result.supported;
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });

        return false;
      } finally {
        setBusyHandoff(null);
      }
    },
    [],
  );

  const confirmHandoff = useCallback(
    async (
      opportunityId: string,
      draft: CustomerSuccessHandoffDraft,
      confirmationToken: string,
    ): Promise<string | null> => {
      setBusyHandoff({ opportunityId, mode: 'APPLY' });

      try {
        const result =
          await new RestApiClient().post<CustomerSuccessHandoffApplyResult>(
            `/s${CUSTOMER_SUCCESS_HANDOFF_ROUTE}`,
            {
              opportunityId,
              ...draft,
              previewOnly: false,
              confirmCreate: true,
              confirmationToken,
            },
          );

        if (
          result.mode !== 'APPLY' ||
          result.created !== true ||
          result.opportunityId !== opportunityId ||
          !result.successPlanId
        ) {
          throw new Error('O handoff não confirmou a criação do plano.');
        }

        setHandoffPreviews((current) => {
          const next = { ...current };

          delete next[opportunityId];

          return next;
        });
        await load();
        await enqueueSnackbar({
          message:
            result.warnings.length > 0
              ? `${result.message} Revise ${result.warnings.length} alerta(s).`
              : result.message,
          variant: result.warnings.length > 0 ? 'warning' : 'success',
        });

        return result.successPlanId;
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });

        return null;
      } finally {
        setBusyHandoff(null);
      }
    },
    [load],
  );

  const clearHandoffPreview = useCallback((opportunityId: string) => {
    setHandoffPreviews((current) => {
      if (!(opportunityId in current)) {
        return current;
      }

      const next = { ...current };

      delete next[opportunityId];

      return next;
    });
  }, []);

  const previewMilestoneAction = useCallback(
    async (
      milestoneId: string,
      draft: CustomerSuccessMilestoneActionDraft,
    ): Promise<boolean> => {
      setBusyMilestoneAction({ milestoneId, mode: 'PREVIEW' });

      try {
        const result =
          await new RestApiClient().post<CustomerSuccessMilestoneActionResult>(
            `/s${CUSTOMER_SUCCESS_MILESTONE_ACTION_ROUTE}`,
            {
              milestoneId,
              ...draft,
              previewOnly: true,
              confirmUpdate: false,
            },
          );

        if (result.mode !== 'PREVIEW' || result.milestoneId !== milestoneId) {
          throw new Error('A ação do marco retornou uma prévia inválida.');
        }

        setMilestoneActionPreviews((current) => ({
          ...current,
          [milestoneId]: result,
        }));
        await enqueueSnackbar({
          message: result.supported
            ? 'Prévia do marco gerada sem alterar registros.'
            : result.blockedReason,
          variant: result.supported ? 'success' : 'warning',
        });

        return result.supported;
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });

        return false;
      } finally {
        setBusyMilestoneAction(null);
      }
    },
    [],
  );

  const confirmMilestoneAction = useCallback(
    async (
      milestoneId: string,
      draft: CustomerSuccessMilestoneActionDraft,
      confirmationToken: string,
    ): Promise<boolean> => {
      setBusyMilestoneAction({ milestoneId, mode: 'APPLY' });

      try {
        const result =
          await new RestApiClient().post<CustomerSuccessMilestoneActionApplyResult>(
            `/s${CUSTOMER_SUCCESS_MILESTONE_ACTION_ROUTE}`,
            {
              milestoneId,
              ...draft,
              previewOnly: false,
              confirmUpdate: true,
              confirmationToken,
            },
          );

        if (
          result.mode !== 'APPLY' ||
          result.milestoneUpdated !== true ||
          result.milestoneId !== milestoneId
        ) {
          throw new Error('A atualização do marco não foi confirmada.');
        }

        setMilestoneActionPreviews((current) => {
          const next = { ...current };

          delete next[milestoneId];

          return next;
        });
        await load();
        await enqueueSnackbar({
          message:
            result.warnings.length > 0
              ? `${result.message} Revise ${result.warnings.length} alerta(s).`
              : result.message,
          variant: result.warnings.length > 0 ? 'warning' : 'success',
        });

        return true;
      } catch (error) {
        await enqueueSnackbar({
          message: getErrorMessage(error),
          variant: 'error',
        });

        return false;
      } finally {
        setBusyMilestoneAction(null);
      }
    },
    [load],
  );

  const clearMilestoneActionPreview = useCallback((milestoneId: string) => {
    setMilestoneActionPreviews((current) => {
      if (!(milestoneId in current)) {
        return current;
      }

      const next = { ...current };

      delete next[milestoneId];

      return next;
    });
  }, []);

  return {
    plans,
    handoffOpportunities,
    workspaceMembers,
    currentWorkspaceMemberId,
    reviews,
    handoffPreviews,
    milestoneActionPreviews,
    isLoading,
    busyReview,
    busyHandoff,
    busyMilestoneAction,
    errorMessage,
    load,
    reviewPlan,
    previewHandoff,
    confirmHandoff,
    clearHandoffPreview,
    previewMilestoneAction,
    confirmMilestoneAction,
    clearMilestoneActionPreview,
  };
};
