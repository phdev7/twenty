import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type LanguageModelUsage } from 'ai';
import { NO_BILLING_SUBSCRIPTION } from 'src/engine/core-modules/billing/constants/no-billing-subscription.constant';
import { BillingUsageService } from 'src/engine/core-modules/billing/services/billing-usage.service';
import { BillingService } from 'src/engine/core-modules/billing/services/billing.service';

import { USAGE_RECORDED } from 'src/engine/core-modules/usage/constants/usage-recorded.constant';
import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import { UsageResourceType } from 'src/engine/core-modules/usage/enums/usage-resource-type.enum';
import { UsageUnit } from 'src/engine/core-modules/usage/enums/usage-unit.enum';
import { type UsageEvent } from 'src/engine/core-modules/usage/types/usage-event.type';
import { NATIVE_WEB_SEARCH_COST_PER_CALL_DOLLARS } from 'src/engine/metadata-modules/ai/ai-billing/constants/native-web-search-cost-per-call-dollars';
import { computeCostBreakdown } from 'src/engine/metadata-modules/ai/ai-billing/utils/compute-cost-breakdown.util';
import { convertDollarsToBillingCredits } from 'src/engine/metadata-modules/ai/ai-billing/utils/convert-dollars-to-billing-credits.util';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { type ModelId } from 'src/engine/metadata-modules/ai/ai-models/types/model-id.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceEventEmitter } from 'src/engine/workspace-event-emitter/workspace-event-emitter';
import { WorkspaceApprovalGateService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-gate.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type Repository } from 'typeorm';

export type BillingUsageInput = {
  usage: LanguageModelUsage;
  cacheCreationTokens?: number;
};

@Injectable()
export class AiBillingService {
  private readonly logger = new Logger(AiBillingService.name);

  constructor(
    private readonly workspaceEventEmitter: WorkspaceEventEmitter,
    private readonly aiModelRegistryService: AiModelRegistryService,
    private readonly billingService: BillingService,
    private readonly billingUsageService: BillingUsageService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceApprovalGateService: WorkspaceApprovalGateService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  /**
   * AI access is deliberately checked before resolving or calling a provider.
   * Billing checks alone are not enough: an unapproved workspace must not spend
   * provider tokens even when billing is disabled or credits are available.
   */
  async assertWorkspaceCanUseAi(workspaceId: string): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (
      !workspace ||
      !this.workspaceApprovalGateService.isWorkspaceApprovedForAi(workspace)
    ) {
      throw new ForbiddenException(
        'A IA só pode ser usada depois que o workspace for aprovado pelo administrador.',
      );
    }
  }

