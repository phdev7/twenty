import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { In, type Repository } from 'typeorm';

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
import {
  type WorkspaceReadinessCriterion,
  type WorkspaceReadinessPack,
} from 'src/modules/workspace-architecture/types/workspace-readiness-pack';

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
      readinessPack,
    ] = await Promise.all([
      this.getWorkspaceContext(workspaceId),
      repositories.offerRepository.count({ where: { status: 'ACTIVE' } }),
      repositories.teamRepository.findOne({
        where: { status: 'ACTIVE', isDefault: true },
        relations: { memberships: true },
      }),
      this.workspaceRepository.findOne({ where: { id: workspaceId } }),
      this.workspaceArchitectureService.getOnboardingEvidence(workspaceId),
      this.workspaceArchitectureService.getWorkspaceReadinessPack(workspaceId),
    ]);
    const firstConversation =
      await this.findFirstInboundCommercialConversation(repositories);
    const firstFollowUpTask = firstConversation
      ? await repositories.taskRepository.findOne({
          where: { diexInboxConversationId: firstConversation.id },
          order: { createdAt: 'ASC' },
        })
      : null;
    const firstAiAction = firstConversation
      ? await repositories.aiActionRepository.findOne({
          where: {
            inboxConversationId: firstConversation.id,
            actionType: 'REPLY',
            status: In([
              'PENDING_APPROVAL',
              'APPROVED',
              'EXECUTING',
              'EXECUTED',
            ]),
          },
          order: { createdAt: 'ASC' },
        })
      : null;
    const hasValidAiTriage = Boolean(
      firstAiAction &&
        isNonEmptyString(firstAiAction.rationale?.markdown) &&
        isNonEmptyString(firstAiAction.proposedAction?.markdown) &&
        firstAiAction.confidence !== null,
    );
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
    const cockpitPages = pageCatalog.items.filter(
      (page) =>
        page.status === 'ACTIVE' &&
        (page.renderer === 'DASHBOARD' ||
          /(cockpit|dashboard|intelligence|overview)/.test(page.key) ||
          page.capabilities.some((capability) =>
            /(analytics|cockpit|dashboard|intelligence|reporting)/.test(
              capability,
            ),
          )),
    );
    const cockpitOperational = cockpitPages.some(
      (page) =>
        page.capabilityContract !== null &&
        page.actions.length > 0 &&
        page.blocks.length > 0 &&
        (page.dataContracts.length > 0 ||
          page.blocks.some(
            (block) =>
              block.dataContracts.length > 0 && block.actions.length > 0,
          )),
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
    const goal = workspace?.onboardingPrimaryGoal ?? null;
    const profilePayload =
      profile?.payload && typeof profile.payload === 'object'
        ? (profile.payload as Record<string, unknown>)
        : {};
    const readTextList = (key: string): string[] =>
      Array.isArray(profilePayload[key])
        ? profilePayload[key].filter(
            (value): value is string =>
              typeof value === 'string' && value.trim().length > 0,
          )
        : [];
    const profileSignals = [
      ...readTextList('responsibilityRules'),
      ...readTextList('commercialRules'),
      ...readTextList('restrictions'),
      ...readTextList('approvalRules'),
    ]
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const teamSignals = readTextList('teamAndRoles')
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const activeCapabilityIds = new Set(
      pageCatalog.items
        .filter(({ status }) => status === 'ACTIVE')
        .flatMap(({ capabilities }) => capabilities),
    );
    const architectureApproved =
      ['ACTIVE', 'PARTIALLY_APPLIED'].includes(String(blueprint?.status)) &&
      ['ACTIVE', 'PARTIALLY_APPLIED'].includes(String(changeSet?.status));
    const genericCriterionReady = (criterion: WorkspaceReadinessCriterion) => {
      const { key } = criterion;

      if (key === 'context_active') return contextActive;
      if (key === 'goal_defined') return isNonEmptyString(goal);
      if (key === 'ideal_customer_defined') {
        return isNonEmptyString(context?.idealCustomerProfile?.markdown);
      }
      if (key === 'offer_registered') return activeOfferCount > 0;
      if (key === 'architecture_approved') return architectureApproved;
      if (key === 'pipeline_approved') return pipelineApproved;
      if (key === 'owners_defined') return activeMembershipCount > 0;
      if (key === 'channel_connected') {
        return currentOnboardingEvidence?.channel.state === 'CONNECTED';
      }
      if (key === 'first_conversation_received') {
        return firstConversation !== null;
      }
      if (key === 'first_contact_identified') {
        return Boolean(firstConversation?.personId);
      }
      if (key === 'first_company_linked') {
        return Boolean(firstConversation?.companyId);
      }
      if (key === 'first_opportunity_created') {
        return Boolean(firstConversation?.opportunityId);
      }
      if (key === 'first_follow_up_created') {
        return Boolean(firstFollowUpTask?.id && firstFollowUpTask.assigneeId);
      }
      if (key === 'first_ai_triage_completed') return hasValidAiTriage;
      if (key === 'cockpit_operational') return cockpitOperational;
      if (key === 'routing_rule_published') {
        return (
          activeMembershipCount > 1 &&
          /(distribu|rotea|fila|carteira|round robin)/.test(profileSignals)
        );
      }
      if (key === 'sla_defined') return readTextList('slaTargets').length > 0;
      if (key === 'approval_matrix_defined') {
        return readTextList('approvalRules').length > 0;
      }
      if (key === 'required_fields_validated') return architectureApproved;
      if (key === 'scheduling_configured') {
        return activeCapabilityIds.has('scheduling');
      }
      if (key === 'responsavel_tecnica_definida') {
        return /(responsavel|tecnica|profissional|diretor|gestor)/.test(
          teamSignals,
        );
      }
      if (key === 'base_legal_de_contato_registrada') {
        return /(base legal|consent|opt.?in|contrato|legitimo interesse|tutela da saude|obrigacao legal|autoriz)/.test(
          profileSignals,
        );
      }
      if (key.endsWith('_configured')) {
        return activeCapabilityIds.has(key.replace(/_configured$/, ''));
      }

      return false;
    };
    const items = readinessPack.criteria.map((criterion) => ({
      ...criterion,
      ready: genericCriterionReady(criterion),
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
          (!adaptiveCapabilityPages.has(capability) || page.status === 'ACTIVE')
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
        key: 'operation',
        label: readinessPack.operationLabel,
        selected: true,
        items,
      },
      ...[...adaptiveCapabilityPages.entries()].map(([capability, page]) => ({
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
      })),
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
    const knownEvidenceRecordIds: Record<string, string | null> = {
      context_active: context?.id ?? null,
      goal_defined: goal,
      offer_registered: activeOfferCount > 0 ? 'offer:active' : null,
      ideal_customer_defined: context?.id ?? null,
      architecture_approved: changeSet?.id ?? null,
      pipeline_approved: changeSet?.id ?? null,
      owners_defined: defaultTeam?.id ?? null,
      channel_connected:
        currentOnboardingEvidence?.channel.instanceName ?? null,
      first_conversation_received: firstConversation?.id ?? null,
      first_contact_identified: firstConversation?.personId ?? null,
      first_company_linked: firstConversation?.companyId ?? null,
      first_opportunity_created: firstConversation?.opportunityId ?? null,
      first_follow_up_created:
        firstFollowUpTask?.id && firstFollowUpTask.assigneeId
          ? firstFollowUpTask.id
          : null,
      first_ai_triage_completed: hasValidAiTriage
        ? firstAiAction?.id ?? null
        : null,
      cockpit_operational: cockpitOperational
        ? `setup-state:${pageCatalog.version}`
        : null,
    };
    const evidenceRecordIds = Object.fromEntries(
      items.map(({ key }) => [key, knownEvidenceRecordIds[key] ?? null]),
    );
    const firstValueCriteria = items.filter(
      (criterion) => criterion.firstValue,
    );
    const firstValueRunSteps = firstValueCriteria.map((criterion) => ({
      key: criterion.key,
      label: criterion.label,
      ready: criterion.ready,
      recordId: evidenceRecordIds[criterion.key] ?? null,
      source: criterion.source,
      occurredAt: criterion.ready
        ? currentOnboardingEvidence?.milestones.find(
            ({ key }) => key === criterion.key,
          )?.firstSeenAt ?? new Date().toISOString()
        : null,
    }));
    const firstValueRunReady = firstValueRunSteps.every(({ ready }) => ready);
    const firstValueRunStarted = firstValueRunSteps.some(({ ready }) => ready);
    const previousFirstValueRun = currentOnboardingEvidence?.firstValueRun;
    const firstValueRun = {
      id: `diex-first-value:${workspaceId}`,
      correlationId:
        firstConversation?.id ??
        firstConversation?.opportunityId ??
        `workspace:${workspaceId}`,
      goal,
      status: firstValueRunReady
        ? ('COMPLETED' as const)
        : firstValueRunSteps.some(({ ready }) => ready)
          ? ('IN_PROGRESS' as const)
          : ('NOT_STARTED' as const),
      startedAt:
        previousFirstValueRun &&
        previousFirstValueRun.status !== 'NOT_STARTED'
          ? previousFirstValueRun.startedAt
          : firstValueRunStarted
            ? new Date().toISOString()
            : new Date(0).toISOString(),
      completedAt: firstValueRunReady
        ? previousFirstValueRun?.completedAt ??
          new Date().toISOString()
        : null,
      steps: firstValueRunSteps,
    };
    const onboardingEvidence =
      await this.workspaceArchitectureService.reconcileOnboardingEvidence({
        workspaceId,
        readinessCriteria: readinessPack.criteria,
        firstValueRun,
        milestones: items.map(({ key, ready }) => ({
          key,
          ready,
          recordId: evidenceRecordIds[key] ?? null,
        })),
      });
    return {
      ready: onboardingEvidence.journey.phase === 'READY',
      score: totalWeight
        ? Math.round((completedWeight / totalWeight) * 100)
        : 100,
      items,
      tracks,
      nextAction: onboardingEvidence.journey.nextAction,
      goal,
      readinessPack,
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
        firstFollowUpCreated: Boolean(
          firstFollowUpTask?.id && firstFollowUpTask.assigneeId,
        ),
        firstAiTriageCompleted: hasValidAiTriage,
        whatsappValidatedByMessage: firstConversation?.channel === 'WHATSAPP',
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
      firstValueRun: onboardingEvidence.firstValueRun,
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
      pipelineValueMicros: toNumber(opportunityAggregate?.pipelineValueMicros),
      unassignedOpportunities: toNumber(
        opportunityAggregate?.unassignedOpportunities,
      ),
      overdueFollowUps: toNumber(taskAggregate?.overdueFollowUps),
      unansweredLeads: toNumber(conversationAggregate?.unansweredLeads),
      averageResponseMinutes:
        conversationAggregate?.averageResponseMinutes == null
          ? null
          : Math.round(toNumber(conversationAggregate.averageResponseMinutes)),
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
    const inboundMessages = await repositories.messageRepository.find({
      where: { direction: 'INBOUND' },
      order: { sentAt: 'ASC' },
      take: 2_000,
    });
    const conversationIds = [
      ...new Set(
        inboundMessages
          .map(({ inboxConversationId }) => inboxConversationId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ),
    ];

    if (conversationIds.length === 0) {
      return null;
    }

    const conversations = await repositories.conversationRepository.find({
      where: { id: In(conversationIds) } as never,
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
        : Date.parse(String(left.createdAt)) -
            Date.parse(String(right.createdAt));
    });

    const firstInboundConversationIds = new Set(
      inboundMessages.map(({ inboxConversationId }) => inboxConversationId),
    );

    for (const conversation of orderedConversations) {
      if (firstInboundConversationIds.has(conversation.id)) {
        return conversation;
      }
    }

    return null;
  }
}
