import { CoreApiClient } from 'twenty-client-sdk/core';
import { runAgent } from 'twenty-sdk/logic-function';

import { INBOX_TRIAGE_AGENT_UNIVERSAL_IDENTIFIER } from 'src/agents/inbox-triage.agent';
import { proposeAiAction } from 'src/logic-functions/propose-ai-action.logic-function';
import {
  CommercialSignalSource,
  CommercialSignalStatus,
  CommercialSignalType,
} from 'src/objects/commercial-signal.object';
import { AiActionType } from 'src/objects/ai-action.object';
import {
  readAgentRecord,
  readBoolean,
  readNumber,
  readRequiredString,
} from 'src/utils/agent-result';

export type TriageInboxConversationInput = {
  conversationId: string;
  registerSignal?: boolean;
  proposeReply?: boolean;
};

export type TriageInboxConversationResult = {
  conversationId: string;
  summary: string;
  intent: string;
  sentiment: string;
  urgency: number;
  signalType: CommercialSignalType | null;
  signalStrength: number;
  confidence: number;
  evidence: string;
  recommendedAction: string;
  suggestedReply: string;
  commercialSignalId?: string;
  aiActionId?: string;
  message: string;
};

type ConversationContext = {
  id: string;
  name: string | null;
  channel: string | null;
  provider: string | null;
  status: string | null;
  priority: string | null;
  contactHandle: string | null;
  lastMessageAt: string | null;
  person: {
    id: string;
    name: { firstName: string | null; lastName: string | null } | null;
    buyingRole: string | null;
    buyingIntent: string | null;
  } | null;
  company: {
    id: string;
    name: string | null;
    icpFit: string | null;
  } | null;
  opportunity: {
    id: string;
    name: string | null;
    stage: string | null;
    commercialScore: number | null;
    dealRisk: string | null;
    nextCommercialAction: string | null;
    nextCommercialActionAt: string | null;
  } | null;
};

type MessageContext = {
  id: string;
  direction: string | null;
  type: string | null;
  body: string | null;
  sentAt: string | null;
  senderDisplayName: string | null;
  isInternalNote: boolean | null;
};

const loadConversationContext = async (
  client: CoreApiClient,
  conversationId: string,
): Promise<{ conversation: ConversationContext; messages: MessageContext[] }> => {
  const [conversationResult, messageResult] = await Promise.all([
    client.query({
      inboxConversation: {
        __args: { filter: { id: { eq: conversationId } } },
        id: true,
        name: true,
        channel: true,
        provider: true,
        status: true,
        priority: true,
        contactHandle: true,
        lastMessageAt: true,
        person: {
          id: true,
          name: { firstName: true, lastName: true },
          buyingRole: true,
          buyingIntent: true,
        },
        company: {
          id: true,
          name: true,
          icpFit: true,
        },
        opportunity: {
          id: true,
          name: true,
          stage: true,
          commercialScore: true,
          dealRisk: true,
          nextCommercialAction: true,
          nextCommercialActionAt: true,
        },
      },
    } as never),
    client.query({
      inboxMessages: {
        __args: {
          filter: { inboxConversationId: { eq: conversationId } },
          first: 80,
          orderBy: [{ sentAt: 'DescNullsLast' }],
        },
        edges: {
          node: {
            id: true,
            direction: true,
            type: true,
            body: true,
            sentAt: true,
            senderDisplayName: true,
            isInternalNote: true,
          },
        },
      },
    } as never),
  ]);
  const conversation = (
    conversationResult as unknown as {
      inboxConversation?: ConversationContext | null;
    }
  ).inboxConversation;
  const messageEdges = (
    messageResult as unknown as {
      inboxMessages?: {
        edges?: Array<{ node: MessageContext }>;
      };
    }
  ).inboxMessages?.edges;

  if (!conversation?.id) {
    throw new Error('A conversa da inbox não foi encontrada.');
  }

  return {
    conversation,
    messages: (messageEdges?.map(({ node }) => node) ?? []).reverse(),
  };
};

const buildAgentPrompt = ({
  conversation,
  messages,
}: {
  conversation: ConversationContext;
  messages: MessageContext[];
}): string => {
  const safeMessages = messages.map((message) => ({
    id: message.id,
    direction: message.direction,
    type: message.type,
    sentAt: message.sentAt,
    senderDisplayName: message.senderDisplayName,
    isInternalNote: message.isInternalNote,
    body: message.body?.slice(0, 2_000) ?? null,
  }));

  return [
    'Analise o pacote fechado abaixo. Ele já está limitado ao workspace atual.',
    'Não execute nenhuma ação. Produza somente a saída estruturada solicitada.',
    JSON.stringify({
      conversation,
      messages: safeMessages,
    }),
  ].join('\n\n');
};

const asCommercialSignalType = (
  value: string,
): CommercialSignalType | null =>
  Object.values(CommercialSignalType).includes(
    value as CommercialSignalType,
  )
    ? (value as CommercialSignalType)
    : null;

