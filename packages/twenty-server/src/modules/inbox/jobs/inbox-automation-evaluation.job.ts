import { Logger } from '@nestjs/common';

import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { InboxAutomationEngineService } from 'src/modules/inbox/services/inbox-automation-engine.service';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import {
  type InboxAutomationEvaluationMetadata,
  type InboxAutomationTriggerValue,
} from 'src/modules/inbox/types/inbox-automation.types';
import {
  mergeInboxAutomationEvaluationMetadata,
  readInboxAutomationEvaluationMetadata,
} from 'src/modules/inbox/utils/inbox-automation-evaluation-metadata.util';

export type InboxAutomationEvaluationJobData = {
  workspaceId: string;
  messageId: string;
  evaluationId: string;
};

type PendingEvaluation = {
  conversationId: string;
  trigger: InboxAutomationTriggerValue;
  triggerKey: string;
  messageBody: string;
};

@Processor(MessageQueue.inboxQueue)
export class InboxAutomationEvaluationJob {
  private readonly logger = new Logger(InboxAutomationEvaluationJob.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly inboxAutomationEngineService: InboxAutomationEngineService,
  ) {}

  @Process(InboxAutomationEvaluationJob.name)
  async handle({
    workspaceId,
    messageId,
    evaluationId,
  }: InboxAutomationEvaluationJobData): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    try {
      const pendingEvaluation =
        await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
          () =>
            this.loadPendingEvaluation(workspaceId, messageId, evaluationId),
          authContext,
        );

      if (!pendingEvaluation) {
        this.logger.warn(
          `Inbox message ${messageId} disappeared before automation evaluation ${evaluationId} ran.`,
        );

        return;
      }

      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        () =>
          this.markEvaluationStatus({
            workspaceId,
            messageId,
            evaluationId,
            status: 'running',
          }),
        authContext,
      );

      const evaluationResult =
        await this.inboxAutomationEngineService.evaluateInboxAutomations({
          workspaceId,
          ...pendingEvaluation,
        });

      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        () =>
          this.markEvaluationStatus({
            workspaceId,
            messageId,
            evaluationId,
            status:
              evaluationResult.warnings.length > 0
                ? 'done_with_warnings'
                : 'done',
            warnings: evaluationResult.warnings,
          }),
        authContext,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Inbox automation evaluation ${evaluationId} failed for message ${messageId}: ${message}`,
      );

      await this.globalWorkspaceOrmManager
        .executeInWorkspaceContext(
          () =>
            this.markEvaluationStatus({
              workspaceId,
              messageId,
              evaluationId,
              status: 'failed',
              lastError: message,
            }),
          authContext,
        )
        .catch(() => undefined);

      throw error;
    }
  }

  private async loadPendingEvaluation(
    workspaceId: string,
    messageId: string,
    evaluationId: string,
  ): Promise<PendingEvaluation | null> {
    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
      );
    const message = await messageRepository.findOne({
      where: { id: messageId },
    });

    const evaluation = readInboxAutomationEvaluationMetadata(
      message?.metadata ?? null,
    );

    if (
      !message?.inboxConversationId ||
      !evaluation ||
      evaluation.evaluationId !== evaluationId ||
      !['queued', 'running'].includes(evaluation.status) ||
      message.direction !== 'INBOUND' ||
      message.isInternalNote ||
      !message.providerMessageKey
    ) {
      return null;
    }

    const conversationMessageCount = await messageRepository.count({
      where: { inboxConversationId: message.inboxConversationId },
    });

    return {
      conversationId: message.inboxConversationId,
      trigger:
        conversationMessageCount <= 1
          ? 'CONVERSATION_CREATED'
          : 'INBOUND_MESSAGE_CREATED',
      triggerKey: message.providerMessageKey ?? message.id,
      messageBody: message.body ?? '',
    };
  }

  private async markEvaluationStatus({
    workspaceId,
    messageId,
    evaluationId,
    status,
    warnings,
    lastError,
  }: {
    workspaceId: string;
    messageId: string;
    evaluationId: string;
    status: InboxAutomationEvaluationMetadata['status'];
    warnings?: string[];
    lastError?: string;
  }): Promise<void> {
    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
      );
    const message = await messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      return;
    }

    const current = readInboxAutomationEvaluationMetadata(message.metadata);

    if (current && current.evaluationId !== evaluationId) {
      return;
    }

    const metadata: InboxAutomationEvaluationMetadata = {
      evaluationId,
      status,
      queuedAt: current?.queuedAt ?? new Date().toISOString(),
      attempts: current?.attempts,
      completedAt:
        status === 'done' ||
        status === 'done_with_warnings' ||
        status === 'failed'
          ? new Date().toISOString()
          : undefined,
      warnings,
      lastError,
    };
    const update: QueryDeepPartialEntity<InboxMessageWorkspaceEntity> = {
      metadata: mergeInboxAutomationEvaluationMetadata(
        message.metadata,
        metadata,
      ),
    };

    await messageRepository.update(messageId, update);
  }
}
