import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'diex-shared/utils';

import { NodeEnvironment } from 'src/engine/core-modules/diex-config/interfaces/node-environment.interface';
import { SupportDriver } from 'src/engine/core-modules/diex-config/interfaces/support.interface';

import { MaintenanceModeService } from 'src/engine/core-modules/admin-panel/maintenance-mode.service';
import {
  type ClientAiModelConfig,
  type ClientConfig,
} from 'src/engine/core-modules/client-config/client-config.entity';
import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { EmailingDomainDriver } from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain-driver.type';
import { PUBLIC_FEATURE_FLAGS } from 'src/engine/core-modules/feature-flag/constants/public-feature-flag.const';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { toDisplayCredits } from 'src/engine/core-modules/usage/utils/to-display-credits.util';
import {
  AUTO_SELECT_FAST_MODEL_ID,
  AUTO_SELECT_SMART_MODEL_ID,
  ENTERPRISE_INSTANCE_TYPE,
} from 'diex-shared/constants';
import { MODEL_FAMILY_LABELS } from 'src/engine/metadata-modules/ai/ai-models/constants/model-family-labels.const';
import { getNativeModelCapabilities } from 'src/engine/metadata-modules/ai/ai-models/utils/get-native-model-capabilities.util';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';

@Injectable()
export class ClientConfigService {
  constructor(
    private diexConfigService: DiexConfigService,
    private domainServerConfigService: DomainServerConfigService,
    private aiModelRegistryService: AiModelRegistryService,
    private maintenanceModeService: MaintenanceModeService,
  ) {}

  private isCloudflareIntegrationEnabled(): boolean {
    return (
      !!this.diexConfigService.get('CLOUDFLARE_API_KEY') &&
      !!this.diexConfigService.get('CLOUDFLARE_ZONE_ID')
    );
  }

