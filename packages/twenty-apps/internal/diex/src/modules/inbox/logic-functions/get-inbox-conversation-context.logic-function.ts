import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema } from 'twenty-sdk/logic-function';

import { INBOX_CONVERSATION_CONTEXT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-ai.constants';
import { normalizePhone } from 'src/modules/inbox/utils/evolution-payload';

const DEFAULT_MESSAGE_LIMIT = 60;
const MAX_MESSAGE_LIMIT = 200;
const MAX_BODY_LENGTH = 4_000;
const CANDIDATE_LIMIT = 10;

type PersonName = {
  firstName?: string | null;
  lastName?: string | null;
} | null;

type ConversationNode = {
  id: string;
  name?: string | null;
  channel?: string | null;
  provider?: string | null;
  status?: string | null;
  priority?: string | null;
  contactHandle?: string | null;
  unreadCount?: number | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  firstResponseDueAt?: string | null;
  firstRespondedAt?: string | null;
  followUpDueAt?: string | null;
  slaBreachedAt?: string | null;
  person?: {
    id: string;
    name?: PersonName;
    buyingRole?: string | null;
    buyingIntent?: string | null;
    whatsappConsentStatus?: string | null;
    doNotContact?: boolean | null;
  } | null;
  company?: { id: string; name?: string | null; icpFit?: string | null } | null;
  opportunity?: {
    id: string;
    name?: string | null;
    stage?: string | null;
    amount?: { amountMicros?: number | null } | null;
    closeDate?: string | null;
  } | null;
  assignee?: { id: string; name?: PersonName } | null;
  inboxTeam?: { id: string; name?: string | null } | null;
  labelAssignments?: {
    edges?: Array<{
      node?: {
        isActive?: boolean | null;
        inboxLabel?: { name?: string | null } | null;
      } | null;
    }>;
  } | null;
  tasks?: {
    edges?: Array<{
      node?: {
        id: string;
        title?: string | null;
        status?: string | null;
        dueAt?: string | null;
      } | null;
    }>;
  } | null;
};

type MessageNode = {
  id: string;
  direction?: string | null;
  messageType?: string | null;
  body?: string | null;
  transcription?: string | null;
  transcriptionStatus?: string | null;
  sentAt?: string | null;
  senderDisplayName?: string | null;
  senderHandle?: string | null;
  deliveryStatus?: string | null;
  isInternalNote?: boolean | null;
};

type EventNode = {
  id: string;
  eventType?: string | null;
  summary?: string | null;
  details?: string | null;
  occurredAt?: string | null;
};

type SignalNode = {
  id: string;
  signalType?: string | null;
  status?: string | null;
  strength?: string | null;
  confidence?: number | null;
  capturedAt?: string | null;
  evidence?: { markdown?: string | null } | null;
  recommendedAction?: { markdown?: string | null } | null;
};

type ConversationCandidate = {
  id: string;
  name: string | null;
  contactHandle: string | null;
  status: string | null;
  lastMessageAt: string | null;
  personName: string | null;
  companyName: string | null;
};

export type InboxConversationContextResult = {
  found: boolean;
  candidates: ConversationCandidate[];
  conversation: {
    id: string;
    name: string | null;
    channel: string | null;
    provider: string | null;
    status: string | null;
    priority: string | null;
    contactHandle: string | null;
    unreadCount: number;
    lastMessageAt: string | null;
    firstResponseDueAt: string | null;
    firstRespondedAt: string | null;
    followUpDueAt: string | null;
    slaBreachedAt: string | null;
    labels: string[];
    assignee: string | null;
    team: string | null;
  } | null;
  crm: {
    personId: string | null;
    personName: string | null;
    buyingRole: string | null;
    buyingIntent: string | null;
    whatsappConsentStatus: string | null;
    doNotContact: boolean;
    companyId: string | null;
    companyName: string | null;
    icpFit: string | null;
    opportunityId: string | null;
    opportunityName: string | null;
    opportunityStage: string | null;
    opportunityAmount: number | null;
    opportunityCloseDate: string | null;
  } | null;
  transcript: Array<{
    id: string;
    at: string | null;
    direction: string | null;
    author: string | null;
    type: string | null;
    deliveryStatus: string | null;
    isInternalNote: boolean;
    body: string | null;
    transcription: string | null;
  }>;
  transcriptTruncated: boolean;
  activity: Array<{
    id: string;
    at: string | null;
    eventType: string | null;
    summary: string | null;
    details: string | null;
  }>;
  openTasks: Array<{
    id: string;
    title: string | null;
    status: string | null;
    dueAt: string | null;
  }>;
  commercialSignals: Array<{
    id: string;
    signalType: string | null;
    status: string | null;
    strength: string | null;
    confidence: number | null;
    capturedAt: string | null;
    evidence: string | null;
    recommendedAction: string | null;
  }>;
  guidance: string;
};

type ContextInput = {
  conversationId?: string;
  contactSearch?: string;
  messageLimit?: number;
};

const getEdges = <TNode>(
  connection:
    | { edges?: Array<{ node?: TNode | null } | null> | null }
    | null
    | undefined,
): TNode[] =>
  connection?.edges
    ?.map((edge) => edge?.node)
    .filter((node): node is TNode => node !== null && node !== undefined) ?? [];

const readPersonName = (name?: PersonName): string | null => {
  const full = [name?.firstName, name?.lastName]
    .filter(
      (part): part is string => typeof part === 'string' && part.length > 0,
    )
    .join(' ')
    .trim();

  return full.length > 0 ? full : null;
};

const conversationSelection = {
  id: true,
  name: true,
  channel: true,
  provider: true,
  status: true,
  priority: true,
  contactHandle: true,
  unreadCount: true,
  lastMessageAt: true,
  lastMessagePreview: true,
  firstResponseDueAt: true,
  firstRespondedAt: true,
  followUpDueAt: true,
  slaBreachedAt: true,
  person: {
    id: true,
    name: { firstName: true, lastName: true },
    buyingRole: true,
    buyingIntent: true,
    whatsappConsentStatus: true,
    doNotContact: true,
  },
  company: { id: true, name: true, icpFit: true },
  opportunity: {
    id: true,
    name: true,
    stage: true,
    amount: { amountMicros: true },
    closeDate: true,
  },
  assignee: { id: true, name: { firstName: true, lastName: true } },
  inboxTeam: { id: true, name: true },
  labelAssignments: {
    edges: { node: { isActive: true, inboxLabel: { name: true } } },
  },
  tasks: {
    edges: { node: { id: true, title: true, status: true, dueAt: true } },
  },
};

const findConversationById = async (
  client: CoreApiClient,
  conversationId: string,
): Promise<ConversationNode | null> => {
  const result = (await client.query({
    inboxConversation: {
      __args: { filter: { id: { eq: conversationId } } },
      ...conversationSelection,
    },
  } as never)) as unknown as { inboxConversation?: ConversationNode | null };

  return result.inboxConversation ?? null;
};

// A phone number reaches the CRM in several shapes, and an operator asking the
// agent about "o cliente do 32 99145911" types yet another one. Matching on the
// digits that survive every shape is what makes the lookup usable in practice.
const searchConversations = async (
  client: CoreApiClient,
  contactSearch: string,
): Promise<ConversationNode[]> => {
  const digits = normalizePhone(contactSearch);
  const filter = digits
    ? { contactHandle: { ilike: `%${digits.slice(-8)}%` } }
    : { name: { ilike: `%${contactSearch.trim()}%` } };
  const result = (await client.query({
    inboxConversations: {
      __args: {
        filter,
        first: CANDIDATE_LIMIT,
        orderBy: [{ lastMessageAt: 'DescNullsLast' }],
      },
      edges: { node: conversationSelection },
    },
  } as never)) as unknown as {
    inboxConversations?: { edges?: Array<{ node: ConversationNode }> };
  };

  return getEdges(result.inboxConversations);
};

const loadConversationDetails = async (
  client: CoreApiClient,
  conversation: ConversationNode,
  messageLimit: number,
): Promise<{
  messages: MessageNode[];
  events: EventNode[];
  signals: SignalNode[];
}> => {
  const [messageResult, eventResult, signalResult] = await Promise.all([
    client.query({
      inboxMessages: {
        __args: {
          filter: { inboxConversationId: { eq: conversation.id } },
          first: messageLimit,
          orderBy: [{ sentAt: 'DescNullsLast' }],
        },
        edges: {
          node: {
            id: true,
            direction: true,
            messageType: true,
            body: true,
            transcription: true,
            transcriptionStatus: true,
            sentAt: true,
            senderDisplayName: true,
            senderHandle: true,
            deliveryStatus: true,
            isInternalNote: true,
          },
        },
      },
    } as never) as Promise<unknown>,
    client.query({
      inboxConversationEvents: {
        __args: {
          filter: { inboxConversationId: { eq: conversation.id } },
          first: 40,
          orderBy: [{ occurredAt: 'DescNullsLast' }],
        },
        edges: {
          node: {
            id: true,
            eventType: true,
            summary: true,
            details: true,
            occurredAt: true,
          },
        },
      },
    } as never) as Promise<unknown>,
    conversation.person?.id
      ? (client.query({
          commercialSignals: {
            __args: {
              filter: { personId: { eq: conversation.person.id } },
              first: 10,
              orderBy: [{ capturedAt: 'DescNullsLast' }],
            },
            edges: {
              node: {
                id: true,
                signalType: true,
                status: true,
                strength: true,
                confidence: true,
                capturedAt: true,
                evidence: true,
                recommendedAction: true,
              },
            },
          },
        } as never) as Promise<unknown>)
      : Promise.resolve(null),
  ]);

  return {
    messages: getEdges(
      (
        messageResult as {
          inboxMessages?: { edges?: Array<{ node: MessageNode }> };
        }
      ).inboxMessages,
    ),
    events: getEdges(
      (
        eventResult as {
          inboxConversationEvents?: { edges?: Array<{ node: EventNode }> };
        }
      ).inboxConversationEvents,
    ),
    signals: getEdges(
      (
        signalResult as {
          commercialSignals?: { edges?: Array<{ node: SignalNode }> };
        } | null
      )?.commercialSignals,
    ),
  };
};

const toCandidate = (
  conversation: ConversationNode,
): ConversationCandidate => ({
  id: conversation.id,
  name: conversation.name ?? null,
  contactHandle: conversation.contactHandle ?? null,
  status: conversation.status ?? null,
  lastMessageAt: conversation.lastMessageAt ?? null,
  personName: readPersonName(conversation.person?.name),
  companyName: conversation.company?.name ?? null,
});

const emptyResult = (
  candidates: ConversationCandidate[],
  guidance: string,
): InboxConversationContextResult => ({
  found: false,
  candidates,
  conversation: null,
  crm: null,
  transcript: [],
  transcriptTruncated: false,
  activity: [],
  openTasks: [],
  commercialSignals: [],
  guidance,
});

// The whole point of this tool is that an agent should never have to guess what
// was said. It returns the conversation, who it belongs to in the CRM and the
// transcript in one call, so anything the agent writes afterwards — a note, a
// task, a signal, a draft reply — is grounded in what the customer actually
// wrote.
export const getInboxConversationContext = async (
  input: ContextInput,
): Promise<InboxConversationContextResult> => {
  const client = new CoreApiClient();
  const conversationId = input.conversationId?.trim() ?? '';
  const contactSearch = input.contactSearch?.trim() ?? '';

  if (!conversationId && !contactSearch) {
    throw new Error('Informe conversationId ou contactSearch.');
  }

  const messageLimit = Math.min(
    MAX_MESSAGE_LIMIT,
    Math.max(1, Math.round(input.messageLimit ?? DEFAULT_MESSAGE_LIMIT)),
  );

  let conversation: ConversationNode | null = null;
  let candidates: ConversationCandidate[] = [];

  if (conversationId) {
    conversation = await findConversationById(client, conversationId);

    if (!conversation) {
      return emptyResult(
        [],
        'Nenhuma conversa com esse id. Confirme o id ou busque pelo contato.',
      );
    }
  } else {
    const matches = await searchConversations(client, contactSearch);

    candidates = matches.map(toCandidate);

    if (matches.length === 0) {
      return emptyResult(
        [],
        'Nenhuma conversa encontrada para esse contato. Não invente histórico: trate como contato sem conversa registrada.',
      );
    }

    if (matches.length > 1) {
      return emptyResult(
        candidates,
        'Mais de uma conversa corresponde ao contato. Peça ao usuário qual delas antes de continuar.',
      );
    }

    conversation = matches[0];
  }

  const { messages, events, signals } = await loadConversationDetails(
    client,
    conversation,
    messageLimit,
  );
  const labels = getEdges(conversation.labelAssignments)
    .filter((assignment) => assignment.isActive !== false)
    .map((assignment) => assignment.inboxLabel?.name)
    .filter((name): name is string => typeof name === 'string');

  return {
    found: true,
    candidates,
    conversation: {
      id: conversation.id,
      name: conversation.name ?? null,
      channel: conversation.channel ?? null,
      provider: conversation.provider ?? null,
      status: conversation.status ?? null,
      priority: conversation.priority ?? null,
      contactHandle: conversation.contactHandle ?? null,
      unreadCount: conversation.unreadCount ?? 0,
      lastMessageAt: conversation.lastMessageAt ?? null,
      firstResponseDueAt: conversation.firstResponseDueAt ?? null,
      firstRespondedAt: conversation.firstRespondedAt ?? null,
      followUpDueAt: conversation.followUpDueAt ?? null,
      slaBreachedAt: conversation.slaBreachedAt ?? null,
      labels,
      assignee: readPersonName(conversation.assignee?.name),
      team: conversation.inboxTeam?.name ?? null,
    },
    crm: {
      personId: conversation.person?.id ?? null,
      personName: readPersonName(conversation.person?.name),
      buyingRole: conversation.person?.buyingRole ?? null,
      buyingIntent: conversation.person?.buyingIntent ?? null,
      whatsappConsentStatus: conversation.person?.whatsappConsentStatus ?? null,
      doNotContact: conversation.person?.doNotContact === true,
      companyId: conversation.company?.id ?? null,
      companyName: conversation.company?.name ?? null,
      icpFit: conversation.company?.icpFit ?? null,
      opportunityId: conversation.opportunity?.id ?? null,
      opportunityName: conversation.opportunity?.name ?? null,
      opportunityStage: conversation.opportunity?.stage ?? null,
      opportunityAmount:
        typeof conversation.opportunity?.amount?.amountMicros === 'number'
          ? conversation.opportunity.amount.amountMicros / 1_000_000
          : null,
      opportunityCloseDate: conversation.opportunity?.closeDate ?? null,
    },
    transcript: messages
      .slice()
      .reverse()
      .map((message) => ({
        id: message.id,
        at: message.sentAt ?? null,
        direction: message.direction ?? null,
        author: message.senderDisplayName ?? message.senderHandle ?? null,
        type: message.messageType ?? null,
        deliveryStatus: message.deliveryStatus ?? null,
        isInternalNote: message.isInternalNote === true,
        body: message.body?.slice(0, MAX_BODY_LENGTH) ?? null,
        // What the customer said in a voice note, so the agent reads the
        // conversation whole instead of seeing a gap labelled "Áudio".
        transcription: message.transcription?.slice(0, MAX_BODY_LENGTH) ?? null,
      })),
    transcriptTruncated: messages.length === messageLimit,
    activity: events.map((event) => ({
      id: event.id,
      at: event.occurredAt ?? null,
      eventType: event.eventType ?? null,
      summary: event.summary ?? null,
      details: event.details ?? null,
    })),
    openTasks: getEdges(conversation.tasks)
      .filter((task) => task.status !== 'DONE')
      .map((task) => ({
        id: task.id,
        title: task.title ?? null,
        status: task.status ?? null,
        dueAt: task.dueAt ?? null,
      })),
    commercialSignals: signals.map((signal) => ({
      id: signal.id,
      signalType: signal.signalType ?? null,
      status: signal.status ?? null,
      strength: signal.strength ?? null,
      confidence: signal.confidence ?? null,
      capturedAt: signal.capturedAt ?? null,
      evidence: signal.evidence?.markdown ?? null,
      recommendedAction: signal.recommendedAction?.markdown ?? null,
    })),
    guidance: [
      'Use apenas o que está na transcrição como fato do cliente; o resto é inferência e deve ser rotulado como tal.',
      'Para registrar algo, crie nota, tarefa ou sinal ligado ao personId, companyId ou opportunityId retornados aqui.',
      'Mensagens com isInternalNote=true são notas da equipe e o cliente nunca as viu.',
      'Em mensagens de áudio, transcription é o que o cliente falou; trate como fala dele, não como texto digitado.',
      'Nada nesta resposta autoriza enviar mensagem externa: o envio exige a ação explícita do operador na inbox.',
    ].join(' '),
  };
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    conversationId: {
      type: 'string' as const,
      description: 'Id da conversa da inbox. Use quando já souber qual é.',
    },
    contactSearch: {
      type: 'string' as const,
      description:
        'Telefone, nome do contato ou nome da conversa, quando o id não for conhecido.',
    },
    messageLimit: {
      type: 'number' as const,
      description: `Mensagens mais recentes a retornar. Padrão ${DEFAULT_MESSAGE_LIMIT}, máximo ${MAX_MESSAGE_LIMIT}.`,
    },
  },
};

export default defineLogicFunction({
  universalIdentifier:
    INBOX_CONVERSATION_CONTEXT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'get-diex-inbox-conversation-context',
  description:
    'Carrega uma conversa da inbox comercial por completo: transcrição das mensagens, notas internas, linha do tempo, contato, empresa, oportunidade, tarefas abertas e sinais comerciais. Chame antes de responder, resumir ou registrar qualquer coisa sobre um atendimento de WhatsApp ou e-mail.',
  timeoutSeconds: 30,
  handler: getInboxConversationContext,
  toolTriggerSettings: { inputSchema },
  workflowActionTriggerSettings: {
    label: 'Carregar contexto da conversa da Inbox',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          found: { type: 'boolean' },
          candidates: { type: 'array', items: { type: 'object' } },
          conversation: { type: 'object' },
          crm: { type: 'object' },
          transcript: { type: 'array', items: { type: 'object' } },
          activity: { type: 'array', items: { type: 'object' } },
          openTasks: { type: 'array', items: { type: 'object' } },
          commercialSignals: { type: 'array', items: { type: 'object' } },
          guidance: { type: 'string' },
        },
      },
    ],
  },
});
