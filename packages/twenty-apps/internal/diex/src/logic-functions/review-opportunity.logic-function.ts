import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema, runAgent } from 'twenty-sdk/logic-function';

import { DEAL_REVIEW_AGENT_UNIVERSAL_IDENTIFIER } from 'src/agents/deal-review.agent';
import {
  calculateCommercialScore,
  type CommercialScoreResult,
} from 'src/logic-functions/calculate-commercial-score.logic-function';
import { proposeAiAction } from 'src/logic-functions/propose-ai-action.logic-function';
import { AiActionType } from 'src/objects/ai-action.object';
import {
  CommercialSignalStatus,
  CommercialSignalType,
} from 'src/objects/commercial-signal.object';
import {
  readAgentRecord,
  readBoolean,
  readNumber,
  readRequiredString,
} from 'src/utils/agent-result';

type ReviewOpportunityInput = {
  opportunityId: string;
  updateOpportunity?: boolean;
  proposeAction?: boolean;
};

type OpportunityContext = {
  id: string;
  name: string | null;
  stage: string | null;
  amount: { amountMicros?: number | null; currencyCode?: string | null } | null;
  closeDate: string | null;
  updatedAt: string | null;
  decisionAccessConfirmed: boolean | null;
  budgetConfirmed: boolean | null;
  needConfirmed: boolean | null;
  timingConfirmed: boolean | null;
  nextCommercialAction: string | null;
  nextCommercialActionAt: string | null;
  company: {
    id: string;
    name: string | null;
    icpFit: string | null;
    diexSegment: string | null;
    diexNiche: string | null;
    diexAnnualRevenueRange: string | null;
    diexEmployeeRange: string | null;
  } | null;
  pointOfContact: {
    id: string;
    name: { firstName: string | null; lastName: string | null } | null;
    buyingRole: string | null;
    buyingIntent: string | null;
  } | null;
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

export type ReviewOpportunityResult = {
  opportunityId: string;
  score: CommercialScoreResult;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  confidence: number;
  facts: string;
  gaps: string;
  reasoning: string;
  nextAction: string;
  opportunityUpdated: boolean;
  aiActionId?: string;
  message: string;
};

const ratingToNumber = (value: string | null | undefined) => {
  const match = value?.match(/^RATING_([1-5])$/);

  return match ? Number(match[1]) : undefined;
};

const daysSince = (value: string | null | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp)
    ? Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
    : undefined;
};

const getRisk = (value: string): ReviewOpportunityResult['risk'] =>
  ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'].includes(value)
    ? (value as ReviewOpportunityResult['risk'])
    : 'UNKNOWN';

const getActionType = (value: string): AiActionType | null => {
  const allowed = [
    AiActionType.QUALIFY,
    AiActionType.FOLLOW_UP,
    AiActionType.RISK_MITIGATION,
    AiActionType.PIPELINE_UPDATE,
  ];

  return allowed.includes(value as AiActionType)
    ? (value as AiActionType)
    : null;
};

