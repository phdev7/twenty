import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { runAgent } from 'twenty-sdk/logic-function';

import { CUSTOMER_SUCCESS_REVIEW_AGENT_UNIVERSAL_IDENTIFIER } from 'src/agents/customer-success-review.agent';
import {
  assessCustomerHealth,
  type CustomerHealthResult,
} from 'src/logic-functions/assess-customer-health.logic-function';
import { proposeAiAction } from 'src/logic-functions/propose-ai-action.logic-function';
import { AiActionType } from 'src/objects/ai-action.object';
import {
  CommercialSignalStatus,
  CommercialSignalType,
} from 'src/objects/commercial-signal.object';
import {
  SuccessLifecycle,
  type SuccessHealth,
} from 'src/objects/success-plan.object';
import {
  SuccessMilestoneCategory,
  SuccessMilestoneStatus,
} from 'src/objects/success-milestone.object';
import {
  readAgentRecord,
  readBoolean,
  readNumber,
  readRequiredString,
} from 'src/utils/agent-result';

type ReviewCustomerSuccessInput = {
  successPlanId: string;
  updateSuccessPlan?: boolean;
  proposeAction?: boolean;
};

type SuccessPlanContext = {
  id: string;
  name: string | null;
  lifecycle: SuccessLifecycle | null;
  health: SuccessHealth | null;
  healthScore: number | null;
  activeUseRating: string | null;
  valueEvidenceRating: string | null;
  expansionSignal: boolean | null;
  recurringRevenue: {
    amountMicros?: number | null;
    currencyCode?: string | null;
  } | null;
  startDate: string | null;
  renewalDate: string | null;
  nextReviewAt: string | null;
  objectives: { markdown?: string | null } | null;
  successCriteria: { markdown?: string | null } | null;
  risks: { markdown?: string | null } | null;
  executiveSummary: { markdown?: string | null } | null;
  updatedAt: string | null;
  company: { id: string; name: string | null } | null;
  primaryContact: {
    id: string;
    name: { firstName: string | null; lastName: string | null } | null;
  } | null;
  owner: {
    id: string;
    name: { firstName: string | null; lastName: string | null } | null;
  } | null;
};

type MilestoneContext = {
  id: string;
  name: string | null;
  category: SuccessMilestoneCategory | null;
  status: SuccessMilestoneStatus | null;
  dueAt: string | null;
  completedAt: string | null;
  outcome: { markdown?: string | null } | null;
  evidence: { markdown?: string | null } | null;
  impact: string | null;
};

type SignalContext = {
  id: string;
  type: CommercialSignalType | null;
  status: CommercialSignalStatus | null;
  strength: string | null;
  confidence: number | null;
  evidence: { markdown?: string | null } | null;
  recommendedAction: { markdown?: string | null } | null;
  capturedAt: string | null;
};

type ConversationContext = {
  id: string;
  name: string | null;
  channel: string | null;
  status: string | null;
  priority: string | null;
  lastMessagePreview: string | null;
  lastMessageDirection: string | null;
  lastMessageAt: string | null;
};

export type ReviewCustomerSuccessResult = {
  successPlanId: string;
  health: CustomerHealthResult;
  summary: string;
  riskLevel: 'HEALTHY' | 'ATTENTION' | 'CRITICAL' | 'UNKNOWN';
  confidence: number;
  facts: string;
  gaps: string;
  intervention: string;
  nextReviewAt: string;
  successPlanUpdated: boolean;
  aiActionId?: string;
  message: string;
};

const ratingToNumber = (value: string | null | undefined) => {
  const match = value?.match(/^RATING_([1-5])$/);

  return match ? Number(match[1]) : undefined;
};

const daysSince = (value: string | null | undefined): number | undefined => {
  if (!value) return undefined;

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp)
    ? Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
    : undefined;
};

