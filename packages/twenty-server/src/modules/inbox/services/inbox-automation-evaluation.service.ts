import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'node:crypto';

import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { InboxAutomationEvaluationJob } from 'src/modules/inbox/jobs/inbox-automation-evaluation.job';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import {
  type InboxAutomationEvaluationResponse,
  type InboxAutomationEvaluationMetadata,
} from 'src/modules/inbox/types/inbox-automation.types';
import {
  mergeInboxAutomationEvaluationMetadata,
  readInboxAutomationEvaluationMetadata,
} from 'src/modules/inbox/utils/inbox-automation-evaluation-metadata.util';

export type EnqueueInboxAutomationEvaluationInput = {
  workspaceId: string;
  messageId: string;
};

@Injectable()
export class InboxAutomationEvaluationService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectMessageQueue(MessageQueue.inboxQueue)
    private readonly inboxQueueService: MessageQueueService,
  ) {}

  async enqueue(
    input: EnqueueInboxAutomationEvaluationInput,
  ): Promise<InboxAutomationEvaluationResponse> {
    const { workspaceId, messageId } = input;
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageRepository =
          await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
            workspaceId,
            InboxMessageWorkspaceEntity,
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
          current &&
          ['queued', 'running', 'done', 'done_with_warnings'].includes(
            current.status,
          )
        ) {
          return {
            status: 'alreadyQueued',
            evaluationId: current.evaluationId,
            messageId,
          };
        }

        const evaluationId =
          current?.evaluationId ??
          createHash('sha256')
            .update(`${workspaceId}:${message.providerMessageKey}`)
            .digest('hex');
        const attempts = (current?.attempts ?? 0) + 1;
        const queuedMetadata: InboxAutomationEvaluationMetadata = {
          evaluationId,
          status: 'queued',
          queuedAt: new Date().toISOString(),
          attempts,
        };

        const update: QueryDeepPartialEntity<InboxMessageWorkspaceEntity> = {
          metadata: mergeInboxAutomationEvaluationMetadata(
            message.metadata,
            queuedMetadata,
          ),
        };

        await messageRepository.update(messageId, update);

        try {
          await this.inboxQueueService.add(
            InboxAutomationEvaluationJob.name,
            { workspaceId, messageId, evaluationId },
            {
              id: `${evaluationId}:${attempts}`,
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

          const failedUpdate: QueryDeepPartialEntity<InboxMessageWorkspaceEntity> =
            {
              metadata: mergeInboxAutomationEvaluationMetadata(
                message.metadata,
                failedMetadata,
              ),
            };

          await messageRepository.update(messageId, failedUpdate);

          throw error;
        }

        return { status: 'queued', evaluationId, messageId };
      },
      authContext,
    );
  }
}
