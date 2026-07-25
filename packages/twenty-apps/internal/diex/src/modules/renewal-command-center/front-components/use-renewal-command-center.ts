import { useCallback, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { enqueueSnackbar, useUserId } from 'twenty-sdk/front-component';

import {
  type CustomerRenewal,
  type RenewalDraft,
  type RenewalEvent,
  type RenewalSuccessPlan,
  type RenewalWorkspaceMember,
} from 'src/modules/renewal-command-center/front-components/renewal-command-center.types';

type CustomerRenewalNode = Omit<CustomerRenewal, 'renewalEvents'> & {
  renewalEvents?: {
    edges?: Array<{
      node: RenewalEvent;
    }>;
  } | null;
};

type RenewalQueryResult = {
  customerRenewals?: {
    edges?: Array<{
      node: CustomerRenewalNode;
    }>;
  };
  successPlans?: {
    edges?: Array<{
      node: RenewalSuccessPlan;
    }>;
  };
  workspaceMembers?: {
    edges?: Array<{
      node: RenewalWorkspaceMember;
    }>;
  };
};

type CreateRenewalResult = {
  createCustomerRenewal?: {
    id?: string;
  };
};

const ACTIVE_STAGES = ['PLANNING', 'VALUE_PROOF', 'NEGOTIATION', 'COMMITMENT'];

const addDays = (value: Date, days: number): string => {
  const nextDate = new Date(value);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate.toISOString();
};

const normalizeDateTime = (value: string): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const inferRisk = (health?: string | null): string =>
  health === 'CRITICAL'
    ? 'CRITICAL'
    : health === 'ATTENTION'
      ? 'HIGH'
      : health === 'HEALTHY'
        ? 'LOW'
        : 'MEDIUM';

const inferProbability = (health?: string | null): number =>
  health === 'CRITICAL'
    ? 25
    : health === 'ATTENTION'
      ? 45
      : health === 'HEALTHY'
        ? 75
        : 55;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação de renovação.';

export const useRenewalCommandCenter = () => {
  const userId = useUserId();
  const [renewals, setRenewals] = useState<CustomerRenewal[]>([]);
  const [successPlans, setSuccessPlans] = useState<RenewalSuccessPlan[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<
    RenewalWorkspaceMember[]
  >([]);
  const [currentWorkspaceMemberId, setCurrentWorkspaceMemberId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = (await new CoreApiClient().query({
        customerRenewals: {
          __args: {
            first: 200,
            orderBy: [{ targetDate: 'AscNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              name: true,
              stage: true,
              risk: true,
              forecast: true,
              renewalValue: {
                amountMicros: true,
                currencyCode: true,
              },
              probability: true,
              targetDate: true,
              nextAction: true,
              nextActionAt: true,
              lastTouchAt: true,
              riskReason: {
                markdown: true,
              },
              valueEvidence: {
                markdown: true,
              },
              commercialTerms: {
                markdown: true,
              },
              outcome: {
                markdown: true,
              },
              closedAt: true,
              updatedAt: true,
              successPlan: {
                id: true,
                name: true,
              },
              company: {
                id: true,
                name: true,
              },
              owner: {
                id: true,
                userId: true,
                name: {
                  firstName: true,
                  lastName: true,
                },
              },
              renewalEvents: {
                edges: {
                  node: {
                    id: true,
                    eventType: true,
                    summary: true,
                    occurredAt: true,
                    actor: {
                      id: true,
                      name: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        successPlans: {
          __args: {
            first: 200,
            orderBy: [{ renewalDate: 'AscNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              name: true,
              health: true,
              healthScore: true,
              renewalDate: true,
              recurringRevenue: {
                amountMicros: true,
                currencyCode: true,
              },
              risks: {
                markdown: true,
              },
              executiveSummary: {
                markdown: true,
              },
              company: {
                id: true,
                name: true,
              },
              owner: {
                id: true,
                userId: true,
                name: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        workspaceMembers: {
          __args: {
            first: 100,
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
      } as never)) as unknown as RenewalQueryResult;
      const members =
        result.workspaceMembers?.edges?.map(({ node }) => node) ?? [];

      setRenewals(
        result.customerRenewals?.edges?.map(({ node }) => ({
          ...node,
          renewalEvents:
            node.renewalEvents?.edges
              ?.map(({ node: event }) => event)
              .sort(
                (left, right) =>
                  new Date(right.occurredAt).getTime() -
                  new Date(left.occurredAt).getTime(),
              ) ?? [],
        })) ?? [],
      );
      setSuccessPlans(
        result.successPlans?.edges?.map(({ node }) => node) ?? [],
      );
      setWorkspaceMembers(members);
      setCurrentWorkspaceMemberId(
        members.find((member) => member.userId === userId)?.id ?? null,
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

  const recordEvent = useCallback(
    async (
      customerRenewalId: string,
      eventType: string,
      summary: string,
    ): Promise<boolean> => {
      try {
        await new CoreApiClient().mutation({
          createCustomerRenewalEvent: {
            __args: {
              data: {
                name: `renewal-${Date.now()}-${eventType.toLowerCase()}`,
                eventType,
                summary: summary.trim().slice(0, 500),
                occurredAt: new Date().toISOString(),
                customerRenewalId,
                actorId: currentWorkspaceMemberId,
              },
            },
            id: true,
          },
        } as never);

        return true;
      } catch {
        await enqueueSnackbar({
          message:
            'A alteração foi salva, mas o histórico não pôde ser registrado.',
          variant: 'warning',
        });

        return false;
      }
    },
    [currentWorkspaceMemberId],
  );

  const createRenewal = useCallback(
    async (successPlanId: string): Promise<string | null> => {
      const successPlan = successPlans.find(
        (plan) => plan.id === successPlanId,
      );

      if (!successPlan) {
        await enqueueSnackbar({
          message: 'Selecione um plano de sucesso válido.',
          variant: 'warning',
        });

        return null;
      }

      if (
        renewals.some(
          (renewal) =>
            renewal.successPlan?.id === successPlanId &&
            ACTIVE_STAGES.includes(renewal.stage),
        )
      ) {
        await enqueueSnackbar({
          message: 'Este plano já possui uma renovação ativa.',
          variant: 'warning',
        });

        return null;
      }

      const targetDate =
        successPlan.renewalDate ?? addDays(new Date(), 90).slice(0, 10);
      const nextActionAt = addDays(new Date(), 7);
      const companyName =
        typeof successPlan.company?.name === 'string'
          ? successPlan.company.name
          : successPlan.name;
      const renewalYear = new Date(targetDate).getFullYear();

      setBusyAction('create');

      try {
        const result = (await new CoreApiClient().mutation({
          createCustomerRenewal: {
            __args: {
              data: {
                name: `Renovação · ${companyName || successPlan.name} · ${renewalYear}`,
                stage: 'PLANNING',
                risk: inferRisk(successPlan.health),
                forecast: 'PIPELINE',
                renewalValue: successPlan.recurringRevenue ?? undefined,
                probability: inferProbability(successPlan.health),
                targetDate,
                nextAction:
                  'Confirmar decisores, valor percebido e plano de renovação.',
                nextActionAt,
                riskReason: {
                  markdown: successPlan.risks?.markdown?.trim() || '',
                  blocknote: null,
                },
                valueEvidence: {
                  markdown:
                    successPlan.executiveSummary?.markdown?.trim() || '',
                  blocknote: null,
                },
                successPlanId: successPlan.id,
                companyId: successPlan.company?.id ?? null,
                ownerId: successPlan.owner?.id ?? currentWorkspaceMemberId,
              },
            },
            id: true,
          },
        } as never)) as unknown as CreateRenewalResult;
        const customerRenewalId = result.createCustomerRenewal?.id;

        if (!customerRenewalId) {
          throw new Error('A renovação não retornou um identificador.');
        }

        await recordEvent(
          customerRenewalId,
          'CREATED',
          `Caso aberto a partir do plano ${successPlan.name}.`,
        );
        await load();
        await enqueueSnackbar({
          message: 'Caso de renovação criado e adicionado à operação.',
          variant: 'success',
        });

        return customerRenewalId;
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
    [currentWorkspaceMemberId, load, recordEvent, renewals, successPlans],
  );

  const updateRenewal = useCallback(
    async (
      customerRenewalId: string,
      draft: RenewalDraft,
    ): Promise<boolean> => {
      const renewal = renewals.find(({ id }) => id === customerRenewalId);

      if (!renewal) {
        return false;
      }

      const normalizedProbability = Math.max(
        0,
        Math.min(100, Number(draft.probability) || 0),
      );
      const isClosed = ['RENEWED', 'CHURNED'].includes(draft.stage);
      const stageChanged = renewal.stage !== draft.stage;

      if (isClosed && !draft.outcome.trim()) {
        await enqueueSnackbar({
          message:
            'Registre o resultado ou motivo antes de fechar a renovação.',
          variant: 'warning',
        });

        return false;
      }

      setBusyAction(`save:${customerRenewalId}`);

      try {
        await new CoreApiClient().mutation({
          updateCustomerRenewal: {
            __args: {
              id: customerRenewalId,
              data: {
                stage: draft.stage,
                risk: draft.risk,
                forecast: isClosed ? 'CLOSED' : draft.forecast,
                probability:
                  draft.stage === 'RENEWED'
                    ? 100
                    : draft.stage === 'CHURNED'
                      ? 0
                      : normalizedProbability,
                targetDate: draft.targetDate || null,
                nextAction: draft.nextAction.trim() || null,
                nextActionAt: normalizeDateTime(draft.nextActionAt),
                ownerId: draft.ownerId || null,
                riskReason: {
                  markdown: draft.riskReason.trim(),
                  blocknote: null,
                },
                valueEvidence: {
                  markdown: draft.valueEvidence.trim(),
                  blocknote: null,
                },
                commercialTerms: {
                  markdown: draft.commercialTerms.trim(),
                  blocknote: null,
                },
                outcome: {
                  markdown: draft.outcome.trim(),
                  blocknote: null,
                },
                closedAt: isClosed
                  ? (renewal.closedAt ?? new Date().toISOString())
                  : null,
              },
            },
            id: true,
          },
        } as never);

        await recordEvent(
          customerRenewalId,
          stageChanged
            ? draft.stage === 'RENEWED'
              ? 'CLOSED_WON'
              : draft.stage === 'CHURNED'
                ? 'CLOSED_LOST'
                : 'STAGE_CHANGED'
            : 'PLAN_UPDATED',
          stageChanged
            ? `Etapa alterada de ${renewal.stage} para ${draft.stage}.`
            : 'Plano de renovação atualizado.',
        );
        await load();
        await enqueueSnackbar({
          message: isClosed
            ? draft.stage === 'RENEWED'
              ? 'Renovação fechada como ganha.'
              : 'Churn registrado com histórico preservado.'
            : 'Plano de renovação atualizado.',
          variant: draft.stage === 'CHURNED' ? 'warning' : 'success',
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
    [load, recordEvent, renewals],
  );

  const recordTouch = useCallback(
    async (customerRenewalId: string): Promise<boolean> => {
      setBusyAction(`touch:${customerRenewalId}`);

      try {
        await new CoreApiClient().mutation({
          updateCustomerRenewal: {
            __args: {
              id: customerRenewalId,
              data: {
                lastTouchAt: new Date().toISOString(),
              },
            },
            id: true,
          },
        } as never);
        await recordEvent(
          customerRenewalId,
          'TOUCH_RECORDED',
          'Contato com o cliente registrado.',
        );
        await load();
        await enqueueSnackbar({
          message: 'Contato registrado no histórico da renovação.',
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
    [load, recordEvent],
  );

  const proposeAiIntervention = useCallback(
    async (customerRenewalId: string): Promise<boolean> => {
      const renewal = renewals.find(({ id }) => id === customerRenewalId);

      if (!renewal?.successPlan?.id) {
        await enqueueSnackbar({
          message:
            'Vincule um plano de sucesso antes de propor uma intervenção.',
          variant: 'warning',
        });

        return false;
      }

      setBusyAction(`ai:${customerRenewalId}`);

      try {
        const evidenceCount = [
          renewal.riskReason?.markdown?.trim(),
          renewal.valueEvidence?.markdown?.trim(),
          renewal.nextAction?.trim(),
          renewal.targetDate,
        ].filter(Boolean).length;

        await new CoreApiClient().mutation({
          createAiAction: {
            __args: {
              data: {
                name: `Intervenção de renovação · ${renewal.name}`,
                type: 'CS_INTERVENTION',
                status: 'PENDING_APPROVAL',
                confidence: 50 + evidenceCount * 10,
                requiresApproval: true,
                rationale: {
                  markdown: [
                    `Renovação em ${renewal.stage}, risco ${renewal.risk} e probabilidade de ${renewal.probability ?? 0}%.`,
                    renewal.riskReason?.markdown?.trim(),
                  ]
                    .filter(Boolean)
                    .join('\n\n'),
                  blocknote: null,
                },
                proposedAction: {
                  markdown: [
                    renewal.nextAction?.trim() ||
                      'Conduzir plano executivo de recuperação da renovação.',
                    renewal.valueEvidence?.markdown?.trim()
                      ? `Evidência disponível: ${renewal.valueEvidence.markdown.trim()}`
                      : 'Validar evidência de valor com o decisor.',
                  ].join('\n\n'),
                  blocknote: null,
                },
                requestedAt: new Date().toISOString(),
                successPlanId: renewal.successPlan.id,
                customerRenewalId: renewal.id,
              },
            },
            id: true,
          },
        } as never);
        await recordEvent(
          customerRenewalId,
          'AI_ACTION_PROPOSED',
          'Intervenção enviada para aprovação humana no Centro de IA.',
        );
        await load();
        await enqueueSnackbar({
          message:
            'Intervenção criada. A execução depende de aprovação no Centro de IA.',
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
    [load, recordEvent, renewals],
  );

  return {
    renewals,
    successPlans,
    workspaceMembers,
    isLoading,
    busyAction,
    errorMessage,
    load,
    createRenewal,
    updateRenewal,
    recordTouch,
    proposeAiIntervention,
  };
};
