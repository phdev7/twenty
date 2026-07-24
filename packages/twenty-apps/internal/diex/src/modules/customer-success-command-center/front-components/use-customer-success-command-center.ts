import { useCallback, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import { CUSTOMER_SUCCESS_REVIEW_ROUTE } from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import {
  type CustomerSuccessAiAction,
  type CustomerSuccessMilestone,
  type CustomerSuccessPlan,
  type CustomerSuccessReviewResult,
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

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Não foi possível carregar Customer Success.';

export const useCustomerSuccessCommandCenter = () => {
  const [plans, setPlans] = useState<CustomerSuccessPlan[]>([]);
  const [reviews, setReviews] = useState<
    Record<string, CustomerSuccessReviewResult>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyReview, setBusyReview] = useState<{
    planId: string;
    mode: ReviewMode;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await new CoreApiClient().query({
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
      } as never);
      const nodes =
        (result as unknown as SuccessPlansQueryResult).successPlans?.edges?.map(
          ({ node }) => node,
        ) ?? [];

      setPlans(
        nodes.map((node) => ({
          ...node,
          milestones:
            node.milestones?.edges?.map(({ node: milestone }) => milestone) ??
            [],
          aiActions:
            node.aiActions?.edges?.map(({ node: aiAction }) => aiAction) ?? [],
        })),
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  return {
    plans,
    reviews,
    isLoading,
    busyReview,
    errorMessage,
    load,
    reviewPlan,
  };
};
