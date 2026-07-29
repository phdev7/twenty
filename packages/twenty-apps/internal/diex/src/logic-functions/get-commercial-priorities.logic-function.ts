import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema } from 'twenty-sdk/logic-function';

const SECTION_LIMIT = 10;

type PriorityInput = {
  assigneeId?: string;
  limit?: number;
};

type WaitingConversation = {
  id: string;
  name: string | null;
  contactHandle: string | null;
  waitingSinceMinutes: number | null;
  slaBreached: boolean;
  priority: string | null;
  assignee: string | null;
  lastMessagePreview: string | null;
};

type OverdueTask = {
  id: string;
  title: string | null;
  dueAt: string | null;
  overdueByHours: number | null;
  assignee: string | null;
};

type StalledOpportunity = {
  id: string;
  name: string | null;
  stage: string | null;
  amount: number | null;
  closeDate: string | null;
  dealRisk: string | null;
  nextCommercialAction: string | null;
  nextCommercialActionAt: string | null;
};

type RenewalAtRisk = {
  id: string;
  name: string | null;
  stage: string | null;
  risk: string | null;
  riskReason: string | null;
  targetDate: string | null;
  nextAction: string | null;
};

export type CommercialPrioritiesResult = {
  generatedAt: string;
  waitingOnUs: WaitingConversation[];
  followUpsDue: WaitingConversation[];
  overdueTasks: OverdueTask[];
  stalledOpportunities: StalledOpportunity[];
  renewalsAtRisk: RenewalAtRisk[];
  totals: {
    waitingOnUs: number;
    followUpsDue: number;
    overdueTasks: number;
    stalledOpportunities: number;
    renewalsAtRisk: number;
  };
  guidance: string;
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

const readPersonName = (
  name?: { firstName?: string | null; lastName?: string | null } | null,
): string | null =>
  [name?.firstName, name?.lastName].filter(Boolean).join(' ').trim() || null;

const minutesSince = (value?: string | null): number | null => {
  const parsed = value ? Date.parse(value) : NaN;

  return Number.isFinite(parsed)
    ? Math.max(0, Math.round((Date.now() - parsed) / 60_000))
    : null;
};

// One read that answers "where does this team lose money today". Everything here
// is a queue somebody has to work, ordered by how long it has been waiting —
// never a score, never a forecast.
export const getCommercialPriorities = async (
  input: PriorityInput,
): Promise<CommercialPrioritiesResult> => {
  const client = new CoreApiClient();
  const limit = Math.min(
    SECTION_LIMIT,
    Math.max(1, Math.round(input.limit ?? SECTION_LIMIT)),
  );
  const now = new Date().toISOString();
  const assigneeFilter = input.assigneeId?.trim()
    ? [{ assigneeId: { eq: input.assigneeId.trim() } }]
    : [];

  const conversationSelection = {
    id: true,
    name: true,
    contactHandle: true,
    priority: true,
    lastMessageAt: true,
    lastMessagePreview: true,
    slaBreachedAt: true,
    followUpDueAt: true,
    assignee: { name: { firstName: true, lastName: true } },
  };

  const [waitingResult, followUpResult, taskResult, opportunityResult, renewalResult] =
    await Promise.all([
      // The customer wrote last and nobody answered: the only queue where every
      // extra minute is visible to the person waiting.
      client.query({
        inboxConversations: {
          __args: {
            filter: {
              and: [
                { status: { in: ['OPEN', 'PENDING'] } },
                { lastMessageDirection: { eq: 'INBOUND' } },
                ...assigneeFilter,
              ],
            },
            first: limit,
            orderBy: [{ lastMessageAt: 'AscNullsLast' }],
          },
          edges: { node: conversationSelection },
        },
      } as never) as Promise<unknown>,
      client.query({
        inboxConversations: {
          __args: {
            filter: {
              and: [
                { status: { in: ['OPEN', 'PENDING'] } },
                { followUpDueAt: { lte: now } },
                ...assigneeFilter,
              ],
            },
            first: limit,
            orderBy: [{ followUpDueAt: 'AscNullsLast' }],
          },
          edges: { node: conversationSelection },
        },
      } as never) as Promise<unknown>,
      client.query({
        tasks: {
          __args: {
            filter: {
              and: [
                { status: { neq: 'DONE' } },
                { dueAt: { lte: now } },
                ...(input.assigneeId?.trim()
                  ? [{ assigneeId: { eq: input.assigneeId.trim() } }]
                  : []),
              ],
            },
            first: limit,
            orderBy: [{ dueAt: 'AscNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              title: true,
              dueAt: true,
              assignee: { name: { firstName: true, lastName: true } },
            },
          },
        },
      } as never) as Promise<unknown>,
      // A deal whose own next step is past due, or one already flagged risky.
      client.query({
        opportunities: {
          __args: {
            filter: {
              and: [
                { stage: { neq: 'WON' } },
                { stage: { neq: 'LOST' } },
                {
                  or: [
                    { nextCommercialActionAt: { lte: now } },
                    { dealRisk: { in: ['HIGH', 'CRITICAL'] } },
                  ],
                },
              ],
            },
            first: limit,
            orderBy: [{ nextCommercialActionAt: 'AscNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              name: true,
              stage: true,
              closeDate: true,
              dealRisk: true,
              nextCommercialAction: true,
              nextCommercialActionAt: true,
              amount: { amountMicros: true },
            },
          },
        },
      } as never) as Promise<unknown>,
      client.query({
        customerRenewals: {
          __args: {
            filter: {
              and: [
                { stage: { neq: 'RENEWED' } },
                { stage: { neq: 'CHURNED' } },
                { risk: { in: ['HIGH', 'CRITICAL'] } },
              ],
            },
            first: limit,
            orderBy: [{ targetDate: 'AscNullsLast' }],
          },
          edges: {
            node: {
              id: true,
              name: true,
              stage: true,
              risk: true,
              riskReason: true,
              targetDate: true,
              nextAction: true,
            },
          },
        },
      } as never) as Promise<unknown>,
    ]);

  const readConversations = (result: unknown): WaitingConversation[] =>
    getEdges(
      (
        result as {
          inboxConversations?: {
            edges?: Array<{
              node: {
                id: string;
                name?: string | null;
                contactHandle?: string | null;
                priority?: string | null;
                lastMessageAt?: string | null;
                lastMessagePreview?: string | null;
                slaBreachedAt?: string | null;
                assignee?: {
                  name?: { firstName?: string | null; lastName?: string | null };
                } | null;
              };
            }>;
          };
        }
      ).inboxConversations,
    ).map((conversation) => ({
      id: conversation.id,
      name: conversation.name ?? null,
      contactHandle: conversation.contactHandle ?? null,
      waitingSinceMinutes: minutesSince(conversation.lastMessageAt),
      slaBreached: Boolean(conversation.slaBreachedAt),
      priority: conversation.priority ?? null,
      assignee: readPersonName(conversation.assignee?.name),
      lastMessagePreview: conversation.lastMessagePreview ?? null,
    }));

  const waitingOnUs = readConversations(waitingResult);
  const followUpsDue = readConversations(followUpResult);
  const overdueTasks = getEdges(
    (
      taskResult as {
        tasks?: {
          edges?: Array<{
            node: {
              id: string;
              title?: string | null;
              dueAt?: string | null;
              assignee?: {
                name?: { firstName?: string | null; lastName?: string | null };
              } | null;
            };
          }>;
        };
      }
    ).tasks,
  ).map((task) => ({
    id: task.id,
    title: task.title ?? null,
    dueAt: task.dueAt ?? null,
    overdueByHours:
      minutesSince(task.dueAt) === null
        ? null
        : Math.round((minutesSince(task.dueAt) as number) / 60),
    assignee: readPersonName(task.assignee?.name),
  }));
  const stalledOpportunities = getEdges(
    (
      opportunityResult as {
        opportunities?: {
          edges?: Array<{
            node: {
              id: string;
              name?: string | null;
              stage?: string | null;
              closeDate?: string | null;
              dealRisk?: string | null;
              nextCommercialAction?: string | null;
              nextCommercialActionAt?: string | null;
              amount?: { amountMicros?: number | null } | null;
            };
          }>;
        };
      }
    ).opportunities,
  ).map((opportunity) => ({
    id: opportunity.id,
    name: opportunity.name ?? null,
    stage: opportunity.stage ?? null,
    amount:
      typeof opportunity.amount?.amountMicros === 'number'
        ? opportunity.amount.amountMicros / 1_000_000
        : null,
    closeDate: opportunity.closeDate ?? null,
    dealRisk: opportunity.dealRisk ?? null,
    nextCommercialAction: opportunity.nextCommercialAction ?? null,
    nextCommercialActionAt: opportunity.nextCommercialActionAt ?? null,
  }));
  const renewalsAtRisk = getEdges(
    (
      renewalResult as {
        customerRenewals?: {
          edges?: Array<{
            node: {
              id: string;
              name?: string | null;
              stage?: string | null;
              risk?: string | null;
              riskReason?: string | null;
              targetDate?: string | null;
              nextAction?: string | null;
            };
          }>;
        };
      }
    ).customerRenewals,
  ).map((renewal) => ({
    id: renewal.id,
    name: renewal.name ?? null,
    stage: renewal.stage ?? null,
    risk: renewal.risk ?? null,
    riskReason: renewal.riskReason ?? null,
    targetDate: renewal.targetDate ?? null,
    nextAction: renewal.nextAction ?? null,
  }));

  return {
    generatedAt: now,
    waitingOnUs,
    followUpsDue,
    overdueTasks,
    stalledOpportunities,
    renewalsAtRisk,
    totals: {
      waitingOnUs: waitingOnUs.length,
      followUpsDue: followUpsDue.length,
      overdueTasks: overdueTasks.length,
      stalledOpportunities: stalledOpportunities.length,
      renewalsAtRisk: renewalsAtRisk.length,
    },
    guidance: [
      'Comece por waitingOnUs: alguém escreveu e está esperando, e waitingSinceMinutes é o tamanho da espera.',
      'Antes de propor resposta a uma conversa, carregue a transcrição com get-diex-inbox-conversation-context; sem ela você não sabe o que já foi dito.',
      'Cada seção traz o id do registro: use-o para atualizar o que existe em vez de criar duplicado.',
      'Uma lista vazia significa que a fila está limpa, não que falta dado.',
      'Nada aqui envia mensagem: envio ao cliente exige ação explícita do operador na inbox.',
    ].join(' '),
  };
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    assigneeId: {
      type: 'string' as const,
      description:
        'Id do membro do workspace para restringir as filas ao responsável. Omita para ver a operação inteira.',
    },
    limit: {
      type: 'number' as const,
      description: `Itens por seção. Padrão e máximo ${SECTION_LIMIT}.`,
    },
  },
};

export default defineLogicFunction({
  universalIdentifier: 'd1e0b000-0000-4000-8000-000000000012',
  name: 'get-diex-commercial-priorities',
  description:
    'Lista o que exige ação comercial agora: conversas esperando resposta, follow-ups vencidos, tarefas atrasadas, oportunidades com próximo passo vencido ou risco alto e renovações em risco. Chame no início de um turno de trabalho ou quando perguntarem o que fazer primeiro.',
  timeoutSeconds: 30,
  handler: getCommercialPriorities,
  toolTriggerSettings: { inputSchema },
  workflowActionTriggerSettings: {
    label: 'Carregar prioridades comerciais',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          generatedAt: { type: 'string' },
          waitingOnUs: { type: 'array', items: { type: 'object' } },
          followUpsDue: { type: 'array', items: { type: 'object' } },
          overdueTasks: { type: 'array', items: { type: 'object' } },
          stalledOpportunities: { type: 'array', items: { type: 'object' } },
          renewalsAtRisk: { type: 'array', items: { type: 'object' } },
          totals: { type: 'object' },
          guidance: { type: 'string' },
        },
      },
    ],
  },
});
