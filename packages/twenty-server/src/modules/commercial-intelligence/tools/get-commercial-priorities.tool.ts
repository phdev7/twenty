import { z } from 'zod';

import { In, LessThanOrEqual, Not } from 'typeorm';

import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type CustomerRenewalWorkspaceEntity } from 'src/modules/renewal/standard-objects/customer-renewal.workspace-entity';
import {
  type CommercialIntelligenceToolContext,
  type CommercialIntelligenceToolDependencies,
} from 'src/modules/commercial-intelligence/tools/types/commercial-intelligence-tool-dependencies.type';

const SECTION_LIMIT = 10;

// This workspace's pipeline, not Twenty's defaults: CUSTOMER is the won stage
// and LOST closes the other way, so "still open" is everything before them.
const OPEN_OPPORTUNITY_STAGES = [
  'NEW',
  'SCREENING',
  'MEETING',
  'DIAGNOSIS_COMPLETE',
  'PROPOSAL',
  'NEGOTIATION',
];

const getCommercialPrioritiesSchema = z.object({
  assigneeId: z
    .string()
    .optional()
    .describe(
      'Id do membro do workspace para restringir as filas ao responsável. Omita para ver a operação inteira.',
    ),
  limit: z
    .number()
    .optional()
    .describe(`Itens por seção. Padrão e máximo ${SECTION_LIMIT}.`),
});

type CommercialPrioritiesInput = z.infer<typeof getCommercialPrioritiesSchema>;

const readPersonName = (
  name?: { firstName?: string | null; lastName?: string | null } | null,
): string | null =>
  [name?.firstName, name?.lastName].filter(Boolean).join(' ').trim() || null;

const minutesSince = (value?: string | Date | null): number | null => {
  const parsed = value ? Date.parse(String(value)) : NaN;

  return Number.isFinite(parsed)
    ? Math.max(0, Math.round((Date.now() - parsed) / 60_000))
    : null;
};