  async getClientConfig(): Promise<ClientConfig> {
    const captchaProvider = this.diexConfigService.get('CAPTCHA_DRIVER');
    const supportDriver = this.diexConfigService.get('SUPPORT_DRIVER');
    const calendarBookingPageId = this.diexConfigService.get(
      'CALENDAR_BOOKING_PAGE_ID',
    );

    const isEmailingDomainInDemoMode =
      this.diexConfigService.get('EMAILING_DOMAIN_DRIVER') ===
      EmailingDomainDriver.LOG;

    const availableModels =
      this.aiModelRegistryService.getAdminFilteredModels();
    const recommendedModelIds =
      this.aiModelRegistryService.getRecommendedModelIds();
    const resolvedProviders =
      this.aiModelRegistryService.getResolvedProvidersForAdmin();

    const getProviderLabel = (providerName?: string | null) =>
      providerName
        ? (resolvedProviders[providerName]?.label ?? providerName)
        : undefined;

    const aiModels: ClientAiModelConfig[] = availableModels.map(
      (registeredModel) => {
        const modelConfig = this.aiModelRegistryService.getModelConfig(
          registeredModel.modelId,
        );

        const modelFamily = modelConfig?.modelFamily;
        const providerName = registeredModel.providerName;

        return {
          modelId: registeredModel.modelId,
          label: modelConfig?.label || registeredModel.modelId,
          modelFamily,
          modelFamilyLabel: modelFamily
            ? MODEL_FAMILY_LABELS[modelFamily]
            : undefined,
          sdkPackage: registeredModel.sdkPackage,
          providerName,
          providerLabel: getProviderLabel(providerName),
          nativeCapabilities: getNativeModelCapabilities(
            registeredModel.sdkPackage,
          ),
          inputCostPerMillionTokens: modelConfig?.inputCostPerMillionTokens,
          outputCostPerMillionTokens: modelConfig?.outputCostPerMillionTokens,
          contextWindowTokens: modelConfig?.contextWindowTokens,
          maxOutputTokens: modelConfig?.maxOutputTokens,
          isDeprecated: modelConfig?.isDeprecated,
          isRecommended: recommendedModelIds.has(registeredModel.modelId),
          dataResidency: modelConfig?.dataResidency,
        };
      },
    );

    if (aiModels.length > 0) {
      const defaultSpeedModel =
        this.aiModelRegistryService.getDefaultSpeedModel();
      const defaultSpeedModelConfig =
        this.aiModelRegistryService.getModelConfig(defaultSpeedModel?.modelId);

      const defaultPerformanceModel =
        this.aiModelRegistryService.getDefaultPerformanceModel();
      const defaultPerformanceModelConfig =
        this.aiModelRegistryService.getModelConfig(
          defaultPerformanceModel?.modelId,
        );

      aiModels.unshift(
        {
          modelId: AUTO_SELECT_SMART_MODEL_ID,
          label:
            defaultPerformanceModelConfig?.label ||
            defaultPerformanceModel?.modelId ||
            'Default',
          modelFamily: defaultPerformanceModelConfig?.modelFamily,
          providerName: defaultPerformanceModel?.providerName,
          providerLabel: getProviderLabel(
            defaultPerformanceModel?.providerName,
          ),
          sdkPackage: defaultPerformanceModel?.sdkPackage ?? null,
          nativeCapabilities: getNativeModelCapabilities(
            defaultPerformanceModel?.sdkPackage,
          ),
          inputCostPerMillionTokens:
            defaultPerformanceModelConfig?.inputCostPerMillionTokens,
          outputCostPerMillionTokens:
            defaultPerformanceModelConfig?.outputCostPerMillionTokens,
          contextWindowTokens:
            defaultPerformanceModelConfig?.contextWindowTokens,
          maxOutputTokens: defaultPerformanceModelConfig?.maxOutputTokens,
        },
        {
          modelId: AUTO_SELECT_FAST_MODEL_ID,
          label:
            defaultSpeedModelConfig?.label ||
            defaultSpeedModel?.modelId ||
            'Default',
          modelFamily: defaultSpeedModelConfig?.modelFamily,
          providerName: defaultSpeedModel?.providerName,
          providerLabel: getProviderLabel(defaultSpeedModel?.providerName),
          sdkPackage: defaultSpeedModel?.sdkPackage ?? null,
          nativeCapabilities: getNativeModelCapabilities(
            defaultSpeedModel?.sdkPackage,
          ),
          inputCostPerMillionTokens:
            defaultSpeedModelConfig?.inputCostPerMillionTokens,
          outputCostPerMillionTokens:
            defaultSpeedModelConfig?.outputCostPerMillionTokens,
          contextWindowTokens: defaultSpeedModelConfig?.contextWindowTokens,
          maxOutputTokens: defaultSpeedModelConfig?.maxOutputTokens,
        },
      );
    }

    const clientConfig: ClientConfig = {
      appVersion: this.diexConfigService.get('APP_VERSION'),
      billing: {
        isBillingEnabled: this.diexConfigService.get('IS_BILLING_ENABLED'),
        billingUrl: this.diexConfigService.get('BILLING_PLAN_REQUIRED_LINK'),
        stripePublishableKey: this.diexConfigService.get(
          'BILLING_STRIPE_PUBLISHABLE_KEY',
        ),
        trialPeriods: [
          {
            duration: this.diexConfigService.get(
              'BILLING_FREE_TRIAL_WITH_CREDIT_CARD_DURATION_IN_DAYS',
            ),
            isCreditCardRequired: true,
          },
          {
            duration: this.diexConfigService.get(
              'BILLING_FREE_TRIAL_WITHOUT_CREDIT_CARD_DURATION_IN_DAYS',
            ),
            isCreditCardRequired: false,
          },
        ],
      },
      aiModels,
      authProviders: {
        google: this.diexConfigService.get('AUTH_GOOGLE_ENABLED'),
        magicLink: false,
        password: this.diexConfigService.get('AUTH_PASSWORD_ENABLED'),
        microsoft: this.diexConfigService.get('AUTH_MICROSOFT_ENABLED'),
        sso: [],
      },
      signInPrefilled: this.diexConfigService.get('SIGN_IN_PREFILLED'),
      isMultiWorkspaceEnabled: this.diexConfigService.get(
        'IS_MULTIWORKSPACE_ENABLED',
      ),
      isEmailVerificationRequired: this.diexConfigService.get(
        'IS_EMAIL_VERIFICATION_REQUIRED',
      ),
      defaultSubdomain: this.diexConfigService.get('DEFAULT_SUBDOMAIN'),
      frontDomain: this.domainServerConfigService.getFrontUrl().hostname,
      publicFunctionDomain:
        this.domainServerConfigService.getPublicBaseHostnameOrUndefined() ??
        null,
      support: {
        supportDriver: supportDriver ? supportDriver : SupportDriver.NONE,
        supportFrontChatId: this.diexConfigService.get(
          'SUPPORT_FRONT_CHAT_ID',
        ),
      },
      sentry: {
        environment: this.diexConfigService.get('SENTRY_ENVIRONMENT'),
        release: this.diexConfigService.get('APP_VERSION'),
        dsn: this.diexConfigService.get('SENTRY_FRONT_DSN'),
      },
      captcha: {
        provider: captchaProvider ? captchaProvider : undefined,
        siteKey: this.diexConfigService.get('CAPTCHA_SITE_KEY'),
      },
      api: {
        mutationMaximumAffectedRecords: this.diexConfigService.get(
          'MUTATION_MAXIMUM_AFFECTED_RECORDS',
        ),
      },
      onboarding: {
        importContactsCreditsReward: toDisplayCredits(
          this.diexConfigService.get(
            'ONBOARDING_IMPORT_CONTACTS_CREDITS_REWARD',
          ),
        ),
        inviteTeamCreditsRewardPerUser: toDisplayCredits(
          this.diexConfigService.get(
            'ONBOARDING_INVITE_TEAM_CREDITS_REWARD_PER_USER',
          ),
        ),
        upgradeCreditsReward: toDisplayCredits(
          this.diexConfigService.get(
            'BILLING_FREE_WORKFLOW_CREDITS_FOR_TRIAL_PERIOD_WITH_CREDIT_CARD',
          ),
        ),
        installAppsCreditsRewardPerApp: toDisplayCredits(
          this.diexConfigService.get(
            'ONBOARDING_INSTALL_APPS_CREDITS_REWARD_PER_APP',
          ),
        ),
      },
      isAttachmentPreviewEnabled: this.diexConfigService.get(
        'IS_ATTACHMENT_PREVIEW_ENABLED',
      ),
      analyticsEnabled: this.diexConfigService.get('ANALYTICS_ENABLED'),
      canManageFeatureFlags:
        this.diexConfigService.get('NODE_ENV') ===
          NodeEnvironment.DEVELOPMENT ||
        this.diexConfigService.get('IS_BILLING_ENABLED'),
      publicFeatureFlags: PUBLIC_FEATURE_FLAGS,
      isMicrosoftMessagingEnabled: this.diexConfigService.get(
        'MESSAGING_PROVIDER_MICROSOFT_ENABLED',
      ),
      isMicrosoftCalendarEnabled: this.diexConfigService.get(
        'CALENDAR_PROVIDER_MICROSOFT_ENABLED',
      ),
      isGoogleMessagingEnabled: this.diexConfigService.get(
        'MESSAGING_PROVIDER_GMAIL_ENABLED',
      ),
      isGoogleCalendarEnabled: this.diexConfigService.get(
        'CALENDAR_PROVIDER_GOOGLE_ENABLED',
      ),
      isConfigVariablesInDbEnabled: this.diexConfigService.get(
        'IS_CONFIG_VARIABLES_IN_DB_ENABLED',
      ),
      isImapSmtpCaldavEnabled: this.diexConfigService.get(
        'IS_IMAP_SMTP_CALDAV_ENABLED',
      ),
      isEmailingDomainInDemoMode,
      allowRequestsToDiexIcons: this.diexConfigService.get(
        'ALLOW_REQUESTS_TO_DIEX_ICONS',
      ),
      calendarBookingPageId: isNonEmptyString(calendarBookingPageId)
        ? calendarBookingPageId
        : undefined,
      isCloudflareIntegrationEnabled: this.isCloudflareIntegrationEnabled(),
      isClickHouseConfigured: !!this.diexConfigService.get('CLICKHOUSE_URL'),
      isWorkspaceSchemaDDLLocked: this.diexConfigService.get(
        'WORKSPACE_SCHEMA_DDL_LOCKED',
      ),
      enterpriseInstanceType:
        this.diexConfigService.get('ENTERPRISE_INSTANCE_TYPE') ??
        ENTERPRISE_INSTANCE_TYPE.PRODUCTION,
    };

    const maintenanceMode =
      await this.maintenanceModeService.getMaintenanceMode();

    if (isDefined(maintenanceMode)) {
      clientConfig.maintenance = {
        startAt: new Date(maintenanceMode.startAt),
        endAt: new Date(maintenanceMode.endAt),
        link: maintenanceMode.link,
      };
    }

    return clientConfig;
  }
}
