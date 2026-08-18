import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'diex-shared/utils';
import { In, IsNull, Not, type Repository } from 'typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/diex-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { WorkspaceArchitectureArtifactType } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { InboxTeamWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team.workspace-entity';
import { OfferWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/offer.workspace-entity';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { DiexWorkspaceContextWorkspaceEntity } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.workspace-entity';
import { WorkspaceContextStatus } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.standard-object-definition';
import { type WorkspaceReadinessCriterion } from 'src/modules/workspace-architecture/types/workspace-readiness-pack';
import { evaluateWorkspaceProductUpdates } from 'src/modules/workspace-architecture/utils/evaluate-workspace-product-updates.util';

type CommercialRepositories = {
  aiActionRepository: WorkspaceRepository<AiActionWorkspaceEntity>;
  conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>;
  messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>;
  offerRepository: WorkspaceRepository<OfferWorkspaceEntity>;
  opportunityRepository: WorkspaceRepository<OpportunityWorkspaceEntity>;
  personRepository: WorkspaceRepository<PersonWorkspaceEntity>;
  taskRepository: WorkspaceRepository<TaskWorkspaceEntity>;
  taskTargetRepository: WorkspaceRepository<TaskTargetWorkspaceEntity>;
  teamRepository: WorkspaceRepository<InboxTeamWorkspaceEntity>;
};

type CommercialCockpitAggregates = {
  conversations: number;
  opportunities: number;
  followUps: number;
  pipelineValueMicros: number;
  pipelineCurrencyCode: string;
  pipelineValues: Array<{
    amountMicros: number;
    currencyCode: string;
  }>;
  unassignedOpportunities: number;
  overdueFollowUps: number;
  unansweredLeads: number;
  averageResponseMinutes: number | null;
  nextActions: number;
  commercialRisks: number;
};

export type WorkspaceCommercialReadiness = Awaited<
  ReturnType<WorkspaceCommercialReadinessService['getReadiness']>
>;

@Injectable()
export class WorkspaceCommercialReadinessService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  async getReadiness(workspaceId: string) {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      () => this.getReadinessInContext(workspaceId),
      buildSystemAuthContext(workspaceId),
    );
  }

  private async getReadinessInContext(workspaceId: string) {
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
    const primaryChannel = workspace?.onboardingPrimaryChannel
      ?.trim()
      .toUpperCase();
    const usesRecordBasedEntry =
      primaryChannel === 'MANUAL' || primaryChannel === 'IMPORT';
    const requiresOpportunity = readinessPack.criteria.some(
      ({ key, required }) => key === 'first_opportunity_created' && required,
    );
    const requiresCompanyLink = readinessPack.criteria.some(
      ({ key, required }) => key === 'first_company_linked' && required,
    );
    const firstConversation = usesRecordBasedEntry
      ? null
      : await this.findFirstInboundCommercialConversation(
          repositories,
          primaryChannel,
        );
    const recordBasedFlow = usesRecordBasedEntry
      ? await this.findFirstRecordBasedFlow(repositories, {
          requiresOpportunity,
          requiresCompanyLink,
        })
      : null;
    const firstPerson = recordBasedFlow?.person ?? null;
    const firstOpportunity = recordBasedFlow?.opportunity ?? null;
    const firstFollowUpTask = usesRecordBasedEntry
      ? (recordBasedFlow?.followUpTask ?? null)
      : firstConversation
        ? await repositories.taskRepository.findOne({
            where: {
              diexInboxConversationId: firstConversation.id,
              assigneeId: Not(IsNull()),
              dueAt: Not(IsNull()),
            },
            order: { createdAt: 'ASC' },
          })
        : null;
    const firstContactId = usesRecordBasedEntry
      ? (firstPerson?.id ?? null)
      : (firstConversation?.personId ?? null);
    const firstCompanyId = usesRecordBasedEntry
      ? (firstOpportunity?.companyId ?? firstPerson?.companyId ?? null)
      : (firstConversation?.companyId ?? null);
    const firstOpportunityId = usesRecordBasedEntry
      ? (firstOpportunity?.id ?? null)
      : (firstConversation?.opportunityId ?? null);
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
          operationManifest?: { multiOperation?: unknown } | null;
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
    const activeTeamMemberIds = (defaultTeam?.memberships ?? [])
      .filter((membership) => membership.isActive === true)
      .map(({ workspaceMemberId }) => workspaceMemberId)
      .filter(
        (workspaceMemberId): workspaceMemberId is string =>
          typeof workspaceMemberId === 'string' && workspaceMemberId.length > 0,
      );
    const activeOwnerIds = new Set(
      [
        ...activeTeamMemberIds,
        firstConversation?.assigneeId,
        firstOpportunity?.ownerId,
        firstFollowUpTask?.assigneeId,
      ].filter(
        (workspaceMemberId): workspaceMemberId is string =>
          typeof workspaceMemberId === 'string' && workspaceMemberId.length > 0,
      ),
    );
    const activeOwnerCount = activeOwnerIds.size;
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
    const activeCapabilityIds = new Set(
      pageCatalog.items
        .filter(({ status }) => status === 'ACTIVE')
        .flatMap(({ capabilities }) => capabilities),
    );
    const architectureApproved =
      ['ACTIVE', 'PARTIALLY_APPLIED'].includes(String(blueprint?.status)) &&
      ['ACTIVE', 'PARTIALLY_APPLIED'].includes(String(changeSet?.status));
    const productUpdateEvaluation = evaluateWorkspaceProductUpdates({
      workspaceCreatedAt: workspace?.createdAt ?? null,
      context: {
        toneOfVoice: context?.toneOfVoice?.markdown ?? null,
        commercialRules: context?.commercialRules?.markdown ?? null,
        objectionPlaybook: context?.objectionPlaybook?.markdown ?? null,
        competitiveLandscape: context?.competitiveLandscape?.markdown ?? null,
        forbiddenClaims: context?.forbiddenClaims?.markdown ?? null,
      },
      contextIsActive: contextActive,
      acknowledgements:
        currentOnboardingEvidence?.productUpdates.acknowledgements ?? [],
      primaryChannel,
      // A recomendação gerada pela IA permanece rascunho até a publicação
      // explícita da arquitetura. Sem esse portão, apenas abrir um blueprint
      // sugerido poderia concluir silenciosamente o requisito multioperação.
      multiOperation: architectureApproved
        ? blueprintPayload?.operationManifest?.multiOperation
        : undefined,
    });
    const genericCriterionReady = (criterion: WorkspaceReadinessCriterion) => {
      const { key } = criterion;
      const productUpdateReady =
        productUpdateEvaluation.readinessByCriterionKey.get(key);

      if (isDefined(productUpdateReady)) {
        return productUpdateReady;
      }

      if (key === 'context_active') return contextActive;
      if (key === 'goal_defined') return isNonEmptyString(goal);
      if (key === 'ideal_customer_defined') {
        return isNonEmptyString(context?.idealCustomerProfile?.markdown);
      }
      if (key === 'offer_registered') return activeOfferCount > 0;
      if (key === 'architecture_approved') return architectureApproved;
      if (key === 'pipeline_approved') return pipelineApproved;
      if (key === 'owners_defined') return activeOwnerCount > 0;
      if (key === 'channel_connected') {
        if (usesRecordBasedEntry) {
          return firstPerson !== null;
        }
        if (primaryChannel === 'WHATSAPP') {
          return (
            currentOnboardingEvidence?.channel.state === 'CONNECTED' &&
            Boolean(currentOnboardingEvidence.channel.validatedAt) &&
            firstConversation?.channel === 'WHATSAPP'
          );
        }
        if (primaryChannel === 'EMAIL') {
          return firstConversation?.channel === 'EMAIL';
        }

        return false;
      }
      if (key === 'first_conversation_received') {
        return firstConversation !== null;
      }
      if (key === 'first_contact_identified') {
        return Boolean(firstContactId);
      }
      if (key === 'first_company_linked') {
        return Boolean(firstCompanyId);
      }
      if (key === 'first_opportunity_created') {
        return Boolean(firstOpportunityId);
      }
      if (key === 'first_follow_up_created') {
        return Boolean(
          firstFollowUpTask?.id &&
          firstFollowUpTask.assigneeId &&
          firstFollowUpTask.dueAt,
        );
      }
      if (key === 'first_ai_triage_completed') return hasValidAiTriage;
      if (key === 'cockpit_operational') return cockpitOperational;
      if (key === 'routing_rule_published') {
        return (
          new Set(activeTeamMemberIds).size > 1 &&
          defaultTeam?.routingStrategy === 'BALANCED'
        );
      }
      if (key === 'sla_defined') {
        return (
          defaultTeam?.status === 'ACTIVE' &&
          typeof defaultTeam.defaultResponseSlaMinutes === 'number' &&
          defaultTeam.defaultResponseSlaMinutes > 0
        );
      }
      if (key === 'approval_matrix_defined') {
        return architectureApproved && readTextList('approvalRules').length > 0;
      }
      if (key === 'required_fields_validated') {
        return (
          contextActive &&
          isNonEmptyString(context?.commercialRules?.markdown) &&
          isNonEmptyString(context?.forbiddenClaims?.markdown)
        );
      }
      if (key === 'scheduling_configured') {
        return activeCapabilityIds.has('scheduling');
      }
      if (key === 'responsavel_tecnica_definida') {
        return readTextList('teamAndRoles').length > 0;
      }
      if (key === 'base_legal_de_contato_registrada') {
        return readTextList('restrictions').length > 0;
      }
      if (key.endsWith('_configured')) {
        return activeCapabilityIds.has(key.replace(/_configured$/, ''));
      }

      return false;
    };
    const productUpdateNextActionByKey = new Map(
      productUpdateEvaluation.readinessCriteria.map((criterion) => [
        criterion.key,
        criterion.nextAction,
      ]),
    );
    const items = readinessPack.criteria.map((criterion) => ({
      ...criterion,
      ready: genericCriterionReady(criterion),
      nextAction:
        productUpdateNextActionByKey.get(criterion.key) ?? criterion.nextAction,
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
            weight: 1,
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
      owners_defined:
        activeOwnerCount > 0
          ? (defaultTeam?.id ?? [...activeOwnerIds][0] ?? null)
          : null,
      channel_connected: usesRecordBasedEntry
        ? (firstPerson?.id ?? null)
        : (currentOnboardingEvidence?.channel.instanceName ??
          firstConversation?.id ??
          null),
      first_conversation_received: firstConversation?.id ?? null,
      first_contact_identified: firstContactId,
      first_company_linked: firstCompanyId,
      first_opportunity_created: firstOpportunityId,
      first_follow_up_created:
        firstFollowUpTask?.id &&
        firstFollowUpTask.assigneeId &&
        firstFollowUpTask.dueAt
          ? firstFollowUpTask.id
          : null,
      first_ai_triage_completed: hasValidAiTriage
        ? (firstAiAction?.id ?? null)
        : null,
      cockpit_operational: cockpitOperational
        ? `setup-state:${pageCatalog.version}`
        : null,
    };
    for (const [
      criterionKey,
      recordId,
    ] of productUpdateEvaluation.evidenceRecordIdByCriterionKey) {
      knownEvidenceRecordIds[criterionKey] = recordId;
    }
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
        ? (currentOnboardingEvidence?.milestones.find(
            ({ key }) => key === criterion.key,
          )?.firstSeenAt ?? new Date().toISOString())
        : null,
    }));
    const firstValueRunReady = firstValueRunSteps.every(({ ready }) => ready);
    const firstValueRunStarted = firstValueRunSteps.some(({ ready }) => ready);
    const previousFirstValueRun = currentOnboardingEvidence?.firstValueRun;
    const firstValueRun = {
      id: `diex-first-value:${workspaceId}`,
      correlationId:
        firstConversation?.id ??
        firstOpportunityId ??
        firstContactId ??
        `workspace:${workspaceId}`,
      goal,
      status: firstValueRunReady
        ? ('COMPLETED' as const)
        : firstValueRunSteps.some(({ ready }) => ready)
          ? ('IN_PROGRESS' as const)
          : ('NOT_STARTED' as const),
      startedAt:
        previousFirstValueRun && previousFirstValueRun.status !== 'NOT_STARTED'
          ? previousFirstValueRun.startedAt
          : firstValueRunStarted
            ? new Date().toISOString()
            : new Date(0).toISOString(),
      completedAt: firstValueRunReady
        ? (previousFirstValueRun?.completedAt ?? new Date().toISOString())
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
    const setupSteps = items
      .filter(({ blocksActivation }) => blocksActivation)
      .map(({ key, label, ready, nextAction }) => ({
        key,
        label,
        ready,
        nextAction,
      }));
    const setupBlockers = setupSteps.filter(({ ready }) => !ready);

    return {
      ready: onboardingEvidence.journey.phase === 'READY',
      // A configuração inicial é o que libera o CRM. A prontidão continua
      // medindo a operação inteira e pode ficar abaixo de 100% sem travar nada.
      setup: {
        complete: setupBlockers.length === 0,
        steps: setupSteps,
        blockers: setupBlockers,
        nextAction:
          setupBlockers[0]?.nextAction ??
          'Abra o CRM configurado e siga com os próximos passos da operação.',
      },
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
        activeOwners: activeOwnerCount,
        conversations: cockpitAggregates.conversations,
        opportunities: cockpitAggregates.opportunities,
        followUps: cockpitAggregates.followUps,
      },
      dashboard: {
        pipelineValueMicros: cockpitAggregates.pipelineValueMicros,
        pipelineCurrencyCode: cockpitAggregates.pipelineCurrencyCode,
        pipelineValues: cockpitAggregates.pipelineValues,
        unassignedOpportunities: cockpitAggregates.unassignedOpportunities,
        overdueFollowUps: cockpitAggregates.overdueFollowUps,
        unansweredLeads: cockpitAggregates.unansweredLeads,
        averageResponseMinutes: cockpitAggregates.averageResponseMinutes,
        nextActions: cockpitAggregates.nextActions,
        commercialRisks: cockpitAggregates.commercialRisks,
      },
      evidence: {
        firstConversationId: firstConversation?.id ?? null,
        firstCompanyLinked: Boolean(firstCompanyId),
        firstOpportunityId,
        firstFollowUpCreated: Boolean(
          firstFollowUpTask?.id &&
          firstFollowUpTask.assigneeId &&
          firstFollowUpTask.dueAt,
        ),
        firstAiTriageCompleted: hasValidAiTriage,
        whatsappValidatedByMessage: firstConversation?.channel === 'WHATSAPP',
        primaryChannel: primaryChannel ?? firstConversation?.channel ?? null,
        channelValidation: {
          status: usesRecordBasedEntry
            ? 'CONFIGURED_WITHOUT_CONNECTION'
            : firstConversation
              ? 'VALIDATED_BY_REAL_INBOUND_MESSAGE'
              : primaryChannel
                ? 'AWAITING_REAL_INBOUND_MESSAGE'
                : 'AWAITING_CHANNEL_SELECTION',
          source: usesRecordBasedEntry
            ? 'workspace_onboarding_profile'
            : firstConversation
              ? 'inbox_conversation_and_message'
              : primaryChannel === 'WHATSAPP'
                ? 'whatsapp_connection_and_webhook'
                : 'workspace_onboarding_profile',
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
      dataFreshness: {
        status: 'LIVE',
        queriedAt: new Date().toISOString(),
        source: 'workspace_database',
      },
      productUpdates: productUpdateEvaluation.state,
    };
  }

  // Versão barata do portão de ativação, para o caminho quente que decide se o
  // usuário continua preso na tela de configuração. Duas leituras indexadas, e
  // só enquanto a trava ainda estiver marcada.
  async isWorkspaceSetupComplete(workspaceId: string): Promise<boolean> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      () => this.isWorkspaceSetupCompleteInContext(workspaceId),
      buildSystemAuthContext(workspaceId),
    );
  }

  private async isWorkspaceSetupCompleteInContext(
    workspaceId: string,
  ): Promise<boolean> {
    const [context, blueprint, changeSet] = await Promise.all([
      this.getWorkspaceContext(workspaceId),
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.CHANGE_SET,
      ),
    ]);
    const publishedStatuses = ['ACTIVE', 'PARTIALLY_APPLIED'];

    return (
      context?.status === WorkspaceContextStatus.ACTIVE &&
      isNonEmptyString(context.businessDescription?.markdown) &&
      isNonEmptyString(context.idealCustomerProfile?.markdown) &&
      publishedStatuses.includes(String(blueprint?.status)) &&
      publishedStatuses.includes(String(changeSet?.status))
    );
  }

  private async getCommercialCockpitAggregates(
    repositories: CommercialRepositories,
  ): Promise<CommercialCockpitAggregates> {
    const [
      opportunityAggregate,
      pipelineCurrencyAggregates,
      conversationAggregate,
      taskAggregate,
    ] = await Promise.all([
      repositories.opportunityRepository
        .createQueryBuilder('opportunity')
        .select('COUNT(opportunity.id)', 'opportunities')
        .addSelect(
          `COUNT(CASE WHEN (opportunity.stage IS NULL OR opportunity.stage NOT IN ('CUSTOMER', 'LOST')) AND opportunity.ownerId IS NULL THEN 1 END)`,
          'unassignedOpportunities',
        )
        .addSelect(
          `COUNT(CASE WHEN (opportunity.stage IS NULL OR opportunity.stage NOT IN ('CUSTOMER', 'LOST')) AND opportunity.dealRisk = 'HIGH' THEN 1 END)`,
          'commercialRisks',
        )
        .where('opportunity.deletedAt IS NULL')
        .getRawOne<{
          opportunities?: string;
          unassignedOpportunities?: string;
          commercialRisks?: string;
        }>(),
      repositories.opportunityRepository
        .createQueryBuilder('opportunity')
        .select(
          `COALESCE(NULLIF(opportunity."amountCurrencyCode", ''), 'BRL')`,
          'currencyCode',
        )
        .addSelect(
          `COALESCE(SUM(COALESCE(opportunity."amountAmountMicros", 0)), 0)`,
          'pipelineValueMicros',
        )
        .addSelect('COUNT(opportunity.id)', 'opportunityCount')
        .where('opportunity.deletedAt IS NULL')
        .andWhere(
          "(opportunity.stage IS NULL OR opportunity.stage NOT IN ('CUSTOMER', 'LOST'))",
        )
        .groupBy(
          `COALESCE(NULLIF(opportunity."amountCurrencyCode", ''), 'BRL')`,
        )
        .orderBy('COUNT(opportunity.id)', 'DESC')
        .addOrderBy(
          `COALESCE(NULLIF(opportunity."amountCurrencyCode", ''), 'BRL')`,
          'ASC',
        )
        .getRawMany<{
          currencyCode?: string;
          pipelineValueMicros?: string;
          opportunityCount?: string;
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
          `COUNT(CASE WHEN task.dueAt IS NOT NULL AND (task.status IS NULL OR task.status <> 'DONE') AND task.dueAt < NOW() THEN 1 END)`,
          'overdueFollowUps',
        )
        .addSelect(
          `COUNT(CASE WHEN task.dueAt IS NOT NULL AND (task.status IS NULL OR task.status <> 'DONE') THEN 1 END)`,
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

    const primaryPipelineCurrency = pipelineCurrencyAggregates[0];

    return {
      conversations: toNumber(conversationAggregate?.conversations),
      opportunities: toNumber(opportunityAggregate?.opportunities),
      followUps: toNumber(taskAggregate?.followUps),
      pipelineValueMicros: toNumber(
        primaryPipelineCurrency?.pipelineValueMicros,
      ),
      pipelineCurrencyCode: primaryPipelineCurrency?.currencyCode ?? 'BRL',
      pipelineValues: pipelineCurrencyAggregates.map((aggregate) => ({
        amountMicros: toNumber(aggregate.pipelineValueMicros),
        currencyCode: aggregate.currencyCode ?? 'BRL',
      })),
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
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      () => this.getCommercialRepositoriesInContext(workspaceId),
      buildSystemAuthContext(workspaceId),
    );
  }

  private async getCommercialRepositoriesInContext(
    workspaceId: string,
  ): Promise<CommercialRepositories> {
    const [
      aiActionRepository,
      conversationRepository,
      messageRepository,
      offerRepository,
      opportunityRepository,
      personRepository,
      taskRepository,
      taskTargetRepository,
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
      this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
        workspaceId,
        PersonWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
      this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
        workspaceId,
        TaskWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      ),
      this.globalWorkspaceOrmManager.getRepository<TaskTargetWorkspaceEntity>(
        workspaceId,
        TaskTargetWorkspaceEntity,
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
      personRepository,
      taskRepository,
      taskTargetRepository,
      teamRepository,
    };
  }

  private async findFirstRecordBasedFlow(
    repositories: CommercialRepositories,
    {
      requiresOpportunity,
      requiresCompanyLink,
    }: { requiresOpportunity: boolean; requiresCompanyLink: boolean },
  ) {
    const opportunities = requiresOpportunity
      ? await repositories.opportunityRepository.find({
          where: { pointOfContactId: Not(IsNull()) },
          order: { createdAt: 'ASC' },
          take: 2_000,
        })
      : [];
    const opportunityPersonIds = opportunities
      .map(({ pointOfContactId }) => pointOfContactId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const people =
      opportunityPersonIds.length > 0
        ? await repositories.personRepository.find({
            where: { id: In([...new Set(opportunityPersonIds)]) },
          })
        : await repositories.personRepository.find({
            order: { createdAt: 'ASC' },
            take: 2_000,
          });
    const peopleById = new Map(people.map((person) => [person.id, person]));
    const opportunityIds = opportunities.map(({ id }) => id);
    const personIds = people.map(({ id }) => id);
    const taskTargetWhere = [
      ...(opportunityIds.length > 0
        ? [{ targetOpportunityId: In(opportunityIds) }]
        : []),
      ...(personIds.length > 0 ? [{ targetPersonId: In(personIds) }] : []),
    ];
    const taskTargets =
      taskTargetWhere.length > 0
        ? await repositories.taskTargetRepository.find({
            where: taskTargetWhere,
            take: 4_000,
          })
        : [];
    const taskIds = [
      ...new Set(taskTargets.map(({ taskId }) => taskId)),
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
    const assignedTasks =
      taskIds.length > 0
        ? await repositories.taskRepository.find({
            where: {
              id: In(taskIds),
              assigneeId: Not(IsNull()),
              dueAt: Not(IsNull()),
            },
            order: { createdAt: 'ASC' },
          })
        : [];
    const findFollowUp = ({
      personId,
      opportunityId,
    }: {
      personId: string;
      opportunityId?: string;
    }) => {
      const linkedTaskIds = taskTargets
        .filter(
          (target) =>
            target.targetPersonId === personId ||
            (opportunityId && target.targetOpportunityId === opportunityId),
        )
        .map(({ taskId }) => taskId);

      return (
        assignedTasks.find((task) => linkedTaskIds.includes(task.id)) ?? null
      );
    };

    if (requiresOpportunity && opportunities.length > 0) {
      const candidates = opportunities
        .map((opportunity) => {
          const person = opportunity.pointOfContactId
            ? (peopleById.get(opportunity.pointOfContactId) ?? null)
            : null;
          const followUpTask = person
            ? findFollowUp({
                personId: person.id,
                opportunityId: opportunity.id,
              })
            : null;

          return { person, opportunity, followUpTask };
        })
        .filter(
          (
            candidate,
          ): candidate is {
            person: PersonWorkspaceEntity;
            opportunity: OpportunityWorkspaceEntity;
            followUpTask: TaskWorkspaceEntity | null;
          } => candidate.person !== null,
        );
      const completeCandidate = candidates.find(
        ({ person, opportunity, followUpTask }) =>
          followUpTask !== null &&
          (!requiresCompanyLink ||
            Boolean(opportunity.companyId ?? person.companyId)),
      );

      return (
        completeCandidate ??
        candidates[0] ?? {
          person: null,
          opportunity: null,
          followUpTask: null,
        }
      );
    }

    const orderedPeople = [...people].sort(
      (left, right) =>
        Date.parse(String(left.createdAt)) -
        Date.parse(String(right.createdAt)),
    );
    const completePerson = orderedPeople.find((person) => {
      const followUpTask = findFollowUp({ personId: person.id });

      return (
        followUpTask !== null &&
        (!requiresCompanyLink || Boolean(person.companyId))
      );
    });
    const person = completePerson ?? orderedPeople[0] ?? null;

    return {
      person,
      opportunity: null,
      followUpTask: person ? findFollowUp({ personId: person.id }) : null,
    };
  }

  private async getWorkspaceContext(workspaceId: string) {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<DiexWorkspaceContextWorkspaceEntity>(
        workspaceId,
        'diexWorkspaceContext',
        { shouldBypassPermissionChecks: true },
      );

    const contexts = await repository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    return contexts[0] ?? null;
  }

  private async findFirstInboundCommercialConversation(
    repositories: CommercialRepositories,
    preferredChannel?: string | null,
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
          .filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
      ),
    ];

    if (conversationIds.length === 0) {
      return null;
    }

    const conversations = await repositories.conversationRepository.find({
      where: { id: In(conversationIds) } as never,
    });
    const normalizedPreferredChannel = preferredChannel?.trim().toUpperCase();
    const channelScopedConversations = [
      'WHATSAPP',
      'EMAIL',
      'CALENDAR',
    ].includes(normalizedPreferredChannel ?? '')
      ? conversations.filter(
          ({ channel }) => channel === normalizedPreferredChannel,
        )
      : conversations;
    const channelPriority: Record<string, number> = {
      WHATSAPP: preferredChannel === 'WHATSAPP' ? 0 : 2,
      EMAIL: preferredChannel === 'EMAIL' ? 0 : 3,
      CALENDAR: preferredChannel === 'CALENDAR' ? 0 : 4,
      IMPORT: preferredChannel === 'IMPORT' ? 0 : 5,
    };
    const orderedConversations = [...channelScopedConversations].sort(
      (left, right) => {
        const priorityDifference =
          (channelPriority[left.channel ?? ''] ?? 10) -
          (channelPriority[right.channel ?? ''] ?? 10);

        return priorityDifference !== 0
          ? priorityDifference
          : Date.parse(String(left.createdAt)) -
              Date.parse(String(right.createdAt));
      },
    );

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
