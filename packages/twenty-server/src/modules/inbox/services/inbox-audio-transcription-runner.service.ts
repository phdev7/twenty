import { Injectable, Logger } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { INBOX_MAX_AUDIOS_PER_TRANSCRIPTION_RUN } from 'src/modules/inbox/constants/inbox-evolution.constants';
import { EvolutionMediaService } from 'src/modules/inbox/services/evolution-media.service';
import { InboxTranscriptionService } from 'src/modules/inbox/services/inbox-transcription.service';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { type TranscribePendingAudiosResult } from 'src/modules/inbox/types/inbox-evolution.types';

// What a customer says in a voice note is commercial context like any other:
// unread by the operator scanning the thread and invisible to the AI. Turning
// it into text puts it back in both.
@Injectable()
export class InboxAudioTranscriptionRunnerService {
  private readonly logger = new Logger(
    InboxAudioTranscriptionRunnerService.name,
  );

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly evolutionMediaService: EvolutionMediaService,
    private readonly inboxTranscriptionService: InboxTranscriptionService,
  ) {}

  async transcribePendingAudios(
    workspaceId: string,
  ): Promise<TranscribePendingAudiosResult> {
    // Without a key every audio comes back UNAVAILABLE, so the whole cycle is a
    // round trip to the provider and a write for nothing.
    if (this.inboxTranscriptionService.readOpenAiApiKey() === null) {
      return { transcribed: 0, unavailable: 0, failed: 0 };
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageRepository =
          await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
            workspaceId,
            InboxMessageWorkspaceEntity,
          );
        const pending = await messageRepository
          .createQueryBuilder('message')
          .where('message.messageType = :messageType', {
            messageType: 'AUDIO',
          })
          .andWhere(
            '(message.transcriptionStatus IS NULL OR message.transcriptionStatus = :unavailable)',
            { unavailable: 'UNAVAILABLE' },
          )
          .orderBy('message.sentAt', 'DESC')
          .take(INBOX_MAX_AUDIOS_PER_TRANSCRIPTION_RUN)
          .getMany();

        let transcribed = 0;
        let unavailable = 0;
        let failed = 0;

        for (const audio of pending) {
          const media = await this.evolutionMediaService.fetchMediaBase64({
            workspaceId,
            providerMessageKey: audio.providerMessageKey,
          });

          // Failed, not unavailable: the provider has no media for this
          // message, so retrying it every minute would spend the run's budget
          // on an audio that is never coming back and starve the ones that
          // just arrived.
          if (!media) {
            failed += 1;
            await messageRepository.update(audio.id, {
              transcriptionStatus: 'FAILED',
            });
            continue;
          }

          const outcome =
            await this.inboxTranscriptionService.transcribeAudio(media);

          if (outcome.status === 'DONE') {
            transcribed += 1;
            await messageRepository.update(audio.id, {
              transcriptionStatus: 'DONE',
              transcription: outcome.text,
            });
            continue;
          }

          if (outcome.status === 'UNAVAILABLE') {
            unavailable += 1;
          } else {
            failed += 1;
          }

          this.logger.warn(
            `Transcription for ${audio.id}: ${outcome.status} — ${outcome.reason}`,
          );

          await messageRepository.update(audio.id, {
            transcriptionStatus:
              outcome.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAILED',
          });
        }

        return { transcribed, unavailable, failed };
      },
      authContext,
    );
  }
}