const upsertCommercialSignal = async ({
  client,
  conversation,
  latestMessageId,
  signalType,
  signalStrength,
  confidence,
  evidence,
  recommendedAction,
}: {
  client: CoreApiClient;
  conversation: ConversationContext;
  latestMessageId: string;
  signalType: CommercialSignalType;
  signalStrength: number;
  confidence: number;
  evidence: string;
  recommendedAction: string;
}): Promise<string> => {
  const sourceReference = `inbox:${conversation.id}:${latestMessageId}:${signalType}`;
  const existingResult = (await client.query({
    commercialSignals: {
      __args: {
        filter: { sourceReference: { eq: sourceReference } },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  } as never)) as unknown as {
    commercialSignals?: {
      edges?: Array<{ node?: { id?: string | null } | null }>;
    };
  };
  const existingId =
    existingResult.commercialSignals?.edges?.[0]?.node?.id ?? undefined;
  const data = {
    name: `${signalType}: ${conversation.name || 'Conversa da inbox'}`.slice(
      0,
      250,
    ),
    type: signalType,
    source:
      conversation.channel === 'WHATSAPP'
        ? CommercialSignalSource.WHATSAPP
        : CommercialSignalSource.EMAIL,
    status: CommercialSignalStatus.NEW,
    strength: `RATING_${Math.round(signalStrength)}`,
    confidence: Math.round(confidence),
    evidence: { markdown: evidence, blocknote: null },
    recommendedAction: { markdown: recommendedAction, blocknote: null },
    capturedAt: new Date().toISOString(),
    sourceReference,
    personId: conversation.person?.id,
    companyId: conversation.company?.id,
    opportunityId: conversation.opportunity?.id,
  };

  if (existingId) {
    const { updateCommercialSignal } = await client.mutation({
      updateCommercialSignal: {
        __args: { id: existingId, data },
        id: true,
      },
    } as never);

    return (updateCommercialSignal as { id: string }).id;
  }

  const { createCommercialSignal } = await client.mutation({
    createCommercialSignal: {
      __args: { data },
      id: true,
    },
  } as never);
  const createdId = (createCommercialSignal as { id?: string } | undefined)?.id;

  if (!createdId) {
    throw new Error('O sinal comercial não pôde ser registrado.');
  }

  return createdId;
};

export const triageInboxConversation = async (
  input: TriageInboxConversationInput,
): Promise<TriageInboxConversationResult> => {
  const conversationId = input.conversationId.trim();

  if (!conversationId) {
    throw new Error('conversationId é obrigatório.');
  }

  const client = new CoreApiClient();
  const context = await loadConversationContext(client, conversationId);

  if (context.messages.length === 0) {
    throw new Error('A conversa ainda não possui mensagens para análise.');
  }

  const agentResult = await runAgent({
    agentUniversalIdentifier: INBOX_TRIAGE_AGENT_UNIVERSAL_IDENTIFIER,
    prompt: buildAgentPrompt(context),
  });
  const record = readAgentRecord(agentResult);
  const summary = readRequiredString(record, 'summary');
  const intent = readRequiredString(record, 'intent');
  const sentiment = readRequiredString(record, 'sentiment');
  const urgency = readNumber(record, 'urgency', 1, 5);
  const rawSignalType = readRequiredString(record, 'signal_type');
  const signalType = asCommercialSignalType(rawSignalType);
  const signalStrength = readNumber(record, 'signal_strength', 1, 5);
  const confidence = readNumber(record, 'confidence', 0, 100);
  const evidence = readRequiredString(record, 'evidence');
  const recommendedAction = readRequiredString(record, 'recommended_action');
  const suggestedReply = readRequiredString(record, 'suggested_reply');
  const latestMessageId = context.messages.at(-1)?.id;
  let commercialSignalId: string | undefined;
  let aiActionId: string | undefined;

  if (
    input.registerSignal === true &&
    readBoolean(record, 'should_register_signal') &&
    signalType &&
    latestMessageId
  ) {
    commercialSignalId = await upsertCommercialSignal({
      client,
      conversation: context.conversation,
      latestMessageId,
      signalType,
      signalStrength,
      confidence,
      evidence,
      recommendedAction,
    });
  }

  if (
    input.proposeReply === true &&
    readBoolean(record, 'should_propose_reply') &&
    suggestedReply
  ) {
    const proposal = await proposeAiAction({
      name: `Revisar resposta para ${context.conversation.name || 'contato'}`,
      type: AiActionType.REPLY,
      confidence,
      rationale: `${summary}\n\nEvidência: ${evidence}`,
      proposedAction: suggestedReply,
      opportunityId: context.conversation.opportunity?.id,
      commercialSignalId,
      inboxConversationId: context.conversation.id,
      idempotencyKey: `inbox-reply:${context.conversation.id}:${latestMessageId}`,
    });

    aiActionId = proposal.aiActionId;
  }

  return {
    conversationId,
    summary,
    intent,
    sentiment,
    urgency,
    signalType,
    signalStrength,
    confidence,
    evidence,
    recommendedAction,
    suggestedReply,
    commercialSignalId,
    aiActionId,
    message:
      'Análise concluída com dados da conversa. Nenhuma mensagem foi enviada.',
  };
};
