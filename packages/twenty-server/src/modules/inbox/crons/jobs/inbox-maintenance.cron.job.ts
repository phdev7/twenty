import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { INBOX_MAINTENANCE_CRON_PATTERN } from 'src/modules/inbox/constants/inbox-evolution.constants';
import {
  InboxAudioTranscriptionJob,
  type InboxAudioTranscriptionJobData,
} from 'src/modules/inbox/jobs/inbox-audio-transcription.job';
import {
  InboxEvolutionSyncJob,
  type InboxEvolutionSyncJobData,
} from 'src/modules/inbox/jobs/inbox-evolution-sync.job';
import {
  InboxSlaBreachJob,
  type InboxSlaBreachJobData,
} from 'src/modules/inbox/jobs/inbox-sla-breach.job';

@Processor(MessageQueue.cronQueue)
export class InboxMaintenanceCronJob {
  private readonly logger = new Logger(InboxMaintenanceCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.inboxQueue)
    private readonly inboxQueueService: MessageQueueService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  @Process(InboxMaintenanceCronJob.name)
  @SentryCronMonitor(
    InboxMaintenanceCronJob.name,
    INBOX_MAINTENANCE_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const activeWorkspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
    });

    for (const workspace of activeWorkspaces) {
      try {
        await this.enqueueWorkspaceJobs(workspace.id);
      } catch (error) {
        this.logger.error(
          `Inbox maintenance scheduling failed for workspace ${workspace.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        this.exceptionHandlerService.captureExceptions([error], {
          workspace: { id: workspace.id },
        });
      }
    }
  }

  private async enqueueWorkspaceJobs(workspaceId: string): Promise<void> {
    await Promise.all([
      this.inboxQueueService.add<InboxEvolutionSyncJobData>(
        InboxEvolutionSyncJob.name,
        { workspaceId },
        { retryLimit: 3 },
      ),
      this.inboxQueueService.add<InboxAudioTranscriptionJobData>(
        InboxAudioTranscriptionJob.name,
        { workspaceId },
        { retryLimit: 2 },
      ),
      this.inboxQueueService.add<InboxSlaBreachJobData>(
        InboxSlaBreachJob.name,
        { workspaceId },
        { retryLimit: 3 },
      ),
    ]);
  }
}
