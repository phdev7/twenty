import { Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { createHash } from 'node:crypto';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { DataSource, Repository } from 'typeorm';

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
import { InboxAutomationEvaluationService } from 'src/modules/inbox/services/inbox-automation-evaluation.service';

@Processor(MessageQueue.cronQueue)
export class InboxMaintenanceCronJob {
  private readonly logger = new Logger(InboxMaintenanceCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    @InjectMessageQueue(MessageQueue.inboxQueue)
    private readonly inboxQueueService: MessageQueueService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
    private readonly inboxAutomationEvaluationService: InboxAutomationEvaluationService,
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
        await this.withWorkspaceSchedulingLock(workspace.id, () =>
          this.enqueueWorkspaceJobs(workspace.id),
        );
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

  private async withWorkspaceSchedulingLock(
    workspaceId: string,
    callback: () => Promise<void>,
  ): Promise<void> {
    const queryRunner = this.coreDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockDigest = createHash('sha256')
        .update(`diex:inbox:maintenance:${workspaceId}`)
        .digest();
      const [lockResult] = await queryRunner.query(
        'SELECT pg_try_advisory_xact_lock($1, $2) AS locked',
        [lockDigest.readInt32BE(0), lockDigest.readInt32BE(4)],
      );

      if (!lockResult?.locked || lockResult.locked === 'f') {
        await queryRunner.rollbackTransaction();

        return;
      }

      await callback();
      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async enqueueWorkspaceJobs(workspaceId: string): Promise<void> {
    const inFlightJobs = await this.inboxQueueService.getInFlightJobs();
    const hasInFlightWorkspaceJob = (jobName: string): boolean =>
      inFlightJobs.some((job) =>
        job.id?.startsWith(`${jobName}.${workspaceId}`),
      );

    await Promise.all([
      hasInFlightWorkspaceJob(InboxEvolutionSyncJob.name)
        ? undefined
        : this.inboxQueueService.add<InboxEvolutionSyncJobData>(
            InboxEvolutionSyncJob.name,
            { workspaceId },
            {
              id: `${InboxEvolutionSyncJob.name}.${workspaceId}`,
              retryLimit: 3,
            },
          ),
      hasInFlightWorkspaceJob(InboxAudioTranscriptionJob.name)
        ? undefined
        : this.inboxQueueService.add<InboxAudioTranscriptionJobData>(
            InboxAudioTranscriptionJob.name,
            { workspaceId },
            {
              id: `${InboxAudioTranscriptionJob.name}.${workspaceId}`,
              retryLimit: 2,
            },
          ),
      hasInFlightWorkspaceJob(InboxSlaBreachJob.name)
        ? undefined
        : this.inboxQueueService.add<InboxSlaBreachJobData>(
            InboxSlaBreachJob.name,
            { workspaceId },
            { id: `${InboxSlaBreachJob.name}.${workspaceId}`, retryLimit: 3 },
          ),
      this.inboxAutomationEvaluationService.reconcilePendingEvaluations(
        workspaceId,
      ),
    ]);
  }
}
