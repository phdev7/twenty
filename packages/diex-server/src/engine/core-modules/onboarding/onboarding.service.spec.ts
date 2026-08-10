import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { BillingCreditService } from 'src/engine/core-modules/billing/services/billing-credit.service';
import { BillingUsageService } from 'src/engine/core-modules/billing/services/billing-usage.service';
import { AiBillingService } from 'src/engine/metadata-modules/ai/ai-billing/services/ai-billing.service';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { BillingService } from 'src/engine/core-modules/billing/services/billing.service';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { getQueueToken } from 'src/engine/core-modules/message-queue/utils/get-queue-token.util';
import { ONBOARDING_INSTALLABLE_APP_UNIVERSAL_IDENTIFIERS } from 'src/engine/core-modules/onboarding/constants/onboarding-installable-app-universal-identifiers';
import { INSTALL_ONBOARDING_APPS_JOB_NAME } from 'src/engine/core-modules/onboarding/jobs/install-onboarding-apps.job-constants';
import {
  OnboardingService,
  OnboardingStepKeys,
} from 'src/engine/core-modules/onboarding/onboarding.service';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { UserVarsService } from 'src/engine/core-modules/user/user-vars/services/user-vars.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let userVarsService: UserVarsService;
  let billingCreditService: BillingCreditService;
  let diexConfigService: DiexConfigService;
  let messageQueueService: MessageQueueService;
  let userWorkspaceRepository: Repository<UserWorkspaceEntity>;

  const userId = 'user-id';
  const workspaceId = 'workspace-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: BillingService,
          useValue: {
            isSubscriptionIncompleteOnboardingStatus: jest.fn(),
          },
        },
        {
          provide: BillingCreditService,
          useValue: {
            creditWorkspaceBalance: jest.fn(),
          },
        },
        {
          provide: BillingUsageService,
          useValue: {
            hasAvailableCreditsOrThrow: jest.fn(),
          },
        },
        {
          provide: AiBillingService,
          useValue: {
            calculateAndBillUsage: jest.fn(),
          },
        },
        {
          provide: AiModelRegistryService,
          useValue: {
            validateModelAvailability: jest.fn(),
            resolveModelForAgent: jest.fn(),
          },
        },
        {
          provide: GlobalWorkspaceOrmManager,
          useValue: {
            executeInWorkspaceContext: jest.fn(),
            getRepository: jest.fn(),
          },
        },
        {
          provide: WorkspaceArchitectureService,
          useValue: {
            createInitialArchitecture: jest.fn(),
          },
        },
        {
          provide: UserVarsService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: DiexConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkspaceEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserWorkspaceEntity),
          useValue: {
            countBy: jest.fn(),
          },
        },
        {
          provide: getQueueToken(MessageQueue.workspaceQueue),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    userVarsService = module.get<UserVarsService>(UserVarsService);
    billingCreditService =
      module.get<BillingCreditService>(BillingCreditService);
    diexConfigService = module.get<DiexConfigService>(DiexConfigService);
    messageQueueService = module.get<MessageQueueService>(
      getQueueToken(MessageQueue.workspaceQueue),
    );
    userWorkspaceRepository = module.get<Repository<UserWorkspaceEntity>>(
      getRepositoryToken(UserWorkspaceEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('completeOnboardingConnectAccountStep', () => {
    it('should credit the import-contacts reward when the step was claimed by the first workspace user', async () => {
      jest.spyOn(userVarsService, 'delete').mockResolvedValue(1);
      jest.spyOn(userWorkspaceRepository, 'countBy').mockResolvedValue(1);
      jest.spyOn(diexConfigService, 'get').mockReturnValue(2_000_000);

      await service.completeOnboardingConnectAccountStep({
        userId,
        workspaceId,
      });

      expect(userVarsService.delete).toHaveBeenCalledWith({
        userId,
        workspaceId,
        key: OnboardingStepKeys.ONBOARDING_CONNECT_ACCOUNT_PENDING,
      });
      expect(billingCreditService.creditWorkspaceBalance).toHaveBeenCalledWith({
        workspaceId,
        amountMicro: 2_000_000,
      });
    });

    it('should claim the step but not credit when the workspace has more than one member', async () => {
      jest.spyOn(userVarsService, 'delete').mockResolvedValue(1);
      jest.spyOn(userWorkspaceRepository, 'countBy').mockResolvedValue(2);

      await service.completeOnboardingConnectAccountStep({
        userId,
        workspaceId,
      });

      expect(userVarsService.delete).toHaveBeenCalledWith({
        userId,
        workspaceId,
        key: OnboardingStepKeys.ONBOARDING_CONNECT_ACCOUNT_PENDING,
      });
      expect(
        billingCreditService.creditWorkspaceBalance,
      ).not.toHaveBeenCalled();
    });

    it('should not credit anything when the step was already consumed', async () => {
      jest.spyOn(userVarsService, 'delete').mockResolvedValue(0);

      await service.completeOnboardingConnectAccountStep({
        userId,
        workspaceId,
      });

      expect(
        billingCreditService.creditWorkspaceBalance,
      ).not.toHaveBeenCalled();
    });

    it('should credit only once when two completions race for the same step', async () => {
      jest
        .spyOn(userVarsService, 'delete')
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      jest.spyOn(userWorkspaceRepository, 'countBy').mockResolvedValue(1);
      jest.spyOn(diexConfigService, 'get').mockReturnValue(2_000_000);

      await Promise.all([
        service.completeOnboardingConnectAccountStep({ userId, workspaceId }),
        service.completeOnboardingConnectAccountStep({ userId, workspaceId }),
      ]);

      expect(billingCreditService.creditWorkspaceBalance).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should not throw when crediting fails', async () => {
      jest.spyOn(userVarsService, 'delete').mockResolvedValue(1);
      jest.spyOn(userWorkspaceRepository, 'countBy').mockResolvedValue(1);
      jest.spyOn(diexConfigService, 'get').mockReturnValue(2_000_000);
      jest
        .spyOn(billingCreditService, 'creditWorkspaceBalance')
        .mockRejectedValue(new Error('billing failure'));

      await expect(
        service.completeOnboardingConnectAccountStep({
          userId,
          workspaceId,
        }),
      ).resolves.not.toThrow();
    });

    it('should not throw when the workspace member count is unavailable', async () => {
      jest.spyOn(userVarsService, 'delete').mockResolvedValue(1);
      jest
        .spyOn(userWorkspaceRepository, 'countBy')
        .mockRejectedValue(new Error('database failure'));

      await expect(
        service.completeOnboardingConnectAccountStep({
          userId,
          workspaceId,
        }),
      ).resolves.not.toThrow();

      expect(
        billingCreditService.creditWorkspaceBalance,
      ).not.toHaveBeenCalled();
    });
  });

  describe('triggerInstallAppsOnboardingStep', () => {
    const [callRecorderId, peopleDataLabsId] =
      ONBOARDING_INSTALLABLE_APP_UNIVERSAL_IDENTIFIERS;

    it('should claim the step and enqueue the install job for the installable apps without crediting', async () => {
      jest.spyOn(userVarsService, 'delete').mockResolvedValue(1);

      await service.triggerInstallAppsOnboardingStep({
        userId,
        workspaceId,
        universalIdentifiers: [callRecorderId, peopleDataLabsId],
      });

      expect(userVarsService.delete).toHaveBeenCalledWith({
        userId,
        workspaceId,
        key: OnboardingStepKeys.ONBOARDING_INSTALL_APPS_PENDING,
      });
      expect(messageQueueService.add).toHaveBeenCalledWith(
        INSTALL_ONBOARDING_APPS_JOB_NAME,
        {
          workspaceId,
          universalIdentifiers: [callRecorderId, peopleDataLabsId],
        },
        { id: `${INSTALL_ONBOARDING_APPS_JOB_NAME}-${workspaceId}` },
      );
      expect(
        billingCreditService.creditWorkspaceBalance,
      ).not.toHaveBeenCalled();
    });

    it('should not enqueue anything when the step was already consumed', async () => {
      jest.spyOn(userVarsService, 'delete').mockResolvedValue(0);

      await service.triggerInstallAppsOnboardingStep({
        userId,
        workspaceId,
        universalIdentifiers: [callRecorderId],
      });

      expect(messageQueueService.add).not.toHaveBeenCalled();
    });

    it('should claim the step but not enqueue when no installable app was selected', async () => {
      jest.spyOn(userVarsService, 'delete').mockResolvedValue(1);

      await service.triggerInstallAppsOnboardingStep({
        userId,
        workspaceId,
        universalIdentifiers: ['00000000-0000-0000-0000-000000000000'],
      });

      expect(userVarsService.delete).toHaveBeenCalled();
      expect(messageQueueService.add).not.toHaveBeenCalled();
    });
  });

  describe('creditInstallAppsReward', () => {
    it('should credit the reward per installed app', async () => {
      jest.spyOn(diexConfigService, 'get').mockReturnValue(1_000_000);

      await service.creditInstallAppsReward({
        workspaceId,
        rewardAppsCount: 2,
      });

      expect(billingCreditService.creditWorkspaceBalance).toHaveBeenCalledWith({
        workspaceId,
        amountMicro: 2_000_000,
      });
    });

    it('should not throw when crediting fails', async () => {
      jest.spyOn(diexConfigService, 'get').mockReturnValue(1_000_000);
      jest
        .spyOn(billingCreditService, 'creditWorkspaceBalance')
        .mockRejectedValue(new Error('billing failure'));

      await expect(
        service.creditInstallAppsReward({
          workspaceId,
          rewardAppsCount: 1,
        }),
      ).resolves.not.toThrow();
    });
  });
});
