import { gql } from '@apollo/client';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import {
  type CustomerRenewal,
  type RenewalDraft,
  type RenewalEvent,
  type RenewalSuccessPlan,
  type RenewalWorkspaceMember,
} from '@/diex-command-centers/renewal/types';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const RENEWAL_QUERY = gql`
  query DiexRenewalCommandCenter {
    customerRenewals(first: 200, orderBy: [{ targetDate: AscNullsLast }]) {
      totalCount
      edges {
        node {
          id
          name
          stage
          risk
          forecast
          probability
          targetDate
          nextAction
          nextActionAt
          lastTouchAt
          closedAt
          renewalValue {
            amountMicros
            currencyCode
          }
          riskReason {
            markdown
          }
          valueEvidence {
            markdown
          }
          commercialTerms {
            markdown
          }
          outcome {
            markdown
          }
          successPlan {
            id
            name
          }
          company {
            id
            name
          }
          owner {
            id
            userId
            name {
              firstName
              lastName
            }
          }
          renewalEvents {
            edges {
              node {
                id
                eventType
                summary
                occurredAt
                actor {
                  id
                  name {
                    firstName
                    lastName
                  }
                }
              }
            }
          }
        }
      }
    }
    successPlans(first: 200, orderBy: [{ renewalDate: AscNullsLast }]) {
      totalCount
      edges {
        node {
          id
          name
          health
          renewalDate
          recurringRevenue {
            amountMicros
            currencyCode
          }
          risks {
            markdown
          }
          executiveSummary {
            markdown
          }
          company {
            id
            name
          }
          owner {
            id
            userId
            name {
              firstName
              lastName
            }
          }
        }
      }
    }
    workspaceMembers(first: 100) {
      edges {
        node {
          id
          userId
          name {
            firstName
            lastName
          }
        }
      }
    }
  }
`;
const CREATE_RENEWAL = gql`
  mutation DiexCreateRenewal($data: CustomerRenewalCreateInput!) {
    createCustomerRenewal(data: $data) {
      id
    }
  }
`;
const UPDATE_RENEWAL = gql`
  mutation DiexUpdateRenewal($id: UUID!, $data: CustomerRenewalUpdateInput!) {
    updateCustomerRenewal(id: $id, data: $data) {
      id
    }
  }
`;
const CREATE_EVENT = gql`
  mutation DiexCreateRenewalEvent($data: CustomerRenewalEventCreateInput!) {
    createCustomerRenewalEvent(data: $data) {
      id
    }
  }
`;
const CREATE_AI_ACTION = gql`
  mutation DiexCreateRenewalAiAction($data: AiActionCreateInput!) {
    createAiAction(data: $data) {
      id
    }
  }
`;

type RenewalNode = Omit<CustomerRenewal, 'renewalEvents'> & {
  renewalEvents?: { edges?: Array<{ node: RenewalEvent }> } | null;
};
type QueryData = {
  customerRenewals?: {
    totalCount?: number;
    edges?: Array<{ node: RenewalNode }>;
  };
  successPlans?: {
    totalCount?: number;
    edges?: Array<{ node: RenewalSuccessPlan }>;
  };
  workspaceMembers?: { edges?: Array<{ node: RenewalWorkspaceMember }> };
};

const addDays = (date: Date, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
};
const normalizeDateTime = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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

