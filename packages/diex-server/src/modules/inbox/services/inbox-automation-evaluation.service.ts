import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'node:crypto';

import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/diex-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { InboxAutomationEvaluationJob } from 'src/modules/inbox/jobs/inbox-automation-evaluation.job';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import {
  type InboxAutomationEvaluationResponse,
  type InboxAutomationEvaluationMetadata,
  type InboxAutomationEvaluationState,
  type InboxAutomationTriggerValue,
} from 'src/modules/inbox/types/inbox-automation.types';
import {
  mergeInboxAutomationEvaluationMetadata,
  readInboxAutomationEvaluationMetadata,
} from 'src/modules/inbox/utils/inbox-automation-evaluation-metadata.util';

export type EnqueueInboxAutomationEvaluationInput = {
  workspaceId: string;
  messageId: string;
  trigger?: InboxAutomationTriggerValue;
  force?: boolean;
};

const evaluationStateByStatus: Record<
  InboxAutomationEvaluationMetadata['status'],
  InboxAutomationEvaluationState
> = {
  queued: 'pending',
  running: 'running',
  done: 'done',
  done_with_warnings: 'done_with_warnings',
  failed: 'failed',
};

const isExpiredAutomationLease = (
  evaluation: InboxAutomationEvaluationMetadata,
): boolean => {
  if (evaluation.status !== 'running') {
    return false;
  }

  const expiresAt = evaluation.leaseExpiresAt
    ? Date.parse(evaluation.leaseExpiresAt)
    : Number.NaN;

  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
};

const hasRetryableWarnings = (
  evaluation: InboxAutomationEvaluationMetadata,
): boolean =>
  evaluation.status === 'done_with_warnings' &&
  (evaluation.warnings?.length ?? 0) > 0;

@Injectable()
export class InboxAutomationEvaluationService {
  private readonly logger = new Logger(InboxAutomationEvaluationService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectMessageQueue(MessageQueue.inboxQueue)
    private readonly inboxQueueService: MessageQueueService,
  ) {}