const loadOpportunityContext = async (
  client: CoreApiClient,
  opportunityId: string,
): Promise<{
  opportunity: OpportunityContext;
  signals: SignalContext[];
  conversations: ConversationContext[];
}> => {
  const [opportunityResult, signalsResult, conversationsResult] =
    await Promise.all([
      client.query({
        opportunity: {
          __args: { filter: { id: { eq: opportunityId } } },
          id: true,
          name: true,
          stage: true,
          amount: { amountMicros: true, currencyCode: true },
          closeDate: true,
          updatedAt: true,
          decisionAccessConfirmed: true,
          budgetConfirmed: true,
          needConfirmed: true,
          timingConfirmed: true,
          nextCommercialAction: true,
          nextCommercialActionAt: true,
          company: {
            id: true,
            name: true,
            icpFit: true,
            diexSegment: true,
            diexNiche: true,
            diexAnnualRevenueRange: true,
            diexEmployeeRange: true,
          },
          pointOfContact: {
            id: true,
            name: { firstName: true, lastName: true },
            buyingRole: true,
            buyingIntent: true,
          },
        },
      } as never),
      client.query({
        commercialSignals: {
          __args: {
            filter: { opportunityId: { eq: opportunityId } },
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
      } as never),
      client.query({
        inboxConversations: {
          __args: {
            filter: { opportunityId: { eq: opportunityId } },
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
      } as never),
    ]);
  const opportunity = (
    opportunityResult as unknown as {
      opportunity?: OpportunityContext | null;
    }
  ).opportunity;

  if (!opportunity?.id) {
    throw new Error('A oportunidade não foi encontrada.');
  }

  return {
    opportunity,
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

const buildEngagement = (
  conversations: ConversationContext[],
): number | undefined => {
  const inactivityDays = daysSince(conversations[0]?.lastMessageAt);

  if (inactivityDays === undefined) {
    return undefined;
  }

  if (inactivityDays <= 7) return 5;
  if (inactivityDays <= 14) return 4;
  if (inactivityDays <= 30) return 3;
  if (inactivityDays <= 60) return 2;

  return 1;
};

export const reviewOpportunity = async (
  input: ReviewOpportunityInput,
): Promise<ReviewOpportunityResult> => {
  const opportunityId = input.opportunityId.trim();

  if (!opportunityId) {
    throw new Error('opportunityId é obrigatório.');
  }

  const client = new CoreApiClient();
  const context = await loadOpportunityContext(client, opportunityId);
  const activeSignals = context.signals.filter(
    ({ status }) =>
      status !== CommercialSignalStatus.ACTIONED &&
      status !== CommercialSignalStatus.DISMISSED,
  );
  const highRiskTypes = new Set([
    CommercialSignalType.RISK,
    CommercialSignalType.OBJECTION,
    CommercialSignalType.COMPETITOR,
    CommercialSignalType.CHURN_RISK,
  ]);
  const openHighRiskSignals = activeSignals.filter(
    (signal) =>
      signal.type !== null &&
      highRiskTypes.has(signal.type) &&
      (ratingToNumber(signal.strength) ?? 0) >= 4,
  ).length;
  const inactivityDays = daysSince(context.conversations[0]?.lastMessageAt);
  const score = calculateCommercialScore({
    icpFit: ratingToNumber(context.opportunity.company?.icpFit),
    buyingIntent: ratingToNumber(
      context.opportunity.pointOfContact?.buyingIntent,
    ),
    engagement: buildEngagement(context.conversations),
    decisionAccess: context.opportunity.decisionAccessConfirmed ?? undefined,
    budgetConfirmed: context.opportunity.budgetConfirmed ?? undefined,
    needConfirmed: context.opportunity.needConfirmed ?? undefined,
    timingConfirmed: context.opportunity.timingConfirmed ?? undefined,
    nextActionScheduled: Boolean(
      context.opportunity.nextCommercialAction?.trim() &&
      context.opportunity.nextCommercialActionAt,
    ),
    inactivityDays,
    openHighRiskSignals,
  });
  const agentResult = await runAgent({
    agentUniversalIdentifier: DEAL_REVIEW_AGENT_UNIVERSAL_IDENTIFIER,
    prompt: [
      'Analise este pacote fechado do workspace atual. Não execute ações.',
      JSON.stringify({
        opportunity: context.opportunity,
        calculatedScore: score,
        signals: activeSignals.slice(0, 30),
        conversations: context.conversations.slice(0, 20),
        derived: { inactivityDays, openHighRiskSignals },
      }),
    ].join('\n\n'),
  });
  const record = readAgentRecord(agentResult);
  const risk = getRisk(readRequiredString(record, 'risk'));
  const confidence = readNumber(record, 'confidence', 0, 100);
  const facts = readRequiredString(record, 'facts');
  const gaps = readRequiredString(record, 'gaps');
  const reasoning = readRequiredString(record, 'reasoning');
  const nextAction = readRequiredString(record, 'next_action');
  let opportunityUpdated = false;
  let aiActionId: string | undefined;

  if (input.updateOpportunity === true) {
    const mutationResult = (await client.mutation({
      updateOpportunity: {
        __args: {
          id: opportunityId,
          data: {
            commercialScore: score.score,
            dealRisk: risk,
            nextCommercialAction: nextAction.slice(0, 500),
          },
        },
        id: true,
      },
    } as never)) as unknown as {
      updateOpportunity?: { id?: string | null } | null;
    };

    opportunityUpdated = mutationResult.updateOpportunity?.id === opportunityId;
  }

  const actionType = getActionType(readRequiredString(record, 'action_type'));

  if (
    input.proposeAction === true &&
    readBoolean(record, 'should_propose_action') &&
    actionType
  ) {
    const evidenceKey =
      context.signals[0]?.capturedAt ??
      context.conversations[0]?.lastMessageAt ??
      context.opportunity.updatedAt ??
      'no-evidence-date';
    const proposal = await proposeAiAction({
      name: readRequiredString(record, 'action_title'),
      type: actionType,
      confidence,
      rationale: readRequiredString(record, 'action_rationale'),
      proposedAction: readRequiredString(record, 'action_proposal'),
      opportunityId,
      idempotencyKey: `deal-review:${opportunityId}:${evidenceKey}`,
    });

    aiActionId = proposal.aiActionId;
  }

  return {
    opportunityId,
    score,
    risk,
    confidence,
    facts,
    gaps,
    reasoning,
    nextAction,
    opportunityUpdated,
    aiActionId,
    message:
      'Revisão concluída sem alteração de etapa, envio ou execução automática.',
  };
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    opportunityId: {
      type: 'string' as const,
      description: 'ID da oportunidade do workspace atual.',
    },
    updateOpportunity: {
      type: 'boolean' as const,
      description:
        'Atualiza somente score, risco e próxima ação; nunca move a etapa.',
    },
    proposeAction: {
      type: 'boolean' as const,
      description: 'Cria uma proposta idempotente aguardando aprovação humana.',
    },
  },
  required: ['opportunityId'],
};

export default defineLogicFunction({
  universalIdentifier: 'd1e0b000-0000-4000-8000-000000000006',
  name: 'review-diex-opportunity',
  description:
    'Revisa uma oportunidade com score explicável, conversas e sinais reais sem tratar forecast como compromisso.',
  timeoutSeconds: 60,
  handler: reviewOpportunity,
  toolTriggerSettings: { inputSchema },
  workflowActionTriggerSettings: {
    label: 'Revisar oportunidade com IA Diex',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          opportunityId: { type: 'string' },
          score: { type: 'object' },
          risk: { type: 'string' },
          confidence: { type: 'number' },
          facts: { type: 'string' },
          gaps: { type: 'string' },
          reasoning: { type: 'string' },
          nextAction: { type: 'string' },
          opportunityUpdated: { type: 'boolean' },
          aiActionId: { type: 'string' },
          message: { type: 'string' },
        },
      },
    ],
  },
});