export const useRenewalCommandCenter = () => {
  const client = useApolloClient();
  const currentUser = useAtomStateValue(currentUserState);
  const {
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
  } = useSnackBar();
  const { data, loading, error, refetch } = useQuery<QueryData>(RENEWAL_QUERY, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  const renewals = useMemo(
    () =>
      data?.customerRenewals?.edges?.map(({ node }) => ({
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
    [data?.customerRenewals?.edges],
  );
  const successPlans = useMemo(
    () => data?.successPlans?.edges?.map(({ node }) => node) ?? [],
    [data?.successPlans?.edges],
  );
  const workspaceMembers = useMemo(
    () => data?.workspaceMembers?.edges?.map(({ node }) => node) ?? [],
    [data?.workspaceMembers?.edges],
  );
  const currentWorkspaceMemberId =
    workspaceMembers.find(({ userId }) => userId === currentUser?.id)?.id ??
    null;
  const renewalTotalCount =
    data?.customerRenewals?.totalCount ?? renewals.length;
  const successPlanTotalCount =
    data?.successPlans?.totalCount ?? successPlans.length;
  const dataLoadedAt = useMemo(
    () => (data ? new Date().toISOString() : null),
    [data],
  );
  const recordEvent = useCallback(
    async (customerRenewalId: string, eventType: string, summary: string) => {
      try {
        await client.mutate({
          mutation: CREATE_EVENT,
          variables: {
            data: {
              name: `renewal-${Date.now()}-${eventType.toLowerCase()}`,
              eventType,
              summary: summary.slice(0, 500),
              occurredAt: new Date().toISOString(),
              customerRenewalId,
              actorId: currentWorkspaceMemberId,
            },
          },
        });
      } catch {
        enqueueWarningSnackBar({
          message:
            'A alteração foi salva, mas o histórico não pôde ser registrado.',
        });
      }
    },
    [client, currentWorkspaceMemberId, enqueueWarningSnackBar],
  );
  const createRenewal = useCallback(
    async (successPlanId: string): Promise<string | null> => {
      if (error) {
        enqueueErrorSnackBar({
          message:
            'Atualize as renovações antes de criar um caso; os dados atuais não foram confirmados.',
        });
        return null;
      }

      const plan = successPlans.find(({ id }) => id === successPlanId);
      if (!plan) {
        enqueueWarningSnackBar({
          message: 'Selecione um plano de sucesso válido.',
        });
        return null;
      }
      if (
        renewals.some(
          (renewal) =>
            renewal.successPlan?.id === successPlanId &&
            ['PLANNING', 'VALUE_PROOF', 'NEGOTIATION', 'COMMITMENT'].includes(
              renewal.stage,
            ),
        )
      ) {
        enqueueWarningSnackBar({
          message: 'Este plano já possui uma renovação ativa.',
        });
        return null;
      }
      const targetDate =
        plan.renewalDate ?? addDays(new Date(), 90).slice(0, 10);
      try {
        const result = await client.mutate<{
          createCustomerRenewal?: { id?: string };
        }>({
          mutation: CREATE_RENEWAL,
          variables: {
            data: {
              name: `Renovação · ${typeof plan.company?.name === 'string' ? plan.company.name : plan.name} · ${new Date(targetDate).getFullYear()}`,
              stage: 'PLANNING',
              risk: inferRisk(plan.health),
              forecast: 'PIPELINE',
              renewalValue: plan.recurringRevenue ?? undefined,
              probability: inferProbability(plan.health),
              targetDate,
              nextAction:
                'Confirmar decisores, valor percebido e plano de renovação.',
              nextActionAt: addDays(new Date(), 7),
              riskReason: {
                markdown: plan.risks?.markdown?.trim() || '',
                blocknote: null,
              },
              valueEvidence: {
                markdown: plan.executiveSummary?.markdown?.trim() || '',
                blocknote: null,
              },
              successPlanId: plan.id,
              companyId: plan.company?.id ?? null,
              ownerId: plan.owner?.id ?? currentWorkspaceMemberId,
            },
          },
        });
        const id = result.data?.createCustomerRenewal?.id;
        if (!id) throw new Error('missing-renewal-id');
        await recordEvent(
          id,
          'CREATED',
          `Caso aberto a partir do plano ${plan.name}.`,
        );
        await refetch();
        enqueueSuccessSnackBar({
          message: 'Caso de renovação criado e adicionado à operação.',
        });
        return id;
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível concluir a operação de renovação.',
        });
        return null;
      }
    },
    [
      client,
      currentWorkspaceMemberId,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      error,
      recordEvent,
      refetch,
      renewals,
      successPlans,
    ],
  );
  const updateRenewal = useCallback(
    async (id: string, draft: RenewalDraft): Promise<boolean> => {
      if (error) {
        enqueueErrorSnackBar({
          message:
            'Atualize as renovações antes de salvar; os dados atuais não foram confirmados.',
        });
        return false;
      }

      const renewal = renewals.find((item) => item.id === id);
      if (!renewal) return false;
      const isClosed = ['RENEWED', 'CHURNED'].includes(draft.stage);
      if (isClosed && !draft.outcome.trim()) {
        enqueueWarningSnackBar({
          message:
            'Registre o resultado ou motivo antes de fechar a renovação.',
        });
        return false;
      }
      try {
        const probability = Math.max(
          0,
          Math.min(100, Number(draft.probability) || 0),
        );
        await client.mutate({
          mutation: UPDATE_RENEWAL,
          variables: {
            id,
            data: {
              stage: draft.stage,
              risk: draft.risk,
              forecast: isClosed ? 'CLOSED' : draft.forecast,
              probability:
                draft.stage === 'RENEWED'
                  ? 100
                  : draft.stage === 'CHURNED'
                    ? 0
                    : probability,
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
              outcome: { markdown: draft.outcome.trim(), blocknote: null },
              closedAt: isClosed
                ? (renewal.closedAt ?? new Date().toISOString())
                : null,
            },
          },
        });
        await recordEvent(
          id,
          renewal.stage === draft.stage
            ? 'PLAN_UPDATED'
            : draft.stage === 'RENEWED'
              ? 'CLOSED_WON'
              : draft.stage === 'CHURNED'
                ? 'CLOSED_LOST'
                : 'STAGE_CHANGED',
          renewal.stage === draft.stage
            ? 'Plano de renovação atualizado.'
            : `Etapa alterada de ${renewal.stage} para ${draft.stage}.`,
        );
        await refetch();
        enqueueSuccessSnackBar({
          message:
            draft.stage === 'RENEWED'
              ? 'Renovação fechada como ganha.'
              : draft.stage === 'CHURNED'
                ? 'Churn registrado com histórico preservado.'
                : 'Plano de renovação atualizado.',
        });
        return true;
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível concluir a operação de renovação.',
        });
        return false;
      }
    },
    [
      client,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      error,
      recordEvent,
      refetch,
      renewals,
    ],
  );
  const recordTouch = useCallback(
    async (id: string) => {
      if (error) {
        enqueueErrorSnackBar({
          message:
            'Atualize as renovações antes de registrar contato; os dados atuais não foram confirmados.',
        });
        return false;
      }

      try {
        await client.mutate({
          mutation: UPDATE_RENEWAL,
          variables: { id, data: { lastTouchAt: new Date().toISOString() } },
        });
        await recordEvent(
          id,
          'TOUCH_RECORDED',
          'Contato com o cliente registrado.',
        );
        await refetch();
        enqueueSuccessSnackBar({
          message: 'Contato registrado no histórico da renovação.',
        });
        return true;
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível concluir a operação de renovação.',
        });
        return false;
      }
    },
    [
      client,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      error,
      recordEvent,
      refetch,
    ],
  );
  const proposeAiIntervention = useCallback(
    async (id: string) => {
      if (error) {
        enqueueErrorSnackBar({
          message:
            'Atualize as renovações antes de propor uma ação; os dados atuais não foram confirmados.',
        });
        return false;
      }

      const renewal = renewals.find((item) => item.id === id);
      if (!renewal?.successPlan?.id) {
        enqueueWarningSnackBar({
          message:
            'Vincule um plano de sucesso antes de propor uma intervenção.',
        });
        return false;
      }
      try {
        const evidence = [
          renewal.riskReason?.markdown?.trim(),
          renewal.valueEvidence?.markdown?.trim(),
          renewal.nextAction?.trim(),
          renewal.targetDate,
        ].filter(Boolean).length;
        await client.mutate({
          mutation: CREATE_AI_ACTION,
          variables: {
            data: {
              name: `Intervenção de renovação · ${renewal.name}`,
              actionType: 'CS_INTERVENTION',
              status: 'PENDING_APPROVAL',
              confidence: 50 + evidence * 10,
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
        });
        await recordEvent(
          id,
          'AI_ACTION_PROPOSED',
          'Intervenção enviada para aprovação humana no Centro de IA.',
        );
        await refetch();
        enqueueSuccessSnackBar({
          message:
            'Intervenção criada. A execução depende de aprovação no Centro de IA.',
        });
        return true;
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível concluir a operação de renovação.',
        });
        return false;
      }
    },
    [
      client,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      error,
      recordEvent,
      refetch,
      renewals,
    ],
  );
  return {
    renewals,
    successPlans,
    workspaceMembers,
    renewalTotalCount,
    successPlanTotalCount,
    isPartial:
      renewalTotalCount > renewals.length ||
      successPlanTotalCount > successPlans.length,
    dataLoadedAt,
    isLoading: loading,
    errorMessage: error
      ? 'Não foi possível carregar o Centro de Renovações.'
      : null,
    load: refetch,
    createRenewal,
    updateRenewal,
    recordTouch,
    proposeAiIntervention,
  };
};