  private async canWorkspaceUseAi(workspaceId: string): Promise<boolean> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    return (
      workspace !== null &&
      this.workspaceApprovalGateService.isWorkspaceApprovedForAi(workspace)
    );
  }

  calculateCost(modelId: ModelId, billingInput: BillingUsageInput): number {
    const model = this.aiModelRegistryService.getEffectiveModelConfig(modelId);
    const { usage, cacheCreationTokens = 0 } = billingInput;

    const breakdown = computeCostBreakdown(model, {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      reasoningTokens: usage.outputTokenDetails?.reasoningTokens,
      cachedInputTokens: usage.inputTokenDetails?.cacheReadTokens,
      cacheCreationTokens,
    });

    this.logger.log(
      `Cost for ${model.modelId}: $${breakdown.totalCostInDollars.toFixed(6)} ` +
        `(input: ${breakdown.tokenCounts.adjustedInputTokens}, ` +
        `cached: ${breakdown.tokenCounts.cachedInputTokens}, ` +
        `cacheCreation: ${breakdown.tokenCounts.cacheCreationTokens}, ` +
        `output: ${breakdown.tokenCounts.adjustedOutputTokens}, ` +
        `reasoning: ${breakdown.tokenCounts.reasoningTokens})`,
    );

    return breakdown.totalCostInDollars;
  }

  async calculateAndBillUsage(
    modelId: ModelId,
    billingInput: BillingUsageInput,
    workspaceId: string,
    operationType: UsageOperationType,
    agentId?: string | null,
    userWorkspaceId?: string | null,
  ): Promise<void> {
    if (!(await this.canWorkspaceUseAi(workspaceId))) {
      this.logger.warn(
        `Skipped AI usage billing for unapproved workspace ${workspaceId}`,
      );

      return;
    }

    const costInDollars = this.calculateCost(modelId, billingInput);
    const creditsUsedMicro = Math.round(
      convertDollarsToBillingCredits(costInDollars),
    );

    const totalTokens =
      (billingInput.usage.inputTokens ?? 0) +
      (billingInput.usage.outputTokens ?? 0) +
      (billingInput.cacheCreationTokens ?? 0);

    if (this.billingService.isBillingEnabled()) {
      await this.billingUsageService.decrementAvailableCreditsInCache({
        workspaceId,
        usedCredits: creditsUsedMicro,
      });
    }

    await this.emitAiTokenUsageEvent(
      workspaceId,
      creditsUsedMicro,
      totalTokens,
      modelId,
      operationType,
      agentId,
      userWorkspaceId,
    );
  }

  async decrementAndCheckAvailableCredits(
    modelId: ModelId,
    billingInput: BillingUsageInput,
    workspaceId: string,
  ): Promise<{ hasNoMoreAvailableCredits: boolean }> {
    if (!(await this.canWorkspaceUseAi(workspaceId))) {
      return { hasNoMoreAvailableCredits: true };
    }

    if (!this.billingService.isBillingEnabled()) {
      return { hasNoMoreAvailableCredits: false };
    }

    const costInDollars = this.calculateCost(modelId, billingInput);
    const creditsUsedMicro = Math.round(
      convertDollarsToBillingCredits(costInDollars),
    );

    const remainingCredits =
      await this.billingUsageService.decrementAvailableCreditsInCache({
        workspaceId,
        usedCredits: creditsUsedMicro,
      });

    return { hasNoMoreAvailableCredits: remainingCredits <= 0 };
  }

  async billNativeWebSearchUsage(
    nativeWebSearchCallCount: number,
    workspaceId: string,
    userWorkspaceId?: string | null,
  ): Promise<void> {
    if (nativeWebSearchCallCount <= 0) {
      return;
    }

    if (!(await this.canWorkspaceUseAi(workspaceId))) {
      this.logger.warn(
        `Skipped native search billing for unapproved workspace ${workspaceId}`,
      );

      return;
    }

    const costInDollars =
      nativeWebSearchCallCount * NATIVE_WEB_SEARCH_COST_PER_CALL_DOLLARS;
    const creditsUsedMicro = Math.round(
      convertDollarsToBillingCredits(costInDollars),
    );

    this.logger.log(
      `Native web search billing: ${nativeWebSearchCallCount} calls, $${costInDollars.toFixed(4)}`,
    );

    let periodStart: Date | undefined;

    if (this.billingService.isBillingEnabled()) {
      const { currentBillingSubscription } =
        await this.workspaceCacheService.getOrRecompute(workspaceId, [
          'currentBillingSubscription',
        ]);

      if (currentBillingSubscription !== NO_BILLING_SUBSCRIPTION) {
        periodStart = currentBillingSubscription.currentPeriodStart;

        await this.billingUsageService.decrementAvailableCreditsInCache({
          workspaceId,
          usedCredits: creditsUsedMicro,
        });
      }
    }

    this.workspaceEventEmitter.emitCustomBatchEvent<UsageEvent>(
      USAGE_RECORDED,
      [
        {
          resourceType: UsageResourceType.AI,
          operationType: UsageOperationType.WEB_SEARCH,
          creditsUsedMicro,
          quantity: nativeWebSearchCallCount,
          unit: UsageUnit.INVOCATION,
          userWorkspaceId: userWorkspaceId || null,
          periodStart,
        },
      ],
      workspaceId,
    );
  }

  async emitAiTokenUsageEvent(
    workspaceId: string,
    creditsUsedMicro: number,
    totalTokens: number,
    modelId: ModelId,
    operationType: UsageOperationType,
    agentId?: string | null,
    userWorkspaceId?: string | null,
  ): Promise<void> {
    if (!(await this.canWorkspaceUseAi(workspaceId))) {
      this.logger.warn(
        `Skipped AI usage event for unapproved workspace ${workspaceId}`,
      );

      return;
    }

    let periodStart: Date | undefined;

    if (this.billingService.isBillingEnabled()) {
      const { currentBillingSubscription } =
        await this.workspaceCacheService.getOrRecompute(workspaceId, [
          'currentBillingSubscription',
        ]);

      periodStart =
        currentBillingSubscription === NO_BILLING_SUBSCRIPTION
          ? undefined
          : currentBillingSubscription.currentPeriodStart;
    }

    this.workspaceEventEmitter.emitCustomBatchEvent<UsageEvent>(
      USAGE_RECORDED,
      [
        {
          resourceType: UsageResourceType.AI,
          operationType,
          creditsUsedMicro,
          quantity: totalTokens,
          unit: UsageUnit.TOKEN,
          resourceId: agentId || null,
          resourceContext: modelId,
          userWorkspaceId: userWorkspaceId || null,
          periodStart,
        },
      ],
      workspaceId,
    );
  }
}
