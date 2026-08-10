import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { INBOX_MAINTENANCE_CRON_PATTERN } from 'src/modules/inbox/constants/inbox-evolution.constants';
import { InboxMaintenanceCronJob } from 'src/modules/inbox/crons/jobs/inbox-maintenance.cron.job';

@Command({
  name: 'cron:inbox:maintenance',
  description:
    'Starts the native inbox sync, transcription and SLA maintenance cron job',
})
export class InboxMaintenanceCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly cronQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.cronQueueService.addCron<undefined>({
      jobName: InboxMaintenanceCronJob.name,
      data: undefined,
      options: { repeat: { pattern: INBOX_MAINTENANCE_CRON_PATTERN } },
    });
  }
}
