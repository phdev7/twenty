import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { InboxSlaBreachService } from 'src/modules/inbox/services/inbox-sla-breach.service';

export type InboxSlaBreachJobData = {
  workspaceId: string;
};

@Processor(MessageQueue.inboxQueue)
export class InboxSlaBreachJob {
  private readonly logger = new Logger(InboxSlaBreachJob.name);

  constructor(private readonly inboxSlaBreachService: InboxSlaBreachService) {}

  @Process(InboxSlaBreachJob.name)
  async handle({ workspaceId }: InboxSlaBreachJobData): Promise<void> {
    try {
      await this.inboxSlaBreachService.markBreachedResponseSlas(workspaceId);
    } catch (error) {
      this.logger.error(
        `Inbox SLA breach pass failed for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw error;
    }
  }
}
