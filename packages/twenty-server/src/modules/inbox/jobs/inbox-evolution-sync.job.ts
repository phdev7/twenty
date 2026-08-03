import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { EvolutionSyncService } from 'src/modules/inbox/services/evolution-sync.service';

export type InboxEvolutionSyncJobData = {
  workspaceId: string;
};

@Processor(MessageQueue.inboxQueue)
export class InboxEvolutionSyncJob {
  private readonly logger = new Logger(InboxEvolutionSyncJob.name);

  constructor(private readonly evolutionSyncService: EvolutionSyncService) {}

  @Process(InboxEvolutionSyncJob.name)
  async handle({ workspaceId }: InboxEvolutionSyncJobData): Promise<void> {
    try {
      await this.evolutionSyncService.syncWorkspace(workspaceId);
    } catch (error) {
      this.logger.error(
        `Evolution inbox sync failed for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw error;
    }
  }
}
