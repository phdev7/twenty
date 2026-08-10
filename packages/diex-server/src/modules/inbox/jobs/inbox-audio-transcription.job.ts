import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { InboxAudioTranscriptionRunnerService } from 'src/modules/inbox/services/inbox-audio-transcription-runner.service';

export type InboxAudioTranscriptionJobData = {
  workspaceId: string;
};

@Processor(MessageQueue.inboxQueue)
export class InboxAudioTranscriptionJob {
  private readonly logger = new Logger(InboxAudioTranscriptionJob.name);

  constructor(
    private readonly inboxAudioTranscriptionRunnerService: InboxAudioTranscriptionRunnerService,
  ) {}

  @Process(InboxAudioTranscriptionJob.name)
  async handle({ workspaceId }: InboxAudioTranscriptionJobData): Promise<void> {
    try {
      await this.inboxAudioTranscriptionRunnerService.transcribePendingAudios(
        workspaceId,
      );
    } catch (error) {
      this.logger.error(
        `Inbox audio transcription failed for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw error;
    }
  }
}