  async enqueue(
    input: EnqueueInboxAutomationEvaluationInput,
  ): Promise<InboxAutomationEvaluationResponse> {
    const { workspaceId } = input;
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      () => this.enqueueInWorkspace(input),
      authContext,
    );
  }

  async reconcilePendingEvaluations(workspaceId: string): Promise<number> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageRepository =
          await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
            workspaceId,
            InboxMessageWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );
        let reconciled = 0;
        let offset = 0;

        while (true) {
          const messages = await messageRepository.find({
            where: { direction: 'INBOUND' },
            order: { createdAt: 'ASC' },
            skip: offset,
            take: 100,
          });

          if (messages.length === 0) {
            break;
          }

          offset += messages.length;

          for (const message of messages) {
            const evaluation = readInboxAutomationEvaluationMetadata(
              message.metadata,
            );

            if (
              !message.inboxConversationId ||
              !message.providerMessageKey ||
              (evaluation &&
                !['queued', 'failed'].includes(evaluation.status) &&
                !isExpiredAutomationLease(evaluation) &&
                !hasRetryableWarnings(evaluation))
            ) {
              continue;
            }

            try {
              const result = await this.enqueueInWorkspace({
                workspaceId,
                messageId: message.id,
                force: true,
              });

              if (result.status === 'queued') {
                reconciled += 1;
              }
            } catch (error) {
              this.logger.warn(
                `Inbox automation reconciliation failed for message ${message.id}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            }
          }
        }

        return reconciled;
      },
      authContext,
    );
  }

  private async enqueueInWorkspace(
    input: EnqueueInboxAutomationEvaluationInput,
  ): Promise<InboxAutomationEvaluationResponse> {
    const { workspaceId, messageId, force = false } = input;
    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
    const message = await messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message || !message.inboxConversationId) {
      throw new NotFoundException('Inbox message not found.');
    }

    if (message.isInternalNote) {
      throw new BadRequestException('A mensagem é uma nota interna.');
    }

    if (message.direction !== 'INBOUND') {
      throw new BadRequestException(
        'A automação só é avaliada para mensagens recebidas.',
      );
    }

    if (!message.providerMessageKey) {
      throw new BadRequestException(
        'A mensagem não possui identidade externa persistida.',
      );
    }

    const current = readInboxAutomationEvaluationMetadata(message.metadata);

    if (
      current?.status === 'done' ||
      (current?.status === 'done_with_warnings' &&
        !hasRetryableWarnings(current))
    ) {
      return {
        status: 'skipped',
        evaluationId: current.evaluationId,
        messageId,
        evaluationState: evaluationStateByStatus[current.status],
      };
    }

    if (current?.status === 'running') {
      if (
        !isExpiredAutomationLease(current) ||
        (await this.hasInFlightEvaluation(current.evaluationId))
      ) {
        return {
          status: 'alreadyQueued',
          evaluationId: current.evaluationId,
          messageId,
          evaluationState: evaluationStateByStatus[current.status],
        };
      }
    }

    if (
      current?.status === 'failed' &&
      (await this.hasInFlightEvaluation(current.evaluationId))
    ) {
      return {
        status: 'alreadyQueued',
        evaluationId: current.evaluationId,
        messageId,
        evaluationState: evaluationStateByStatus[current.status],
      };
    }

    if (
      current?.status === 'queued' &&
      ((current.attempts !== 0 && !force) ||
        (await this.hasInFlightEvaluation(current.evaluationId)))
    ) {
      return {
        status: 'alreadyQueued',
        evaluationId: current.evaluationId,
        messageId,
        evaluationState: evaluationStateByStatus[current.status],
      };
    }

    const evaluationId =
      current?.evaluationId ??
      createHash('sha256')
        .update(`${workspaceId}:${message.providerMessageKey}`)
        .digest('hex');
    const persistedTrigger = message.metadata?.automationTrigger;
    const trigger =
      input.trigger ??
      current?.trigger ??
      (persistedTrigger === 'CONVERSATION_CREATED' ||
      persistedTrigger === 'INBOUND_MESSAGE_CREATED'
        ? persistedTrigger
        : await this.resolveTrigger(
            messageRepository,
            message.inboxConversationId,
          ));
    const attempts = (current?.attempts ?? 0) + 1;
    const queuedMetadata: InboxAutomationEvaluationMetadata = {
      evaluationId,
      trigger,
      status: 'queued',
      queuedAt: current?.queuedAt ?? new Date().toISOString(),
      attempts,
    };

    const update = {
      metadata: mergeInboxAutomationEvaluationMetadata(
        message.metadata,
        queuedMetadata,
      ),
    } as unknown as QueryDeepPartialEntity<InboxMessageWorkspaceEntity>;

    await messageRepository.update(messageId, update);

    try {
      await this.inboxQueueService.add(
        InboxAutomationEvaluationJob.name,
        { workspaceId, messageId, evaluationId, attempts },
        {
          id: evaluationId,
          retryLimit: 3,
        },
      );
    } catch (error) {
      const failedMetadata: InboxAutomationEvaluationMetadata = {
        ...queuedMetadata,
        status: 'failed',
        completedAt: new Date().toISOString(),
        lastError: error instanceof Error ? error.message : String(error),
      };

      const failedUpdate = {
        metadata: mergeInboxAutomationEvaluationMetadata(
          message.metadata,
          failedMetadata,
        ),
      } as unknown as QueryDeepPartialEntity<InboxMessageWorkspaceEntity>;

      await messageRepository.update(messageId, failedUpdate);

      throw error;
    }

    return {
      status: 'queued',
      evaluationId,
      messageId,
      evaluationState: 'pending',
    };
  }

  private async resolveTrigger(
    messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>,
    conversationId: string,
  ): Promise<InboxAutomationTriggerValue> {
    const conversationMessageCount = await messageRepository.count({
      where: { inboxConversationId: conversationId },
    });

    return conversationMessageCount <= 1
      ? 'CONVERSATION_CREATED'
      : 'INBOUND_MESSAGE_CREATED';
  }

  private async hasInFlightEvaluation(evaluationId: string): Promise<boolean> {
    type EvaluationJobData = {
      workspaceId: string;
      messageId: string;
      evaluationId: string;
      attempts?: number;
    };
    const jobs = await this.inboxQueueService
      .getInFlightJobs<EvaluationJobData>()
      .catch(() => [] as { data: EvaluationJobData }[]);

    return jobs.some((job) => job.data?.evaluationId === evaluationId);
  }
}