const daysUntil = (value: string | null | undefined): number | undefined => {
  if (!value) return undefined;

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp)
    ? Math.ceil((timestamp - Date.now()) / 86_400_000)
    : undefined;
};

const getRiskLevel = (
  value: string,
): ReviewCustomerSuccessResult['riskLevel'] =>
  ['HEALTHY', 'ATTENTION', 'CRITICAL', 'UNKNOWN'].includes(value)
    ? (value as ReviewCustomerSuccessResult['riskLevel'])
    : 'UNKNOWN';

const getActionType = (value: string): AiActionType | null => {
  const allowed = [
    AiActionType.CS_INTERVENTION,
    AiActionType.EXPANSION,
    AiActionType.FOLLOW_UP,
  ];

  return allowed.includes(value as AiActionType)
    ? (value as AiActionType)
    : null;
};

const loadSuccessPlan = async (
  client: CoreApiClient,
  successPlanId: string,
): Promise<SuccessPlanContext> => {
  const result = (await client.query({
    successPlan: {
      __args: { filter: { id: { eq: successPlanId } } },
      id: true,
      name: true,
      lifecycle: true,
      health: true,
      healthScore: true,
      activeUseRating: true,
      valueEvidenceRating: true,
      expansionSignal: true,
      recurringRevenue: { amountMicros: true, currencyCode: true },
      startDate: true,
      renewalDate: true,
      nextReviewAt: true,
      objectives: { markdown: true },
      successCriteria: { markdown: true },
      risks: { markdown: true },
      executiveSummary: { markdown: true },
      updatedAt: true,
      company: { id: true, name: true },
      primaryContact: {
        id: true,
        name: { firstName: true, lastName: true },
      },
      owner: {
        id: true,
        name: { firstName: true, lastName: true },
      },
    },
  } as never)) as unknown as {
    successPlan?: SuccessPlanContext | null;
  };

  if (!result.successPlan?.id) {
    throw new Error('O plano de sucesso não foi encontrado.');
  }

  return result.successPlan;
};