export const createGetCommercialPrioritiesTool = (
  deps: Pick<
    CommercialIntelligenceToolDependencies,
    'globalWorkspaceOrmManager'
  >,
  context: CommercialIntelligenceToolContext,
) => ({
  name: 'get_diex_commercial_priorities' as const,
  description:
    'Lista o que exige ação comercial agora: conversas esperando resposta, follow-ups vencidos, tarefas atrasadas, oportunidades com próximo passo vencido ou risco alto e renovações em risco. Chame no início de um turno de trabalho ou quando perguntarem o que fazer primeiro.',
  inputSchema: getCommercialPrioritiesSchema,
  execute: async (parameters: CommercialPrioritiesInput) => {
    const authContext = buildSystemAuthContext(context.workspaceId);
    const limit = Math.min(
      SECTION_LIMIT,
      Math.max(1, Math.round(parameters.limit ?? SECTION_LIMIT)),
    );
    const now = new Date();
    const assigneeId = parameters.assigneeId?.trim() || undefined;

    const {
      waitingOnUsRecords,
      followUpDueRecords,
      overdueTaskRecords,
      stalledOpportunityRecords,
      renewalAtRiskRecords,
    } = await deps.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const inboxConversationRepository =
          await deps.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
            context.workspaceId,
            'inboxConversation',
            { shouldBypassPermissionChecks: true },
          );
        const taskRepository =
          await deps.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
            context.workspaceId,
            'task',
            { shouldBypassPermissionChecks: true },
          );
        const opportunityRepository =
          await deps.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
            context.workspaceId,
            'opportunity',
            { shouldBypassPermissionChecks: true },
          );
        const customerRenewalRepository =
          await deps.globalWorkspaceOrmManager.getRepository<CustomerRenewalWorkspaceEntity>(
            context.workspaceId,
            'customerRenewal',
            { shouldBypassPermissionChecks: true },
          );

        const [
          waitingOnUs,
          followUpDue,
          overdueTasks,
          stalledOpportunities,
          renewalsAtRisk,
        ] = await Promise.all([
          // The customer wrote last and nobody answered: the only queue where
          // every extra minute is visible to the person waiting.
          inboxConversationRepository.find({
            where: {
              status: In(['OPEN', 'PENDING']),
              lastMessageDirection: 'INBOUND',
              ...(assigneeId ? { assigneeId } : {}),
            },
            relations: { assignee: true },
            order: { lastMessageAt: 'ASC' },
            take: limit,
          }),
          inboxConversationRepository.find({
            where: {
              status: In(['OPEN', 'PENDING']),
              followUpDueAt: LessThanOrEqual(now.toISOString()),
              ...(assigneeId ? { assigneeId } : {}),
            },
            relations: { assignee: true },
            order: { followUpDueAt: 'ASC' },
            take: limit,
          }),
          taskRepository.find({
            where: {
              status: Not('DONE'),
              dueAt: LessThanOrEqual(now),
              ...(assigneeId ? { assigneeId } : {}),
            },
            relations: { assignee: true },
            order: { dueAt: 'ASC' },
            take: limit,
          }),
          // A deal whose own next step is past due, or one already flagged risky.
          opportunityRepository.find({
            where: [
              {
                stage: In(OPEN_OPPORTUNITY_STAGES),
                nextCommercialActionAt: LessThanOrEqual(now),
              },
              {
                stage: In(OPEN_OPPORTUNITY_STAGES),
                dealRisk: 'HIGH',
              },
            ],
            order: { nextCommercialActionAt: 'ASC' },
            take: limit,
          }),
          customerRenewalRepository.find({
            where: {
              stage: Not(In(['RENEWED', 'CHURNED'])),
              risk: In(['HIGH', 'CRITICAL']),
            },
            order: { targetDate: 'ASC' },
            take: limit,
          }),
        ]);

        return {
          waitingOnUsRecords: waitingOnUs,
          followUpDueRecords: followUpDue,
          overdueTaskRecords: overdueTasks,
          stalledOpportunityRecords: stalledOpportunities,
          renewalAtRiskRecords: renewalsAtRisk,
        };
      },
      authContext,
    );

    const mapConversation = (
      conversation: InboxConversationWorkspaceEntity,
    ) => ({
      id: conversation.id,
      name: conversation.name ?? null,
      contactHandle: conversation.contactHandle ?? null,
      waitingSinceMinutes: minutesSince(conversation.lastMessageAt),
      slaBreached: Boolean(conversation.slaBreachedAt),
      priority: conversation.priority ?? null,
      assignee: readPersonName(conversation.assignee?.name),
      lastMessagePreview: conversation.lastMessagePreview ?? null,
    });

    const waitingOnUs = waitingOnUsRecords.map(mapConversation);
    const followUpsDue = followUpDueRecords.map(mapConversation);
    const overdueTasks = overdueTaskRecords.map((task) => {
      const overdueMinutes = minutesSince(task.dueAt);

      return {
        id: task.id,
        title: task.title ?? null,
        dueAt: task.dueAt ?? null,
        overdueByHours:
          overdueMinutes === null ? null : Math.round(overdueMinutes / 60),
        assignee: readPersonName(task.assignee?.name),
      };
    });
    const stalledOpportunities = stalledOpportunityRecords.map(
      (opportunity) => ({
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
      }),
    );
    const renewalsAtRisk = renewalAtRiskRecords.map((renewal) => ({
      id: renewal.id,
      name: renewal.name ?? null,
      stage: renewal.stage ?? null,
      risk: renewal.risk ?? null,
      riskReason: renewal.riskReason?.markdown?.trim() || null,
      targetDate: renewal.targetDate ?? null,
      nextAction: renewal.nextAction ?? null,
    }));

    return {
      generatedAt: now.toISOString(),
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
  },
});
