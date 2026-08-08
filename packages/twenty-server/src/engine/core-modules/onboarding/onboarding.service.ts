import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type LanguageModelUsage, Output, generateText } from 'ai';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { type QueryRunner, Repository } from 'typeorm';

import { BillingCreditService } from 'src/engine/core-modules/billing/services/billing-credit.service';
import { BillingUsageService } from 'src/engine/core-modules/billing/services/billing-usage.service';
import { BillingService } from 'src/engine/core-modules/billing/services/billing.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { ONBOARDING_INSTALLABLE_APP_UNIVERSAL_IDENTIFIERS } from 'src/engine/core-modules/onboarding/constants/onboarding-installable-app-universal-identifiers';
import { OnboardingStatus } from 'src/engine/core-modules/onboarding/enums/onboarding-status.enum';
import {
  INSTALL_ONBOARDING_APPS_JOB_NAME,
  type InstallOnboardingAppsJobData,
} from 'src/engine/core-modules/onboarding/jobs/install-onboarding-apps.job-constants';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserVarsService } from 'src/engine/core-modules/user/user-vars/services/user-vars.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import { AiBillingService } from 'src/engine/metadata-modules/ai/ai-billing/services/ai-billing.service';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type DiexWorkspaceContextWorkspaceEntity } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.workspace-entity';
import { WorkspaceContextStatus } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.standard-object-definition';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import {
  type GeneratedWorkspaceContext,
  generatedWorkspaceContextSchema,
  normalizeGeneratedWorkspaceContext,
} from 'src/engine/core-modules/onboarding/types/generated-workspace-context.schema';

export enum OnboardingStepKeys {
  ONBOARDING_CONNECT_ACCOUNT_PENDING = 'ONBOARDING_CONNECT_ACCOUNT_PENDING',
  ONBOARDING_INVITE_TEAM_PENDING = 'ONBOARDING_INVITE_TEAM_PENDING',
  ONBOARDING_CREATE_PROFILE_PENDING = 'ONBOARDING_CREATE_PROFILE_PENDING',
  ONBOARDING_INSTALL_APPS_PENDING = 'ONBOARDING_INSTALL_APPS_PENDING',
}

export type OnboardingKeyValueTypeMap = {
  [OnboardingStepKeys.ONBOARDING_CONNECT_ACCOUNT_PENDING]: boolean;
  [OnboardingStepKeys.ONBOARDING_INVITE_TEAM_PENDING]: boolean;
  [OnboardingStepKeys.ONBOARDING_CREATE_PROFILE_PENDING]: boolean;
  [OnboardingStepKeys.ONBOARDING_INSTALL_APPS_PENDING]: boolean;
};

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly billingCreditService: BillingCreditService,
    private readonly billingUsageService: BillingUsageService,
    private readonly aiBillingService: AiBillingService,
    private readonly aiModelRegistryService: AiModelRegistryService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
    private readonly userVarsService: UserVarsService<OnboardingKeyValueTypeMap>,
    private readonly twentyConfigService: TwentyConfigService,
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
    workspace,
  }: {
    operationDescription: string;
    userId: string;
    userWorkspaceId: string;
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

    await this.billingUsageService.hasAvailableCreditsOrThrow(workspace.id);

    const resolvedModelId = workspace.fastModel;

    this.aiModelRegistryService.validateModelAvailability(
      resolvedModelId,
      workspace,
    );

    const registeredModel =
      await this.aiModelRegistryService.resolveModelForAgent({
        modelId: resolvedModelId,
      });
    let usage: LanguageModelUsage | undefined;
    let generatedContext: GeneratedWorkspaceContext | undefined;

    try {
      const result = await generateText({
        model: registeredModel.model,
        system: [
          'Você é o extrator de perfil operacional do Arquiteto de Workspace do Diex CRM.',
          'Transforme a descrição livre em fatos estruturados úteis para montar um workspace.',
          'Resuma somente fatos presentes na descrição do usuário e preserve o sentido original.',
          'Não invente preços, concorrentes, regras, garantias ou características.',
          'Campos textuais sem evidência devem ser nulos; listas sem evidência devem ficar vazias.',
          'Toda inferência reversível deve entrar em hypotheses e toda lacuna relevante em unconfirmedInformation.',
          'Não bloqueie a recomendação apenas por haver lacunas.',
          'Use português do Brasil, texto direto e útil para agentes comerciais de IA.',
        ].join(' '),
        prompt: `Descrição da operação:\n\n${operationDescription.trim()}`,
        output: Output.object({ schema: generatedWorkspaceContextSchema }),
      });

      usage = result.usage;

      if (!isDefined(result.output)) {
        throw new Error('AI did not return the workspace context.');
      }

      generatedContext = result.output;

      await this.persistGeneratedWorkspaceContext({
        workspaceId: workspace.id,
        generatedContext,
      });
      await this.workspaceArchitectureService.createInitialArchitecture({
        workspaceId: workspace.id,
        sourceDescription: operationDescription.trim(),
        operationProfile: normalizeGeneratedWorkspaceContext(
          generatedContext,
          operationDescription.trim(),
        ),
        modelId: resolvedModelId,
      });
    } finally {
      if (isDefined(usage)) {
        void this.aiBillingService.calculateAndBillUsage(
          resolvedModelId,
          {
            usage,
            cacheCreationTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
          },
          workspace.id,
          UsageOperationType.AI_WORKFLOW_TOKEN,
          null,
          userWorkspaceId,
        );
      }
    }

    if (!isDefined(generatedContext)) {
      throw new Error('AI did not generate the workspace context.');
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
      const richTextFields = {
        businessDescription: {
          markdown: generatedContext.businessDescription ?? '',
        },
        idealCustomerProfile: {
          markdown: generatedContext.idealCustomerProfile ?? '',
        },
        toneOfVoice: { markdown: generatedContext.toneOfVoice ?? '' },
        commercialRules: { markdown: generatedContext.commercialRules ?? '' },
        objectionPlaybook: {
          markdown: generatedContext.objectionPlaybook ?? '',
        },
        competitiveLandscape: {
          markdown: generatedContext.competitiveLandscape ?? '',
        },
        forbiddenClaims: { markdown: generatedContext.forbiddenClaims ?? '' },
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
        this.twentyConfigService.get('IS_WORKSPACE_APPROVAL_REQUIRED') &&
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
        amountMicro: this.twentyConfigService.get(
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
          this.twentyConfigService.get(
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