const loadRelatedContext = async (
  client: CoreApiClient,
  successPlan: SuccessPlanContext,
): Promise<{
  milestones: MilestoneContext[];
  signals: SignalContext[];
  conversations: ConversationContext[];
}> => {
  const [milestonesResult, signalsResult, conversationsResult] =
    await Promise.all([
      client.query({
        successMilestones: {
          __args: {
            filter: { successPlanId: { eq: successPlan.id } },
            first: 100,
            orderBy: [{ dueAt: 'AscNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              name: true,
              category: true,
              status: true,
              dueAt: true,
              completedAt: true,
              outcome: { markdown: true },
              evidence: { markdown: true },
              impact: true,
            },
          },
        },
      } as never),
      successPlan.company?.id
        ? client.query({
            commercialSignals: {
              __args: {
                filter: { companyId: { eq: successPlan.company.id } },
                first: 100,
                orderBy: [{ capturedAt: 'DescNullsLast' }],
              },
              edges: {
                node: {
                  id: true,
                  type: true,
                  status: true,
                  strength: true,
                  confidence: true,
                  evidence: { markdown: true },
                  recommendedAction: { markdown: true },
                  capturedAt: true,
                },
              },
            },
          } as never)
        : Promise.resolve({}),
      successPlan.company?.id
        ? client.query({
            inboxConversations: {
              __args: {
                filter: { companyId: { eq: successPlan.company.id } },
                first: 50,
                orderBy: [{ lastMessageAt: 'DescNullsLast' }],
              },
              edges: {
                node: {
                  id: true,
                  name: true,
                  channel: true,
                  status: true,
                  priority: true,
                  lastMessagePreview: true,
                  lastMessageDirection: true,
                  lastMessageAt: true,
                },
              },
            },
          } as never)
        : Promise.resolve({}),
    ]);

  return {
    milestones:
      (
        milestonesResult as unknown as {
          successMilestones?: {
            edges?: Array<{ node: MilestoneContext }>;
          };
        }
      ).successMilestones?.edges?.map(({ node }) => node) ?? [],
    signals:
      (
        signalsResult as unknown as {
          commercialSignals?: {
            edges?: Array<{ node: SignalContext }>;
          };
        }
      ).commercialSignals?.edges?.map(({ node }) => node) ?? [],
    conversations:
      (
        conversationsResult as unknown as {
          inboxConversations?: {
            edges?: Array<{ node: ConversationContext }>;
          };
        }
      ).inboxConversations?.edges?.map(({ node }) => node) ?? [],
  };
};

export const reviewCustomerSuccess = async (
  input: ReviewCustomerSuccessInput,
): Promise<ReviewCustomerSuccessResult> => {
  const successPlanId = input.successPlanId.trim();

  if (!successPlanId) {
    throw new Error('successPlanId é obrigatório.');
  }

  const client = new CoreApiClient();
  const successPlan = await loadSuccessPlan(client, successPlanId);
  const context = await loadRelatedContext(client, successPlan);
  const onboardingMilestones = context.milestones.filter(
    ({ category, status }) =>
      category === SuccessMilestoneCategory.ONBOARDING &&
      status !== SuccessMilestoneStatus.CANCELLED,
  );
  const onboardingCompleted =
    onboardingMilestones.length > 0
      ? onboardingMilestones.every(
          ({ status }) => status === SuccessMilestoneStatus.COMPLETED,
        )
      : successPlan.lifecycle === SuccessLifecycle.ONBOARDING
        ? false
        : undefined;
  const openBlockedMilestones = context.milestones.filter(
    ({ status }) => status === SuccessMilestoneStatus.BLOCKED,
  ).length;
  const activeSignals = context.signals.filter(
    ({ status }) =>
      status !== CommercialSignalStatus.ACTIONED &&
      status !== CommercialSignalStatus.DISMISSED,
  );
  const criticalTypes = new Set([
    CommercialSignalType.RISK,
    CommercialSignalType.CHURN_RISK,
  ]);
  const unresolvedCriticalSignals = activeSignals.filter(
    ({ type, strength }) =>
      type !== null &&
      criticalTypes.has(type) &&
      (ratingToNumber(strength) ?? 0) >= 4,
  ).length;
  const daysSinceLastMeaningfulContact = daysSince(
    context.conversations[0]?.lastMessageAt,
  );
  const daysUntilRenewal = daysUntil(successPlan.renewalDate);
  const health = assessCustomerHealth({
    onboardingCompleted,
    activeUseRating: ratingToNumber(successPlan.activeUseRating),
    valueEvidenceRating: ratingToNumber(
      successPlan.valueEvidenceRating,
    ),
    daysSinceLastMeaningfulContact,
    daysUntilRenewal,
    openBlockedMilestones,
    unresolvedCriticalSignals,
    expansionSignal: successPlan.expansionSignal ?? undefined,
  });
  const agentResult = await runAgent({
    agentUniversalIdentifier:
      CUSTOMER_SUCCESS_REVIEW_AGENT_UNIVERSAL_IDENTIFIER,
    prompt: [
      'Analise este pacote fechado do workspace atual. Não execute ações.',
      JSON.stringify({
        successPlan,
        calculatedHealth: health,
        milestones: context.milestones,
        signals: activeSignals.slice(0, 30),
        conversations: context.conversations.slice(0, 20),
        derived: {
          onboardingCompleted,
          openBlockedMilestones,
          unresolvedCriticalSignals,
          daysSinceLastMeaningfulContact,
          daysUntilRenewal,
        },
      }),
    ].join('\n\n'),
  });
  const record = readAgentRecord(agentResult);
  const summary = readRequiredString(record, 'summary');
  const riskLevel = getRiskLevel(
    readRequiredString(record, 'risk_level'),
  );
  const confidence = readNumber(record, 'confidence', 0, 100);
  const facts = readRequiredString(record, 'facts');
  const gaps = readRequiredString(record, 'gaps');
  const intervention = readRequiredString(record, 'intervention');
  const nextReviewDays = Math.round(
    readNumber(record, 'next_review_days', 1, 180),
  );
  const nextReviewAt = new Date(
    Date.now() + nextReviewDays * 86_400_000,
  ).toISOString();
  let successPlanUpdated = false;
  let aiActionId: string | undefined;

  if (input.updateSuccessPlan === true) {
    const result = (await client.mutation({
      updateSuccessPlan: {
        __args: {
          id: successPlanId,
          data: {
            healthScore: health.score,
            health: health.health,
            executiveSummary: {
              markdown: [
                summary,
                '',
                `Intervenção recomendada: ${intervention}`,
                '',
                `Confiança: ${Math.round(confidence)}%`,
              ].join('\n'),
              blocknote: null,
            },
            nextReviewAt,
          },
        },
        id: true,
      },
    } as never)) as unknown as {
      updateSuccessPlan?: { id?: string | null } | null;
    };

    successPlanUpdated = result.updateSuccessPlan?.id === successPlanId;
  }

  const actionType = getActionType(
    readRequiredString(record, 'action_type'),
  );

  if (
    input.proposeAction === true &&
    readBoolean(record, 'should_propose_action') &&
    actionType
  ) {
    const evidenceKey =
      context.signals[0]?.capturedAt ??
      context.conversations[0]?.lastMessageAt ??
      successPlan.updatedAt ??
      'no-evidence-date';
    const proposal = await proposeAiAction({
      name: readRequiredString(record, 'action_title'),
      type: actionType,
      confidence,
      rationale: readRequiredString(record, 'action_rationale'),
      proposedAction: readRequiredString(record, 'action_proposal'),
      successPlanId,
      idempotencyKey: `cs-review:${successPlanId}:${evidenceKey}`,
    });

    aiActionId = proposal.aiActionId;
  }

  return {
    successPlanId,
    health,
    summary,
    riskLevel,
    confidence,
    facts,
    gaps,
    intervention,
    nextReviewAt,
    successPlanUpdated,
    aiActionId,
    message:
      'Revisão de CS concluída sem mensagem, tarefa, oportunidade ou renovação automática.',
  };
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    successPlanId: {
      type: 'string' as const,
      description: 'ID do plano de sucesso do workspace atual.',
    },
    updateSuccessPlan: {
      type: 'boolean' as const,
      description:
        'Atualiza score, saúde, resumo executivo e próxima revisão.',
    },
    proposeAction: {
      type: 'boolean' as const,
      description:
        'Cria uma proposta idempotente aguardando aprovação humana.',
    },
  },
  required: ['successPlanId'],
};

export default defineLogicFunction({
  universalIdentifier: 'd1e0b000-0000-4000-8000-000000000007',
  name: 'review-diex-customer-success',
  description:
    'Revisa saúde, renovação e expansão com plano, marcos, sinais e conversas reais.',
  timeoutSeconds: 60,
  handler: reviewCustomerSuccess,
  toolTriggerSettings: { inputSchema },
  workflowActionTriggerSettings: {
    label: 'Revisar Customer Success com IA Diex',
    inputSchema: [{ ...inputSchema }],
    outputSchema: [
      {
        type: 'object',
        properties: {
          successPlanId: { type: 'string' },
          health: { type: 'object' },
          summary: { type: 'string' },
          riskLevel: { type: 'string' },
          confidence: { type: 'number' },
          facts: { type: 'string' },
          gaps: { type: 'string' },
          intervention: { type: 'string' },
          nextReviewAt: { type: 'string' },
          successPlanUpdated: { type: 'boolean' },
          aiActionId: { type: 'string' },
          message: { type: 'string' },
        },
      },
    ],
  },
});
