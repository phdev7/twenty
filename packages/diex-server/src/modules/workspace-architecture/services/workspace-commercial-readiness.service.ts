import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { type Repository } from 'typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/diex-orm/repository/workspace.repository';
import { WorkspaceArchitectureArtifactType } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { InboxTeamWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team.workspace-entity';
import { OfferWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/offer.workspace-entity';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { DiexWorkspaceContextWorkspaceEntity } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.workspace-entity';
import { WorkspaceContextStatus } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.standard-object-definition';

type CommercialRepositories = {
  aiActionRepository: WorkspaceRepository<AiActionWorkspaceEntity>;
  conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>;
  messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>;
  offerRepository: WorkspaceRepository<OfferWorkspaceEntity>;
  opportunityRepository: WorkspaceRepository<OpportunityWorkspaceEntity>;
  taskRepository: WorkspaceRepository<TaskWorkspaceEntity>;
  teamRepository: WorkspaceRepository<InboxTeamWorkspaceEntity>;
};

type CommercialCockpitAggregates = {
  conversations: number;
  opportunities: number;
  followUps: number;
  pipelineValueMicros: number;
  unassignedOpportunities: number;
  overdueFollowUps: number;
  unansweredLeads: number;
  averageResponseMinutes: number | null;
  nextActions: number;
  commercialRisks: number;
};

@Injectable()
export class WorkspaceCommercialReadinessService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  async getReadiness(workspaceId: string) {
    const repositories = await this.getCommercialRepositories(workspaceId);
    const [
      context,
      activeOfferCount,
      defaultTeam,
      workspace,
      currentOnboardingEvidence,
    ] =
      await Promise.all([
        this.getWorkspaceContext(workspaceId),
        repositories.offerRepository.count({ where: { status: 'ACTIVE' } }),
        repositories.teamRepository.findOne({
          where: { status: 'ACTIVE', isDefault: true },
          relations: { memberships: true },
        }),
        this.workspaceRepository.findOne({ where: { id: workspaceId } }),
        this.workspaceArchitectureService.getOnboardingEvidence(workspaceId),
      ]);
    const firstConversation =
      await this.findFirstInboundCommercialConversation(repositories);
    const firstFollowUpTask = firstConversation
      ? await repositories.taskRepository.findOne({
          where: { diexInboxConversationId: firstConversation.id },
          order: { createdAt: 'ASC' },
        })
      : null;
    const firstFollowUpCount = firstConversation
      ? await repositories.taskRepository.count({
          where: { diexInboxConversationId: firstConversation.id },
        })
      : 0;
    const firstAiAction = firstConversation
      ? await repositories.aiActionRepository.findOne({
          where: {
            inboxConversationId: firstConversation.id,
            actionType: 'REPLY',
          },
        })
      : null;
    const cockpitAggregates =
      await this.getCommercialCockpitAggregates(repositories);
    const [profile, blueprint, changeSet, pageCatalog] = await Promise.all([
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
      ),
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.CHANGE_SET,
      ),
      this.workspaceArchitectureService.getPageCatalog(workspaceId),
    ]);
    const blueprintPayload = blueprint?.payload as
      | {
          selectedTemplates?: unknown;
          publishedOperations?: Array<{ resourceType?: string }>;
        }
      | undefined;
    const changeSetPayload = changeSet?.payload as
      | {
          publication?: {
            nativeOperationCount: number;
            manifestOperationCount: number;
            pendingNativeMaterialization: boolean;
            pendingNativeResourceTypes?: string[];
            materializedAdapters: string[];
          };
        }
      | undefined;
    const activeMembershipCount = (defaultTeam?.memberships ?? []).filter(
      (membership) =>
        membership.isActive === true &&
        typeof membership.workspaceMemberId === 'string',
    ).length;
    const adaptiveReview =
      await this.workspaceArchitectureService.getAdaptiveDrift(workspaceId);
    const activeCockpitPages = pageCatalog.items.filter(
      (page) => page.status === 'ACTIVE' && page.showInNavigation,
    );
    const cockpitOperational =
      activeCockpitPages.length > 0 &&
      !adaptiveReview.drift.some(({ severity }) => severity === 'BLOCKED') &&
      activeCockpitPages.every(
        (page) =>
          page.capabilityContract !== null &&
          page.dataContracts.length > 0 &&
          page.actions.length > 0 &&
          page.blocks.every(
            (block) =>
              block.dataContracts.length > 0 && block.actions.length > 0,
          ),
      );
    const contextActive =
      context?.status === WorkspaceContextStatus.ACTIVE &&
      isNonEmptyString(context.businessDescription?.markdown) &&
      isNonEmptyString(context.idealCustomerProfile?.markdown);
    const selectedTemplates = Array.isArray(blueprintPayload?.selectedTemplates)
      ? (blueprintPayload.selectedTemplates as unknown[])
      : [];
    const selectedCapabilityIds = selectedTemplates
      .map((template) =>
        template && typeof template === 'object' && 'id' in template
          ? (template as { id?: unknown }).id
          : null,
      )
      .filter(
        (id): id is string =>
          typeof id === 'string' && id.startsWith('diex.capability.'),
      )
      .map((id) => id.replace('diex.capability.', ''));
    const hasPipelinePublication =
      blueprintPayload?.publishedOperations?.some(
        ({ resourceType }) => resourceType === 'PIPELINE',
      ) ?? false;
    const pipelineApproved =
      (changeSet?.status === 'ACTIVE' && blueprint?.status === 'ACTIVE') ||
      (changeSet?.status === 'PARTIALLY_APPLIED' &&
        blueprint?.status === 'PARTIALLY_APPLIED' &&
        hasPipelinePublication);
    const goal = workspace?.onboardingPrimaryGoal ?? 'SELL_MORE';
    const goalWeights: Record<string, Record<string, number>> = {
      SELL_MORE: {
        context_active: 1,
        offer_registered: 2,
        ideal_customer_defined: 2,
        pipeline_approved: 2,
        owners_defined: 1,
        channel_connected: 2,
        first_conversation_received: 2,
        first_company_linked: 2,
        first_opportunity_created: 3,
        first_follow_up_created: 3,
        first_ai_triage_completed: 2,
      },
      RESPOND_FASTER: {
        channel_connected: 3,
        first_conversation_received: 3,
        first_ai_triage_completed: 3,
        owners_defined: 2,
        first_follow_up_created: 1,
      },
      ORGANIZE_WHATSAPP: {
        channel_connected: 3,
        first_conversation_received: 3,
        first_company_linked: 2,
        owners_defined: 2,
        pipeline_approved: 1,
      },
      CONTROL_FOLLOWUPS: {
        first_follow_up_created: 4,
        owners_defined: 2,
        pipeline_approved: 2,
        first_opportunity_created: 2,
        channel_connected: 1,
      },
      CUSTOMER_SUCCESS_RENEWALS: {
        context_active: 2,
        offer_registered: 2,
        ideal_customer_defined: 2,
        owners_defined: 3,
        first_follow_up_created: 3,
        pipeline_approved: 2,
      },
    };
    const items = [
      {
        key: 'context_active',
        label: 'Contexto comercial ativo',
        ready: contextActive,
        required: true,
      },
      {
        key: 'offer_registered',
        label: 'Produto ou oferta cadastrada',
        ready: activeOfferCount > 0,
        required: true,
      },
      {
        key: 'ideal_customer_defined',
        label: 'Cliente ideal definido',
        ready: isNonEmptyString(context?.idealCustomerProfile?.markdown),
        required: true,
      },
      {
        key: 'pipeline_approved',
        label: 'Pipeline aprovado e publicado',
        ready: pipelineApproved,
        required: true,
      },
      {
        key: 'owners_defined',
        label: 'Responsáveis definidos',
        ready: activeMembershipCount > 0,
        required: true,
      },
      {
        key: 'channel_connected',
        label: 'WhatsApp conectado e saudável',
        ready: currentOnboardingEvidence?.channel.state === 'CONNECTED',
        required: true,
      },
      {
        key: 'first_conversation_received',
        label: 'Primeira conversa recebida',
        ready: firstConversation !== null,
        required: true,
      },
      {
        key: 'first_company_linked',
        label: 'Empresa vinculada ao primeiro lead',
        ready: Boolean(firstConversation?.companyId),
        required: true,
      },
      {
        key: 'first_opportunity_created',
        label: 'Primeira oportunidade criada',
        ready: Boolean(firstConversation?.opportunityId),
        required: true,
      },
      {
        key: 'first_follow_up_created',
        label: 'Primeiro follow-up criado',
        ready: firstFollowUpCount > 0,
        required: true,
      },
      {
        key: 'first_ai_triage_completed',
        label: 'Triagem com IA e resposta sugerida',
        ready: firstAiAction !== null,
        required: true,
      },
      {
        key: 'cockpit_operational',
        label: 'Cockpit inicial operacional',
        ready: cockpitOperational,
        required: true,
      },
    ].map((item) => ({
      ...item,
      weight: goalWeights[goal]?.[item.key] ??
        (item.key === 'cockpit_operational' ? 2 : 1),
    }));
    const totalWeight = items.reduce((total, item) => total + item.weight, 0);
    const completedWeight = items.reduce(
      (total, item) => total + (item.ready ? item.weight : 0),
      0,
    );
    const adaptiveCapabilityPages = new Map<
      string,
      { label: string; status: string }
    >();

    for (const page of pageCatalog.items) {
      if (page.lifecycle === 'CORE') {
        continue;
      }

      for (const capability of page.capabilities) {
        if (
          selectedCapabilityIds.includes(capability) &&
          (!adaptiveCapabilityPages.has(capability) ||
            page.status === 'ACTIVE')
        ) {
          adaptiveCapabilityPages.set(capability, {
            label: page.label,
            status: page.status,
          });
        }
      }
    }

    const tracks = [
      {
        key: 'sales',
        label: 'Vendas',
        selected: true,
        items,
      },
      ...[...adaptiveCapabilityPages.entries()].map(
        ([capability, page]) => ({
          key: `capability_${capability}`,
          label: page.label,
          selected: true,
          items: [
            {
              key: `${capability}_page`,
              label: `Página de ${page.label} disponível`,
              ready: page.status === 'ACTIVE',
              required: true,
            },
          ],
        }),
      ),
    ].map((track) => {
      const trackWeight = track.items.reduce(
        (total, item) => total + (item.weight ?? 1),
        0,
      );
      const trackCompletedWeight = track.items.reduce(
        (total, item) => total + (item.ready ? (item.weight ?? 1) : 0),
        0,
      );

      return {
        ...track,
        ready: track.items.every(({ ready, required }) => !required || ready),
        score: trackWeight
          ? Math.round((trackCompletedWeight / trackWeight) * 100)
          : 100,
      };
    });
    const blueprintManifest = (
      blueprint?.payload as
        | { operationManifest?: { version?: number } }
        | undefined
    )?.operationManifest;
    const evidenceRecordIds: Record<string, string | null> = {
      context_active: context?.id ?? null,
      offer_registered: null,
      ideal_customer_defined: context?.id ?? null,
      pipeline_approved: changeSet?.id ?? null,
      owners_defined: defaultTeam?.id ?? null,
      channel_connected:
        currentOnboardingEvidence?.channel.instanceName ?? null,
      first_conversation_received: firstConversation?.id ?? null,
      first_company_linked: firstConversation?.companyId ?? null,
      first_opportunity_created: firstConversation?.opportunityId ?? null,
      first_follow_up_created: firstFollowUpTask?.id ?? null,
      first_ai_triage_completed: firstAiAction?.id ?? null,
      cockpit_operational: cockpitOperational
        ? `setup-state:${pageCatalog.version}`
        : null,
    };
    const onboardingEvidence =
      await this.workspaceArchitectureService.reconcileOnboardingEvidence({
        workspaceId,
        milestones: items.map(({ key, ready }) => ({
          key,
          ready,
          recordId: evidenceRecordIds[key] ?? null,
        })),
      });
    return {
      ready: onboardingEvidence.journey.phase === 'SELLING_READY',
      score: totalWeight
        ? Math.round((completedWeight / totalWeight) * 100)
        : 100,
      items,
      tracks,
      nextAction: onboardingEvidence.journey.nextAction,
      goal: workspace?.onboardingPrimaryGoal ?? null,
      counts: {
        activeOffers: activeOfferCount,
        activeOwners: activeMembershipCount,
        conversations: cockpitAggregates.conversations,
        opportunities: cockpitAggregates.opportunities,
        followUps: cockpitAggregates.followUps,
      },
      dashboard: {
        pipelineValueMicros: cockpitAggregates.pipelineValueMicros,
        pipelineCurrencyCode: 'BRL',
        unassignedOpportunities: cockpitAggregates.unassignedOpportunities,
        overdueFollowUps: cockpitAggregates.overdueFollowUps,
        unansweredLeads: cockpitAggregates.unansweredLeads,
        averageResponseMinutes: cockpitAggregates.averageResponseMinutes,
        nextActions: cockpitAggregates.nextActions,
        commercialRisks: cockpitAggregates.commercialRisks,
      },
      evidence: {
        firstConversationId: firstConversation?.id ?? null,
        firstCompanyLinked: Boolean(firstConversation?.companyId),
        firstOpportunityId: firstConversation?.opportunityId ?? null,
        firstFollowUpCreated: firstFollowUpCount > 0,
        firstAiTriageCompleted: firstAiAction !== null,
        whatsappValidatedByMessage:
          firstConversation?.channel === 'WHATSAPP',
        primaryChannel: firstConversation?.channel ?? null,
        channelValidation: {
          status: firstConversation
            ? 'VALIDATED_BY_REAL_INBOUND_MESSAGE'
            : 'AWAITING_REAL_INBOUND_MESSAGE',
          source: firstConversation
            ? 'inbox_conversation_and_message'
            : 'whatsapp_connection_and_webhook',
        },
        channelHealth: onboardingEvidence.channel,
      },
      milestones: onboardingEvidence.milestones,
      evidenceLedger: {
        version: onboardingEvidence.version,
        lastReconciledAt: onboardingEvidence.lastReconciledAt,
        events: onboardingEvidence.events.slice(-20),
      },
      activation: onboardingEvidence.activation,
      onboardingJourney: onboardingEvidence.journey,
      adaptiveReview,
      architecture: {
        profileStatus: profile?.status ?? null,
        blueprintStatus: blueprint?.status ?? null,
        changeSetStatus: changeSet?.status ?? null,
        operationManifestVersion: blueprintManifest?.version ?? null,
        publication: changeSetPayload?.publication ?? null,
      },
    };
  }

  private async getCommercialCockpitAggregates(
    repositories: CommercialRepositories,
  ): Promise<CommercialCockpitAggregates> {
    const [opportunityAggregate, conversationAggregate, taskAggregate] =
      await Promise.all([
        repositories.opportunityRepository
          .createQueryBuilder('opportunity')
          .select('COUNT(opportunity.id)', 'opportunities')
          .addSelect(
            `COALESCE(SUM(CASE WHEN opportunity.amount->>'currencyCode' = 'BRL' THEN COALESCE(NULLIF(opportunity.amount->>'amountMicros', '')::numeric, 0) ELSE 0 END), 0)`,
            'pipelineValueMicros',
          )
          .addSelect(
            'COUNT(CASE WHEN opportunity.ownerId IS NULL THEN 1 END)',
            'unassignedOpportunities',
          )
          .addSelect(
            `COUNT(CASE WHEN opportunity.dealRisk IN ('HIGH', 'CRITICAL', 'AT_RISK') THEN 1 END)`,
            'commercialRisks',
          )
          .where('opportunity.deletedAt IS NULL')
          .getRawOne<{
            opportunities?: string;
            pipelineValueMicros?: string;
            unassignedOpportunities?: string;
            commercialRisks?: string;
          }>(),
        repositories.conversationRepository
          .createQueryBuilder('conversation')
          .select('COUNT(conversation.id)', 'conversations')
          .addSelect(
            `COUNT(CASE WHEN conversation.lastMessageDirection = 'INBOUND' AND conversation.firstRespondedAt IS NULL THEN 1 END)`,
            'unansweredLeads',
          )
          .addSelect(
            `AVG(CASE WHEN conversation.firstRespondedAt IS NOT NULL THEN EXTRACT(EPOCH FROM (conversation.firstRespondedAt - conversation.createdAt)) / 60 END)`,
            'averageResponseMinutes',
          )
          .where('conversation.deletedAt IS NULL')
          .getRawOne<{
            conversations?: string;
            unansweredLeads?: string;
            averageResponseMinutes?: string | null;
          }>(),
        repositories.taskRepository
          .createQueryBuilder('task')
          .select('COUNT(task.id)', 'followUps')
          .addSelect(
            `COUNT(CASE WHEN task.dueAt IS NOT NULL AND COALESCE(task.status, '') NOT IN ('DONE', 'COMPLETED', 'CANCELLED') AND task.dueAt < NOW() THEN 1 END)`,
            'overdueFollowUps',
          )
          .addSelect(
            `COUNT(CASE WHEN task.dueAt IS NOT NULL AND COALESCE(task.status, '') NOT IN ('DONE', 'COMPLETED', 'CANCELLED') THEN 1 END)`,
            'nextActions',
          )
          .where('task.deletedAt IS NULL')
          .getRawOne<{
            followUps?: string;
            overdueFollowUps?: string;
            nextActions?: string;
          }>(),
      ]);
    const toNumber = (value: string | undefined | null): number => {
      const parsed = Number(value ?? 0);

      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      conversations: toNumber(conversationAggregate?.conversations),
      opportunities: toNumber(opportunityAggregate?.opportunities),
      followUps: toNumber(taskAggregate?.followUps),
      pipelineValueMicros: toNumber(
        opportunityAggregate?.pipelineValueMicros,
      ),
      unassignedOpportunities: toNumber(
        opportunityAggregate?.unassignedOpportunities,
      ),
      overdueFollowUps: toNumber(taskAggregate?.overdueFollowUps),
      unansweredLeads: toNumber(conversationAggregate?.unansweredLeads),
      averageResponseMinutes:
        conversationAggregate?.averageResponseMinutes == null
          ? null
          : Math.round(
              toNumber(conversationAggregate.averageResponseMinutes),
            ),
      nextActions: toNumber(taskAggregate?.nextActions),
      commercialRisks: toNumber(opportunityAggregate?.commercialRisks),
    };
  }

  private async getCommercialRepositories(
    workspaceId: string,
  ): Promise<CommercialRepositories> {
    const [
      aiActionRepository,
      conversationRepository,
      messageRepository,
      offerRepository,
      opportunityRepository,
      taskRepository,
      teamRepository,
    ] = await Promise.all([
      this.globalWorkspaceOrmManager.getRepository<AiActionWorkspaceEntity>(
        workspaceId,
        AiActionWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
      this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
        workspaceId,
        InboxConversationWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
      this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
      this.globalWorkspaceOrmManager.getRepository<OfferWorkspaceEntity>(
        workspaceId,
        OfferWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
      this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
        workspaceId,
        OpportunityWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
      this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
        workspaceId,
        TaskWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
      this.globalWorkspaceOrmManager.getRepository<InboxTeamWorkspaceEntity>(
        workspaceId,
        InboxTeamWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
    ]);

    return {
      aiActionRepository,
      conversationRepository,
      messageRepository,
      offerRepository,
      opportunityRepository,
      taskRepository,
      teamRepository,
    };
  }

  private async getWorkspaceContext(workspaceId: string) {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<DiexWorkspaceContextWorkspaceEntity>(
        workspaceId,
        'diexWorkspaceContext',
        { shouldBypassPermissionChecks: true },
      );

    return repository.findOne({ order: { createdAt: 'ASC' } });
  }

  private async findFirstInboundCommercialConversation(
    repositories: CommercialRepositories,
  ) {
    const conversations = await repositories.conversationRepository.find({
      order: { createdAt: 'ASC' },
      take: 500,
    });
    const channelPriority: Record<string, number> = {
      WHATSAPP: 0,
      EMAIL: 1,
      CALENDAR: 2,
      IMPORT: 3,
    };
    const orderedConversations = [...conversations].sort((left, right) => {
      const priorityDifference =
        (channelPriority[left.channel ?? ''] ?? 10) -
        (channelPriority[right.channel ?? ''] ?? 10);

      return priorityDifference !== 0
        ? priorityDifference
        : Date.parse(String(left.createdAt)) - Date.parse(String(right.createdAt));
    });

    for (const conversation of orderedConversations) {
      const inboundMessage = await repositories.messageRepository.findOne({
        where: {
          inboxConversationId: conversation.id,
          direction: 'INBOUND',
        },
        order: { sentAt: 'ASC' },
      });

      if (inboundMessage) {
        return conversation;
      }
    }

    return null;
  }
}
