import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { FieldActorSource } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';
import { WorkspaceActivationStatus } from 'diex-shared/workspace';
import { In, type QueryRunner, Repository } from 'typeorm';

import { BillingCreditService } from 'src/engine/core-modules/billing/services/billing-credit.service';
import { BillingService } from 'src/engine/core-modules/billing/services/billing.service';
import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { ONBOARDING_INSTALLABLE_APP_UNIVERSAL_IDENTIFIERS } from 'src/engine/core-modules/onboarding/constants/onboarding-installable-app-universal-identifiers';
import { OnboardingStatus } from 'src/engine/core-modules/onboarding/enums/onboarding-status.enum';
import {
  INSTALL_ONBOARDING_APPS_JOB_NAME,
  type InstallOnboardingAppsJobData,
} from 'src/engine/core-modules/onboarding/jobs/install-onboarding-apps.job-constants';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { UserVarsService } from 'src/engine/core-modules/user/user-vars/services/user-vars.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/diex-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { InboxTeamWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team.workspace-entity';
import { InboxTeamMemberWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team-member.workspace-entity';
import { normalizePhone } from 'src/modules/inbox/utils/evolution-payload.util';
import {
  buildPhonesValue,
  splitDisplayName,
} from 'src/modules/inbox/utils/inbox-contact-phone.util';
import { OfferWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/offer.workspace-entity';
import {
  OfferPricingModel,
  OfferStatus,
} from 'src/modules/commercial-intelligence/standard-objects/offer.standard-object-definition';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { type DiexWorkspaceContextWorkspaceEntity } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.workspace-entity';
import { WorkspaceContextStatus } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.standard-object-definition';
import {
  type WorkspaceCustomPageBlockInput,
  WorkspaceArchitectureService,
} from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { WorkspaceCommercialReadinessService } from 'src/modules/workspace-architecture/services/workspace-commercial-readiness.service';
import { WorkspaceArchitectureArtifactType } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';
import {
  type WorkspacePageRenderer,
  workspacePageCatalogStateSchema,
} from 'src/modules/workspace-architecture/types/workspace-page-catalog.schema';
import { type GeneratedWorkspaceContext } from 'src/engine/core-modules/onboarding/types/generated-workspace-context.schema';

export enum OnboardingStepKeys {
  ONBOARDING_CONNECT_ACCOUNT_PENDING = 'ONBOARDING_CONNECT_ACCOUNT_PENDING',
  ONBOARDING_DIEX_WORKSPACE_PENDING = 'ONBOARDING_DIEX_WORKSPACE_PENDING',
  ONBOARDING_INVITE_TEAM_PENDING = 'ONBOARDING_INVITE_TEAM_PENDING',
  ONBOARDING_CREATE_PROFILE_PENDING = 'ONBOARDING_CREATE_PROFILE_PENDING',
  ONBOARDING_INSTALL_APPS_PENDING = 'ONBOARDING_INSTALL_APPS_PENDING',
}

export type OnboardingKeyValueTypeMap = {
  [OnboardingStepKeys.ONBOARDING_CONNECT_ACCOUNT_PENDING]: boolean;
  [OnboardingStepKeys.ONBOARDING_DIEX_WORKSPACE_PENDING]: boolean;
  [OnboardingStepKeys.ONBOARDING_INVITE_TEAM_PENDING]: boolean;
  [OnboardingStepKeys.ONBOARDING_CREATE_PROFILE_PENDING]: boolean;
  [OnboardingStepKeys.ONBOARDING_INSTALL_APPS_PENDING]: boolean;
};

const COMMERCIAL_GOALS = [
  'SELL_MORE',
  'RESPOND_FASTER',
  'ORGANIZE_WHATSAPP',
  'CONTROL_FOLLOWUPS',
  'CUSTOMER_SUCCESS_RENEWALS',
] as const;

const ONBOARDING_PRIMARY_CHANNELS = [
  'WHATSAPP',
  'EMAIL',
  'IMPORT',
  'MANUAL',
  'LATER',
] as const;

type CommercialRepositories = {
  aiActionRepository: WorkspaceRepository<AiActionWorkspaceEntity>;
  companyRepository: WorkspaceRepository<CompanyWorkspaceEntity>;
  conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>;
  messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>;
  offerRepository: WorkspaceRepository<OfferWorkspaceEntity>;
  opportunityRepository: WorkspaceRepository<OpportunityWorkspaceEntity>;
  personRepository: WorkspaceRepository<PersonWorkspaceEntity>;
  taskRepository: WorkspaceRepository<TaskWorkspaceEntity>;
  taskTargetRepository: WorkspaceRepository<TaskTargetWorkspaceEntity>;
  teamRepository: WorkspaceRepository<InboxTeamWorkspaceEntity>;
};

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly billingCreditService: BillingCreditService,
    private readonly cacheLockService: CacheLockService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
    private readonly workspaceCommercialReadinessService: WorkspaceCommercialReadinessService,
    private readonly userVarsService: UserVarsService<OnboardingKeyValueTypeMap>,
    private readonly diexConfigService: DiexConfigService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async completeDiexOnboarding({
    operationDescription,
    userId,
    userWorkspaceId,
    workspaceMemberId,
    workspace,
  }: {
    operationDescription: string;
    userId: string;
    userWorkspaceId: string;
    workspaceMemberId: string;
    workspace: WorkspaceEntity;
  }) {
    const [workspaceOwner] = await this.userWorkspaceRepository.find({
      where: { workspaceId: workspace.id },
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (!isDefined(workspaceOwner) || workspaceOwner.userId !== userId) {
      throw new ForbiddenException(
        'Only the workspace owner can define its initial operation context.',
      );
    }

    await this.ensureInitialOperatingTeam({
      workspaceId: workspace.id,
      workspaceMemberId,
    });

    const {
      generatedContext,
      operationProfile,
      modelId: resolvedModelId,
    } = await this.workspaceArchitectureService.generateWorkspaceContext({
      workspaceId: workspace.id,
      description: operationDescription,
      modelId: workspace.fastModel,
      commercialGoal: workspace.onboardingPrimaryGoal,
      userWorkspaceId,
    });

    await this.persistGeneratedWorkspaceContext({
      workspaceId: workspace.id,
      generatedContext,
    });
    await this.seedGeneratedOffers({
      workspaceId: workspace.id,
      productsAndServices: operationProfile.productsAndServices,
      idealCustomerProfile: generatedContext.idealCustomerProfile,
      objectionPlaybook: generatedContext.objectionPlaybook,
      commercialRules: generatedContext.commercialRules,
    });
    const architecture =
      await this.workspaceArchitectureService.createInitialArchitecture({
        workspaceId: workspace.id,
        sourceDescription: operationDescription.trim(),
        operationProfile,
        modelId: resolvedModelId,
        commercialGoal: workspace.onboardingPrimaryGoal,
      });
    if (architecture?.blueprint) {
      const existingChangeSet =
        await this.workspaceArchitectureService.getLatestArtifact(
          workspace.id,
          WorkspaceArchitectureArtifactType.CHANGE_SET,
        );

      if (
        !existingChangeSet ||
        existingChangeSet.payload?.blueprintVersion !==
          architecture.blueprint.version
      ) {
        await this.workspaceArchitectureService.createChangeSet({
          workspaceId: workspace.id,
          blueprint: architecture.blueprint,
        });
      }
    }

    // Only fills what the sign-up left blank. These columns hold the answers the
    // requester typed and are what the admin reads when approving, so replacing
    // them with the AI's rewording destroyed the original record of what was
    // said — including onboardingCurrentProcess, which answered a different
    // question entirely.
    const keepExisting = (existing: string | null, generated: string | null) =>
      isNonEmptyString(existing) ? existing : (generated ?? existing);

    await this.workspaceRepository.update(workspace.id, {
      onboardingCompanyDescription: keepExisting(
        workspace.onboardingCompanyDescription,
        generatedContext.businessDescription,
      ),
      onboardingIdealCustomerProfile: keepExisting(
        workspace.onboardingIdealCustomerProfile,
        generatedContext.idealCustomerProfile,
      ),
      onboardingToneOfVoice: keepExisting(
        workspace.onboardingToneOfVoice,
        generatedContext.toneOfVoice,
      ),
      onboardingCurrentProcess: keepExisting(
        workspace.onboardingCurrentProcess,
        operationDescription.trim(),
      ),
    });

    await Promise.all([
      this.setOnboardingConnectAccountPending({
        userId,
        workspaceId: workspace.id,
        value: false,
      }),
      this.setOnboardingDiexWorkspacePending({
        userId,
        workspaceId: workspace.id,
        // Context activation is not commercial completion. Keep the marker
        // until the first real conversation produces an opportunity and a
        // follow-up.
        value: true,
      }),
      this.setOnboardingInstallAppsPending({
        userId,
        workspaceId: workspace.id,
        value: false,
      }),
      this.setOnboardingCreateProfilePending({
        userId,
        workspaceId: workspace.id,
        value: false,
      }),
      this.setOnboardingInviteTeamPending({
        workspaceId: workspace.id,
        value: false,
      }),
    ]);

    return { success: true, contextStatus: WorkspaceContextStatus.DRAFT };
  }

  async regenerateDiexArchitecture({
    workspaceId,
    userId,
    userWorkspaceId,
  }: {
    workspaceId: string;
    userId: string;
    userWorkspaceId: string;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);

    const [workspace, context] = await Promise.all([
      this.workspaceRepository.findOne({ where: { id: workspaceId } }),
      this.getWorkspaceContext(workspaceId),
    ]);

    if (!workspace) {
      throw new BadRequestException('Workspace não encontrado.');
    }

    if (!context || context.status !== WorkspaceContextStatus.ACTIVE) {
      throw new BadRequestException(
        'Revise e ative o contexto comercial antes de recalcular a arquitetura.',
      );
    }

    const sourceDescription = this.buildArchitectureSourceDescription({
      workspace,
      context,
    });
    const { generatedContext, operationProfile, modelId } =
      await this.workspaceArchitectureService.generateWorkspaceContext({
        workspaceId,
        description: sourceDescription,
        modelId: workspace.fastModel,
        commercialGoal: workspace.onboardingPrimaryGoal,
        userWorkspaceId,
      });

    await this.seedGeneratedOffers({
      workspaceId,
      productsAndServices: operationProfile.productsAndServices,
      idealCustomerProfile: generatedContext.idealCustomerProfile,
      objectionPlaybook: generatedContext.objectionPlaybook,
      commercialRules: generatedContext.commercialRules,
    });

    const architecture =
      await this.workspaceArchitectureService.createInitialArchitecture({
        workspaceId,
        sourceDescription,
        operationProfile,
        modelId,
        commercialGoal: workspace.onboardingPrimaryGoal,
      });
    const existingChangeSet =
      await this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.CHANGE_SET,
      );

    if (
      !existingChangeSet ||
      existingChangeSet.payload?.blueprintVersion !==
        architecture.blueprint.version
    ) {
      await this.workspaceArchitectureService.createChangeSet({
        workspaceId,
        blueprint: architecture.blueprint,
      });
    }

    return {
      success: true,
      profileVersion: architecture.profileVersion,
      blueprintVersion: architecture.blueprint.version,
      nextAction: 'Revisar e aprovar a nova arquitetura recomendada.',
    };
  }

  async getDiexArchitecture(workspaceId: string) {
    const [profile, blueprint, changeSet, pageCatalogArtifact] =
      await Promise.all([
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
        this.workspaceArchitectureService.getLatestArtifact(
          workspaceId,
          WorkspaceArchitectureArtifactType.SETUP_STATE,
        ),
      ]);
    const toPublicArtifact = (artifact: typeof profile) =>
      artifact
        ? {
            id: artifact.id,
            status: artifact.status,
            version: artifact.version,
            name: artifact.name,
            summary: artifact.summary,
            payload: artifact.payload,
          }
        : null;
    const parsedPageCatalog = pageCatalogArtifact
      ? workspacePageCatalogStateSchema.safeParse(pageCatalogArtifact.payload)
      : null;

    return {
      profile: toPublicArtifact(profile),
      blueprint: toPublicArtifact(blueprint),
      changeSet: toPublicArtifact(changeSet),
      pageCatalog:
        parsedPageCatalog?.success === true ? parsedPageCatalog.data : null,
    };
  }

  private buildArchitectureSourceDescription({
    workspace,
    context,
  }: {
    workspace: WorkspaceEntity;
    context: DiexWorkspaceContextWorkspaceEntity;
  }): string {
    const sections: string[] = [];
    const addSection = (label: string, value: string | null | undefined) => {
      if (isNonEmptyString(value)) {
        sections.push(`${label}: ${value.trim()}`);
      }
    };

    addSection('Objetivo comercial', workspace.onboardingPrimaryGoal);
    addSection('Empresa e operação', context.businessDescription?.markdown);
    addSection('Cliente ideal', context.idealCustomerProfile?.markdown);
    addSection('Tom de voz', context.toneOfVoice?.markdown);
    addSection('Regras comerciais', context.commercialRules?.markdown);
    addSection('Objeções e respostas', context.objectionPlaybook?.markdown);
    addSection(
      'Concorrência e diferenciais',
      context.competitiveLandscape?.markdown,
    );
    addSection('Promessas proibidas', context.forbiddenClaims?.markdown);
    addSection('Processo atual', workspace.onboardingCurrentProcess);

    return sections.join('\n\n');
  }

  async getDiexPageCatalog(workspaceId: string) {
    return this.workspaceArchitectureService.getPageCatalog(workspaceId);
  }

  async getDiexPageData(workspaceId: string, pageKey: string) {
    return this.workspaceArchitectureService.getPageData(workspaceId, pageKey);
  }

  async createDiexPage({
    workspaceId,
    userId,
    label,
    description,
    aiGenerated,
    renderer,
    icon,
    navigationGroup,
    capabilities,
    dataSources,
    blocks,
  }: {
    workspaceId: string;
    userId: string;
    label: string;
    description?: string;
    aiGenerated?: boolean;
    renderer?: WorkspacePageRenderer;
    icon?: string;
    navigationGroup?: string;
    capabilities?: string[];
    dataSources?: string[];
    blocks?: WorkspaceCustomPageBlockInput[];
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);

    return this.workspaceArchitectureService.createCustomPage({
      workspaceId,
      label,
      description,
      aiGenerated,
      renderer,
      icon,
      navigationGroup,
      capabilities,
      dataSources,
      blocks,
    });
  }

  async updateDiexPage({
    workspaceId,
    userId,
    key,
    label,
    description,
    showInNavigation,
    position,
    renderer,
    icon,
    navigationGroup,
    capabilities,
    dataSources,
    primaryAction,
    blocks,
  }: {
    workspaceId: string;
    userId: string;
    key: string;
    label?: string;
    description?: string;
    showInNavigation?: boolean;
    position?: number;
    renderer?: WorkspacePageRenderer;
    icon?: string;
    navigationGroup?: string;
    capabilities?: string[];
    dataSources?: string[];
    primaryAction?: string;
    blocks?: WorkspaceCustomPageBlockInput[];
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);

    return this.workspaceArchitectureService.updatePage({
      workspaceId,
      key,
      label,
      description,
      showInNavigation,
      position,
      renderer,
      icon,
      navigationGroup,
      capabilities,
      dataSources,
      primaryAction,
      blocks,
    });
  }

  async archiveDiexPage({
    workspaceId,
    userId,
    key,
  }: {
    workspaceId: string;
    userId: string;
    key: string;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);

    return this.workspaceArchitectureService.archivePage(workspaceId, key);
  }

  async restoreDiexPage({
    workspaceId,
    userId,
    key,
  }: {
    workspaceId: string;
    userId: string;
    key: string;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);

    return this.workspaceArchitectureService.restorePage(workspaceId, key);
  }
  async getCommercialReadiness(workspaceId: string) {
    return this.workspaceCommercialReadinessService.getReadiness(workspaceId);
  }

  async completeDiexCommercialOnboarding({
    workspaceId,
    userId,
  }: {
    workspaceId: string;
    userId: string;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const readiness =
      await this.workspaceCommercialReadinessService.getReadiness(workspaceId);

    if (!readiness.ready) {
      throw new BadRequestException(
        `O workspace ainda não atingiu “${readiness.readinessPack.readyLabel}”. Próxima ação: ${readiness.nextAction}.`,
      );
    }

    await this.setOnboardingDiexWorkspacePending({
      userId,
      workspaceId,
      value: false,
    });

    try {
      await this.workspaceArchitectureService.updatePage({
        workspaceId,
        key: 'first-steps',
        showInNavigation: false,
      });
    } catch (error) {
      this.logger.warn(
        `Commercial onboarding completed, but the activation page could not be hidden for workspace ${workspaceId}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    return { success: true, readiness };
  }

  async approveDiexArchitecture({
    workspaceId,
    userId,
    version,
  }: {
    workspaceId: string;
    userId: string;
    version?: number;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const readiness =
      await this.workspaceCommercialReadinessService.getReadiness(workspaceId);
    const discoveryBlocker = readiness.items.find(
      ({ phase, ready, required }) =>
        phase === 'DISCOVERY_REVIEW' && required && !ready,
    );

    if (discoveryBlocker) {
      throw new BadRequestException(
        `Revise a descoberta antes de aprovar a arquitetura: ${discoveryBlocker.label}.`,
      );
    }

    const [changeSet, blueprint] = await Promise.all([
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.CHANGE_SET,
      ),
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
    ]);

    if (!changeSet) {
      throw new BadRequestException(
        'O pacote de mudanças ainda não foi preparado. Recalcule a arquitetura antes de aprovar.',
      );
    }

    const changeSetBlueprintVersion = (
      changeSet.payload as { blueprintVersion?: unknown }
    ).blueprintVersion;

    if (!blueprint || changeSetBlueprintVersion !== blueprint.version) {
      throw new BadRequestException(
        'O pacote de mudanças não corresponde à recomendação mais recente. Recalcule antes de aprovar.',
      );
    }

    if (typeof version !== 'number' || !Number.isInteger(version)) {
      throw new BadRequestException(
        'Informe a versão da arquitetura revisada antes de aprovar.',
      );
    }

    if (version !== changeSet.version) {
      throw new BadRequestException(
        'Esta versão da arquitetura ficou desatualizada. Recarregue a recomendação mais recente antes de aprovar.',
      );
    }

    return this.workspaceArchitectureService.approveChangeSet({
      workspaceId,
      version: changeSet.version,
    });
  }

  async applyDiexArchitecture({
    workspaceId,
    userId,
    version,
  }: {
    workspaceId: string;
    userId: string;
    version?: number;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const [changeSet, blueprint] = await Promise.all([
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.CHANGE_SET,
      ),
      this.workspaceArchitectureService.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
    ]);

    if (!changeSet) {
      throw new BadRequestException('A arquitetura ainda não foi preparada.');
    }

    const changeSetBlueprintVersion = (
      changeSet.payload as { blueprintVersion?: unknown }
    ).blueprintVersion;

    if (!blueprint || changeSetBlueprintVersion !== blueprint.version) {
      throw new BadRequestException(
        'A arquitetura aprovada não corresponde à recomendação mais recente. Recalcule e aprove novamente.',
      );
    }

    if (typeof version !== 'number' || !Number.isInteger(version)) {
      throw new BadRequestException(
        'Informe a versão aprovada antes de publicar a arquitetura.',
      );
    }

    if (version !== changeSet.version) {
      throw new BadRequestException(
        'Esta versão aprovada ficou desatualizada. Recarregue antes de publicar.',
      );
    }

    return this.workspaceArchitectureService.applyApprovedChangeSet({
      workspaceId,
      version: changeSet.version,
    });
  }

  async setCommercialGoal({
    workspaceId,
    userId,
    goal,
  }: {
    workspaceId: string;
    userId: string;
    goal: string;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const normalizedGoal = goal.trim().toUpperCase();

    if (!(COMMERCIAL_GOALS as readonly string[]).includes(normalizedGoal)) {
      throw new BadRequestException('Objetivo comercial inválido.');
    }

    await this.workspaceRepository.update(workspaceId, {
      onboardingPrimaryGoal: normalizedGoal,
    });

    return { saved: true, goal: normalizedGoal };
  }

  async setPrimaryChannel({
    workspaceId,
    userId,
    primaryChannel,
  }: {
    workspaceId: string;
    userId: string;
    primaryChannel: string;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const normalizedPrimaryChannel = primaryChannel.trim().toUpperCase();

    if (
      !(ONBOARDING_PRIMARY_CHANNELS as readonly string[]).includes(
        normalizedPrimaryChannel,
      )
    ) {
      throw new BadRequestException('Forma principal de entrada inválida.');
    }

    await this.workspaceRepository.update(workspaceId, {
      onboardingPrimaryChannel: normalizedPrimaryChannel,
    });

    return { saved: true, primaryChannel: normalizedPrimaryChannel };
  }

  async executeFirstCommercialFlow({
    workspaceId,
    userId,
    workspaceMemberId,
  }: {
    workspaceId: string;
    userId: string;
    workspaceMemberId: string;
  }) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    const readiness =
      await this.workspaceCommercialReadinessService.getReadiness(workspaceId);
    const prerequisitePhases = new Set([
      'DISCOVERY_REVIEW',
      'ARCHITECTURE_APPROVAL',
      'CHANNEL_CONNECTION',
    ]);
    const blockingPrerequisite = readiness.items.find(
      ({ phase, ready, required }) =>
        required && !ready && prerequisitePhases.has(phase),
    );

    if (blockingPrerequisite) {
      throw new BadRequestException(
        `Conclua a ativação antes de executar o primeiro fluxo. Próxima ação: ${blockingPrerequisite.nextAction}`,
      );
    }

    const requiresCompanyLink = readiness.readinessPack.criteria.some(
      ({ key, required }) => key === 'first_company_linked' && required,
    );
    const requiresOpportunity = readiness.readinessPack.criteria.some(
      ({ key, required }) => key === 'first_opportunity_created' && required,
    );
    const opportunityStageOptions = requiresOpportunity
      ? ((
          await this.workspaceArchitectureService.inspectWorkspaceArchitecture(
            workspaceId,
          )
        ).objects
          .find(({ nameSingular }) => nameSingular === 'opportunity')
          ?.fields.find(({ name }) => name === 'stage')?.options ?? [])
      : [];
    const initialOpportunityStage =
      [...opportunityStageOptions]
        .filter(
          ({ value }) => typeof value === 'string' && value.trim().length > 0,
        )
        .sort(
          (left, right) =>
            (typeof left.position === 'number' ? left.position : 0) -
            (typeof right.position === 'number' ? right.position : 0),
        )[0]
        ?.value.trim() ?? null;

    if (requiresOpportunity && !initialOpportunityStage) {
      throw new BadRequestException(
        'O pipeline aprovado não possui uma etapa inicial configurada.',
      );
    }

    return this.cacheLockService.withRenewableLock(
      async () => {
        const repositories = await this.getCommercialRepositories(workspaceId);
        const evidencedConversation = readiness.evidence.firstConversationId
          ? await repositories.conversationRepository.findOne({
              where: { id: readiness.evidence.firstConversationId },
            })
          : null;
        const conversation =
          evidencedConversation ??
          (await this.findFirstInboundCommercialConversation(
            repositories,
            readiness.evidence.primaryChannel,
          ));

        if (!conversation) {
          throw new BadRequestException(
            'A primeira conversa ainda não chegou. Conecte o canal principal e envie uma mensagem real de teste.',
          );
        }

        const team = await repositories.teamRepository.findOne({
          where: { status: 'ACTIVE', isDefault: true },
          relations: { memberships: true },
        });
        const firstActiveMember = (team?.memberships ?? []).find(
          (membership) =>
            membership.isActive === true &&
            typeof membership.workspaceMemberId === 'string',
        );
        const assigneeId =
          conversation.assigneeId ??
          firstActiveMember?.workspaceMemberId ??
          workspaceMemberId;
        const actor = {
          source: FieldActorSource.WORKFLOW,
          workspaceMemberId: null,
          name: 'Onboarding operacional Diex',
          context: {},
        };
        let personId = conversation.personId;

        if (!personId) {
          const personLegacyId = `DIEX_ONBOARDING_FIRST_PERSON:${conversation.id}`;
          let person = await repositories.personRepository.findOne({
            where: { legacyDiexId: personLegacyId },
          });

          if (!person) {
            const contactHandle = conversation.contactHandle?.trim() ?? '';
            const normalizedPhone = normalizePhone(contactHandle);
            const normalizedEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
              contactHandle,
            )
              ? contactHandle.toLowerCase()
              : null;
            const displayName =
              conversation.name?.trim() ||
              normalizedEmail?.split('@')[0] ||
              contactHandle ||
              'Contato da operação';

            await repositories.personRepository.upsert(
              {
                legacyDiexId: personLegacyId,
                name: splitDisplayName(displayName),
                ...(normalizedPhone
                  ? {
                      phones: buildPhonesValue(normalizedPhone),
                      whatsappNormalizedPhone: normalizedPhone,
                      whatsappConsentStatus: 'UNKNOWN',
                    }
                  : {}),
                ...(normalizedEmail
                  ? {
                      emails: {
                        primaryEmail: normalizedEmail,
                        additionalEmails: null,
                      },
                    }
                  : {}),
                doNotContact: false,
                position: 0,
                createdBy: actor,
                updatedBy: actor,
              } as never,
              ['legacyDiexId'],
            );
            person = await repositories.personRepository.findOne({
              where: { legacyDiexId: personLegacyId },
            });
          }

          personId = person?.id ?? null;

          if (personId) {
            await repositories.conversationRepository.update(conversation.id, {
              personId,
              companyId: conversation.companyId ?? person?.companyId ?? null,
            });
          }
        }

        if (!personId) {
          throw new Error('O contato da primeira entrada não pôde ser criado.');
        }

        let companyId = conversation.companyId;

        if (requiresCompanyLink && !companyId) {
          const companyLegacyId = `DIEX_ONBOARDING_FIRST_COMPANY:${conversation.id}`;
          let company = await repositories.companyRepository.findOne({
            where: { legacyDiexId: companyLegacyId },
          });

          if (!company) {
            const companyName =
              conversation.name?.trim() ||
              conversation.contactHandle?.trim() ||
              'Contato sem empresa identificada';
            await repositories.companyRepository.upsert(
              {
                legacyDiexId: companyLegacyId,
                name: `Empresa a identificar — ${companyName}`,
                domainName: null,
                address: null,
                position: 0,
                createdBy: actor,
                updatedBy: actor,
              } as never,
              ['legacyDiexId'],
            );
            company = await repositories.companyRepository.findOne({
              where: { legacyDiexId: companyLegacyId },
            });
          }

          companyId = company?.id ?? null;
          await repositories.conversationRepository.update(conversation.id, {
            companyId,
          });
        }

        if (requiresCompanyLink && !companyId) {
          throw new Error('A empresa do primeiro lead não pôde ser vinculada.');
        }

        if (companyId) {
          await repositories.personRepository.update(personId, {
            companyId,
          });
        }

        if (
          team &&
          (conversation.inboxTeamId !== team.id ||
            conversation.assigneeId !== assigneeId)
        ) {
          await repositories.conversationRepository.update(conversation.id, {
            inboxTeamId: team.id,
            assigneeId,
          });
        }

        let opportunity = conversation.opportunityId
          ? await repositories.opportunityRepository.findOne({
              where: { id: conversation.opportunityId },
            })
          : null;
        const opportunityLegacyId = `DIEX_ONBOARDING_FIRST_OPPORTUNITY:${conversation.id}`;

        if (requiresOpportunity && !opportunity) {
          opportunity = await repositories.opportunityRepository.findOne({
            where: { legacyDiexId: opportunityLegacyId },
          });
        }

        if (requiresOpportunity && !opportunity) {
          if (!initialOpportunityStage) {
            throw new BadRequestException(
              'O pipeline aprovado não possui uma etapa inicial configurada.',
            );
          }

          const inserted = await repositories.opportunityRepository.insert({
            legacyDiexId: opportunityLegacyId,
            name: conversation.name?.trim() || 'Nova oportunidade da operação',
            stage: initialOpportunityStage,
            position: 0,
            pointOfContactId: personId,
            companyId,
            ownerId: assigneeId,
            dealRisk: 'UNKNOWN',
            nextCommercialAction: 'Responder e qualificar o primeiro lead',
            nextCommercialActionAt: new Date(Date.now() + 60 * 60 * 1000),
            createdBy: actor,
            updatedBy: actor,
          });
          const opportunityId = inserted.identifiers[0]?.id as
            | string
            | undefined;

          if (opportunityId) {
            opportunity = await repositories.opportunityRepository.findOne({
              where: { id: opportunityId },
            });
          }
        }

        if (requiresOpportunity && !opportunity) {
          throw new Error('A primeira oportunidade não pôde ser criada.');
        }

        const dueAt = new Date(Date.now() + 60 * 60 * 1000);
        const nextActionTitle = requiresOpportunity
          ? 'Responder e qualificar o primeiro lead'
          : 'Atender a primeira entrada e executar a próxima ação';
        const taskLegacyId = `DIEX_ONBOARDING_FIRST_FOLLOW_UP:${conversation.id}`;
        await repositories.taskRepository.upsert(
          {
            legacyDiexId: taskLegacyId,
            title: nextActionTitle,
            status: 'TODO',
            taskCategory: 'COMMERCIAL',
            dueAt,
            assigneeId,
            diexInboxConversationId: conversation.id,
            createdBy: actor,
            updatedBy: actor,
            bodyV2: {
              markdown: requiresOpportunity
                ? 'Próxima ação criada pelo onboarding. Responda, qualifique a intenção e avance a oportunidade no fluxo aprovado.'
                : 'Próxima ação criada pelo onboarding. Atenda a entrada, classifique a intenção e execute o próximo passo da operação.',
              blocknote: null,
            },
          } as never,
          ['legacyDiexId'],
        );
        const task = await repositories.taskRepository.findOne({
          where: { legacyDiexId: taskLegacyId },
        });

        if (!task) {
          throw new Error('O primeiro follow-up não pôde ser criado.');
        }

        const targets = [
          { targetPersonId: personId },
          companyId ? { targetCompanyId: companyId } : null,
          opportunity ? { targetOpportunityId: opportunity.id } : null,
        ].filter(isDefined);

        for (const target of targets) {
          const existingTarget =
            await repositories.taskTargetRepository.findOne({
              where: { taskId: task.id, ...target },
            });

          if (!existingTarget) {
            await repositories.taskTargetRepository.insert({
              taskId: task.id,
              ...target,
            });
          }
        }

        await repositories.conversationRepository.update(conversation.id, {
          inboxTeamId: team?.id ?? conversation.inboxTeamId,
          assigneeId: assigneeId ?? conversation.assigneeId,
          personId,
          opportunityId: opportunity?.id ?? conversation.opportunityId,
          companyId:
            companyId ?? opportunity?.companyId ?? conversation.companyId,
          followUpDueAt: dueAt,
        });

        if (opportunity) {
          await repositories.opportunityRepository.update(opportunity.id, {
            ownerId: opportunity.ownerId ?? assigneeId,
            companyId: companyId ?? opportunity.companyId,
            nextCommercialAction: nextActionTitle,
            nextCommercialActionAt: dueAt,
          });
        }

        return {
          success: true,
          conversationId: conversation.id,
          opportunityId: opportunity?.id ?? null,
          taskId: task.id,
          assigneeId: assigneeId ?? opportunity?.ownerId ?? null,
          companyLinked: Boolean(companyId),
          nextAction:
            'Executar a triagem com IA e avançar a próxima ação da entrada.',
        };
      },
      `diex:onboarding:first-commercial-flow:${workspaceId}`,
      { ttl: 30_000, renewalIntervalMs: 8_000, maxRetries: 30 },
    );
  }

  private async getCommercialRepositories(
    workspaceId: string,
  ): Promise<CommercialRepositories> {
    const [
      aiActionRepository,
      companyRepository,
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
      this.globalWorkspaceOrmManager.getRepository<CompanyWorkspaceEntity>(
        workspaceId,
        CompanyWorkspaceEntity,
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
      companyRepository,
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

    const inboundConversationIds = new Set(
      inboundMessages.map(({ inboxConversationId }) => inboxConversationId),
    );

    for (const conversation of orderedConversations) {
      if (inboundConversationIds.has(conversation.id)) {
        return conversation;
      }
    }

    return null;
  }

  private async assertWorkspaceOwner(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const [workspaceOwner] = await this.userWorkspaceRepository.find({
      where: { workspaceId },
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (!isDefined(workspaceOwner) || workspaceOwner.userId !== userId) {
      throw new ForbiddenException(
        'Somente o proprietário do workspace pode alterar a ativação da operação.',
      );
    }
  }

  private async persistGeneratedWorkspaceContext({
    workspaceId,
    generatedContext,
  }: {
    workspaceId: string;
    generatedContext: GeneratedWorkspaceContext;
  }): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<DiexWorkspaceContextWorkspaceEntity>(
          workspaceId,
          'diexWorkspaceContext',
          { shouldBypassPermissionChecks: true },
        );
      const [existingContext] = await repository.find({
        order: { createdAt: 'ASC' },
        take: 1,
      });
      // A field the description never covered stays empty rather than null, so
      // the First Steps card can mark it "vazio" and ask the operator to fill
      // it instead of the whole onboarding failing.
      const listText = (values: string[]) =>
        values
          .map((value) => value.trim())
          .filter(Boolean)
          .join('; ');
      const composeSections = (
        sections: Array<[label: string, value: string | null | undefined]>,
      ) =>
        sections
          .filter(([, value]) => isNonEmptyString(value))
          .map(([label, value]) => `${label}: ${value?.trim()}`)
          .join('\n\n')
          .slice(0, 4_000);
      const completeBusinessDescription = composeSections([
        ['Resumo', generatedContext.businessDescription],
        ['Segmento', generatedContext.segment],
        ['Modelos de negócio', listText(generatedContext.businessModels)],
        ['Receitas', listText(generatedContext.revenueModels)],
        ['Produtos e ofertas', listText(generatedContext.productsAndServices)],
        ['Problemas resolvidos', listText(generatedContext.customerProblems)],
        ['Canais de aquisição', listText(generatedContext.acquisitionChannels)],
        ['Processo comercial', generatedContext.salesProcess],
        ['Ciclo comercial', generatedContext.salesCycle],
        ['Responsáveis', listText(generatedContext.teamAndRoles)],
        ['Entrega', generatedContext.deliveryProcess],
        ['Atendimento', generatedContext.customerServiceProcess],
        ['Customer Success', generatedContext.customerSuccessProcess],
        ['Renovações', generatedContext.renewalProcess],
        ['Métricas', listText(generatedContext.relevantMetrics)],
        ['Integrações', listText(generatedContext.requiredIntegrations)],
        ['Objetivos', listText(generatedContext.priorityObjectives)],
      ]);
      const completeCommercialRules = composeSections([
        ['Regras comerciais', generatedContext.commercialRules],
        ['CTA permitido', listText(generatedContext.callsToAction)],
        ['Responsabilidades', listText(generatedContext.responsibilityRules)],
        ['SLA', listText(generatedContext.slaTargets)],
        ['Aprovações', listText(generatedContext.approvalRules)],
        ['Obrigações e riscos', listText(generatedContext.obligationsAndRisks)],
      ]);
      const completeForbiddenClaims = composeSections([
        ['Promessas proibidas', generatedContext.forbiddenClaims],
        ['Restrições', listText(generatedContext.restrictions)],
      ]);
      const richTextFields = {
        businessDescription: {
          markdown: completeBusinessDescription,
        },
        idealCustomerProfile: {
          markdown: generatedContext.idealCustomerProfile ?? '',
        },
        toneOfVoice: { markdown: generatedContext.toneOfVoice ?? '' },
        commercialRules: { markdown: completeCommercialRules },
        objectionPlaybook: {
          markdown: generatedContext.objectionPlaybook ?? '',
        },
        competitiveLandscape: {
          markdown: generatedContext.competitiveLandscape ?? '',
        },
        forbiddenClaims: { markdown: completeForbiddenClaims },
      };

      if (isDefined(existingContext)) {
        await repository.save({
          ...existingContext,
          ...richTextFields,
          name: 'Contexto inicial gerado pela IA',
          status: WorkspaceContextStatus.DRAFT,
          reviewedAt: null,
        });
        return;
      }

      await repository.save(
        repository.create({
          ...richTextFields,
          name: 'Contexto inicial gerado pela IA',
          status: WorkspaceContextStatus.DRAFT,
          reviewedAt: null,
        }),
      );
    }, authContext);
  }

  private async ensureInitialOperatingTeam({
    workspaceId,
    workspaceMemberId,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
  }): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.cacheLockService.withRenewableLock(
      () =>
        this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
          const [teamRepository, membershipRepository] = await Promise.all([
            this.globalWorkspaceOrmManager.getRepository<InboxTeamWorkspaceEntity>(
              workspaceId,
              InboxTeamWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            ),
            this.globalWorkspaceOrmManager.getRepository<InboxTeamMemberWorkspaceEntity>(
              workspaceId,
              InboxTeamMemberWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            ),
          ]);
          let team = await teamRepository.findOne({
            where: { status: 'ACTIVE', isDefault: true },
          });

          if (!team) {
            team = await teamRepository.findOne({
              where: { key: 'operacao-principal' },
            });
          }

          if (!team) {
            team = await teamRepository.save(
              teamRepository.create({
                name: 'Operação principal',
                key: 'operacao-principal',
                description:
                  'Fila inicial editável para distribuir entradas e controlar o SLA.',
                status: 'ACTIVE',
                routingStrategy: 'MANUAL',
                defaultResponseSlaMinutes: 60,
                isDefault: true,
              }),
            );
          }

          const existingMembership = await membershipRepository.findOne({
            where: {
              inboxTeamId: team.id,
              workspaceMemberId,
            },
          });

          if (!existingMembership) {
            await membershipRepository.save(
              membershipRepository.create({
                name: `Líder inicial - ${workspaceMemberId.slice(0, 8)}`,
                memberRole: 'LEAD',
                isActive: true,
                joinedAt: new Date().toISOString(),
                inboxTeamId: team.id,
                workspaceMemberId,
              }),
            );
          }
        }, authContext),
      `diex:onboarding-initial-team:${workspaceId}`,
      { ttl: 15_000, renewalIntervalMs: 4_000, maxRetries: 20 },
    );
  }

  private async seedGeneratedOffers({
    workspaceId,
    productsAndServices,
    idealCustomerProfile,
    objectionPlaybook,
    commercialRules,
  }: {
    workspaceId: string;
    productsAndServices: string[];
    idealCustomerProfile: string | null;
    objectionPlaybook: string | null;
    commercialRules: string | null;
  }): Promise<void> {
    const offerRepository =
      await this.globalWorkspaceOrmManager.getRepository<OfferWorkspaceEntity>(
        workspaceId,
        OfferWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
    const actor = {
      source: FieldActorSource.WORKFLOW,
      workspaceMemberId: null,
      name: 'Onboarding comercial Diex',
      context: {},
    };

    for (const [index, product] of productsAndServices
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .slice(0, 12)
      .entries()) {
      const name = product.slice(0, 160);
      const legacyDiexId = `DIEX_ONBOARDING_OFFER:${workspaceId}:${index}`;
      const existing = await offerRepository.findOne({
        where: { legacyDiexId },
      });
      const generatedOffer = {
        name,
        pricingModel: OfferPricingModel.NEGOTIABLE,
        basePrice: null,
        valueProposition: {
          markdown: `Oferta identificada no onboarding: ${name}`,
        },
        idealCustomerProfile: idealCustomerProfile
          ? { markdown: idealCustomerProfile }
          : null,
        differentiators: null,
        objectionPlaybook: objectionPlaybook
          ? { markdown: objectionPlaybook }
          : null,
        qualificationCriteria: commercialRules
          ? { markdown: commercialRules }
          : null,
      };

      if (existing) {
        if (existing.status === OfferStatus.DRAFT) {
          await offerRepository.save({
            ...existing,
            ...generatedOffer,
            updatedBy: actor,
          });
        }

        continue;
      }

      await offerRepository.save(
        offerRepository.create({
          legacyDiexId,
          ...generatedOffer,
          // AI-extracted offers are recommendations. They only become usable by
          // agents and readiness after the workspace owner reviews them.
          status: OfferStatus.DRAFT,
          createdBy: actor,
          updatedBy: actor,
        }),
      );
    }
  }

  private isWorkspaceActivationPending(workspace: WorkspaceEntity) {
    return (
      workspace.activationStatus ===
        WorkspaceActivationStatus.PENDING_CREATION ||
      workspace.activationStatus === WorkspaceActivationStatus.ONGOING_CREATION
    );
  }

  async getOnboardingStatus({
    user,
    workspaceId,
  }: {
    user: UserEntity;
    workspaceId: string;
  }): Promise<OnboardingStatus | null> {
    // We always read the workspace directly from the database here (bypassing
    // the per-instance core entity cache) so that onboardingStatus reflects the
    // freshest activationStatus right after activateWorkspace, even when a
    // sibling server instance still has a stale cached workspace.
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!isDefined(workspace)) {
      return null;
    }

    if (this.isWorkspaceActivationPending(workspace)) {
      // A non-admin cannot activate their own workspace while the approval gate
      // is on, so showing them the activation step would be a dead end: they get
      // the waiting screen until an admin approves and activates for them.
      if (
        this.diexConfigService.get('IS_WORKSPACE_APPROVAL_REQUIRED') &&
        user.canAccessFullAdminPanel !== true
      ) {
        return OnboardingStatus.WORKSPACE_APPROVAL_PENDING;
      }

      return OnboardingStatus.WORKSPACE_ACTIVATION;
    }

    const userVars = await this.userVarsService.getAll({
      userId: user.id,
      workspaceId: workspace.id,
    });

    const isProfileCreationPending =
      userVars.get(OnboardingStepKeys.ONBOARDING_CREATE_PROFILE_PENDING) ===
      true;

    const isConnectAccountPending =
      userVars.get(OnboardingStepKeys.ONBOARDING_CONNECT_ACCOUNT_PENDING) ===
      true;

    const isInstallAppsPending =
      userVars.get(OnboardingStepKeys.ONBOARDING_INSTALL_APPS_PENDING) === true;

    const isInviteTeamPending =
      userVars.get(OnboardingStepKeys.ONBOARDING_INVITE_TEAM_PENDING) === true;

    if (isConnectAccountPending) {
      return OnboardingStatus.SYNC_EMAIL;
    }

    if (
      userVars.get(OnboardingStepKeys.ONBOARDING_DIEX_WORKSPACE_PENDING) ===
      true
    ) {
      return OnboardingStatus.DIEX_WORKSPACE_SETUP;
    }

    if (isInstallAppsPending) {
      return OnboardingStatus.APPS_INSTALLATION;
    }

    if (isProfileCreationPending) {
      return OnboardingStatus.PROFILE_CREATION;
    }

    if (isInviteTeamPending) {
      return OnboardingStatus.INVITE_TEAM;
    }

    if (
      await this.billingService.isSubscriptionIncompleteOnboardingStatus(
        workspace.id,
      )
    ) {
      return OnboardingStatus.PLAN_REQUIRED;
    }

    return OnboardingStatus.COMPLETED;
  }

  async isOnboardingInviteTeamPending({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<boolean> {
    return (
      (await this.userVarsService.get({
        workspaceId,
        key: OnboardingStepKeys.ONBOARDING_INVITE_TEAM_PENDING,
      })) === true
    );
  }

  async setOnboardingConnectAccountPending(
    {
      userId,
      workspaceId,
      value,
    }: {
      userId: string;
      workspaceId: string;
      value: boolean;
    },
    queryRunner?: QueryRunner,
  ) {
    if (!value) {
      await this.userVarsService.delete(
        {
          userId,
          workspaceId,
          key: OnboardingStepKeys.ONBOARDING_CONNECT_ACCOUNT_PENDING,
        },
        queryRunner,
      );

      return;
    }

    await this.userVarsService.set(
      {
        userId,
        workspaceId: workspaceId,
        key: OnboardingStepKeys.ONBOARDING_CONNECT_ACCOUNT_PENDING,
        value: true,
      },
      queryRunner,
    );
  }

  async setOnboardingDiexWorkspacePending(
    {
      userId,
      workspaceId,
      value,
    }: {
      userId: string;
      workspaceId: string;
      value: boolean;
    },
    queryRunner?: QueryRunner,
  ) {
    if (!value) {
      await this.userVarsService.delete(
        {
          userId,
          workspaceId,
          key: OnboardingStepKeys.ONBOARDING_DIEX_WORKSPACE_PENDING,
        },
        queryRunner,
      );

      return;
    }

    await this.userVarsService.set(
      {
        userId,
        workspaceId,
        key: OnboardingStepKeys.ONBOARDING_DIEX_WORKSPACE_PENDING,
        value: true,
      },
      queryRunner,
    );
  }

  async completeOnboardingConnectAccountStep({
    userId,
    workspaceId,
  }: {
    userId: string;
    workspaceId: string;
  }) {
    const hasClaimedConnectAccountStep =
      await this.claimOnboardingConnectAccountStep({ userId, workspaceId });

    if (!hasClaimedConnectAccountStep) {
      return;
    }

    await this.creditImportContactsRewardForFirstWorkspaceUser({ workspaceId });
  }

  private async isFirstWorkspaceUser({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<boolean> {
    const workspaceUserCount = await this.userWorkspaceRepository.countBy({
      workspaceId,
    });

    return workspaceUserCount === 1;
  }

  private async claimOnboardingConnectAccountStep({
    userId,
    workspaceId,
  }: {
    userId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const affectedRows = await this.userVarsService.delete({
      userId,
      workspaceId,
      key: OnboardingStepKeys.ONBOARDING_CONNECT_ACCOUNT_PENDING,
    });

    return isDefined(affectedRows) && affectedRows > 0;
  }

  private async creditImportContactsRewardForFirstWorkspaceUser({
    workspaceId,
  }: {
    workspaceId: string;
  }) {
    try {
      const isFirstWorkspaceUser = await this.isFirstWorkspaceUser({
        workspaceId,
      });

      if (!isFirstWorkspaceUser) {
        return;
      }

      await this.billingCreditService.creditWorkspaceBalance({
        workspaceId,
        amountMicro: this.diexConfigService.get(
          'ONBOARDING_IMPORT_CONTACTS_CREDITS_REWARD',
        ),
      });
    } catch (error) {
      this.logger.error(
        `Failed to credit onboarding import-contacts reward for workspace ${workspaceId}`,
        error,
      );
    }
  }

  async setOnboardingInstallAppsPending(
    {
      userId,
      workspaceId,
      value,
    }: {
      userId: string;
      workspaceId: string;
      value: boolean;
    },
    queryRunner?: QueryRunner,
  ) {
    if (!value) {
      await this.userVarsService.delete(
        {
          userId,
          workspaceId,
          key: OnboardingStepKeys.ONBOARDING_INSTALL_APPS_PENDING,
        },
        queryRunner,
      );

      return;
    }

    await this.userVarsService.set(
      {
        userId,
        workspaceId,
        key: OnboardingStepKeys.ONBOARDING_INSTALL_APPS_PENDING,
        value: true,
      },
      queryRunner,
    );
  }

  async triggerInstallAppsOnboardingStep({
    userId,
    workspaceId,
    universalIdentifiers,
  }: {
    userId: string;
    workspaceId: string;
    universalIdentifiers: string[];
  }) {
    const hasClaimedInstallAppsStep = await this.claimInstallAppsOnboardingStep(
      { userId, workspaceId },
    );

    if (!hasClaimedInstallAppsStep) {
      return;
    }

    const installableUniversalIdentifiers = universalIdentifiers.filter(
      (universalIdentifier) =>
        ONBOARDING_INSTALLABLE_APP_UNIVERSAL_IDENTIFIERS.includes(
          universalIdentifier,
        ),
    );

    if (installableUniversalIdentifiers.length === 0) {
      return;
    }

    await this.messageQueueService.add<InstallOnboardingAppsJobData>(
      INSTALL_ONBOARDING_APPS_JOB_NAME,
      { workspaceId, universalIdentifiers: installableUniversalIdentifiers },
      { id: `${INSTALL_ONBOARDING_APPS_JOB_NAME}-${workspaceId}` },
    );
  }

  private async claimInstallAppsOnboardingStep({
    userId,
    workspaceId,
  }: {
    userId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const affectedRows = await this.userVarsService.delete({
      userId,
      workspaceId,
      key: OnboardingStepKeys.ONBOARDING_INSTALL_APPS_PENDING,
    });

    return isDefined(affectedRows) && affectedRows > 0;
  }

  async creditInstallAppsReward({
    workspaceId,
    rewardAppsCount,
  }: {
    workspaceId: string;
    rewardAppsCount: number;
  }) {
    try {
      await this.billingCreditService.creditWorkspaceBalance({
        workspaceId,
        amountMicro:
          this.diexConfigService.get(
            'ONBOARDING_INSTALL_APPS_CREDITS_REWARD_PER_APP',
          ) * rewardAppsCount,
      });
    } catch (error) {
      this.logger.error(
        `Failed to credit onboarding install-apps reward for workspace ${workspaceId}`,
        error,
      );
    }
  }

  async setOnboardingInviteTeamPending(
    {
      workspaceId,
      value,
    }: {
      workspaceId: string;
      value: boolean;
    },
    queryRunner?: QueryRunner,
  ) {
    if (!value) {
      await this.userVarsService.delete(
        {
          workspaceId,
          key: OnboardingStepKeys.ONBOARDING_INVITE_TEAM_PENDING,
        },
        queryRunner,
      );

      return;
    }

    await this.userVarsService.set(
      {
        workspaceId,
        key: OnboardingStepKeys.ONBOARDING_INVITE_TEAM_PENDING,
        value: true,
      },
      queryRunner,
    );
  }

  async setOnboardingCreateProfilePending(
    {
      userId,
      workspaceId,
      value,
    }: {
      userId: string;
      workspaceId: string;
      value: boolean;
    },
    queryRunner?: QueryRunner,
  ) {
    if (!value) {
      await this.userVarsService.delete(
        {
          userId,
          workspaceId,
          key: OnboardingStepKeys.ONBOARDING_CREATE_PROFILE_PENDING,
        },
        queryRunner,
      );

      return;
    }

    await this.userVarsService.set(
      {
        userId,
        workspaceId,
        key: OnboardingStepKeys.ONBOARDING_CREATE_PROFILE_PENDING,
        value: true,
      },
      queryRunner,
    );
  }

  async completeOnboardingProfileStepIfNameProvided({
    userId,
    workspaceId,
    firstName,
    lastName,
  }: {
    userId?: string;
    workspaceId: string;
    firstName?: string;
    lastName?: string;
  }) {
    if (!isDefined(userId)) {
      return;
    }

    const hasProvidedNamePart =
      (isDefined(firstName) && firstName !== '') ||
      (isDefined(lastName) && lastName !== '');
    if (!hasProvidedNamePart) {
      return;
    }

    await this.setOnboardingCreateProfilePending({
      userId,
      workspaceId,
      value: false,
    });
  }
}
