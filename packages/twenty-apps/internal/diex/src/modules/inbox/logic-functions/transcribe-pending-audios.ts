import { CoreApiClient } from 'twenty-client-sdk/core';

import { InboxTranscriptionStatus } from 'src/modules/inbox/objects/inbox-message.object';
import { fetchEvolutionMediaBase64 } from 'src/modules/inbox/utils/evolution-media';
import { transcribeAudio } from 'src/modules/inbox/utils/transcribe-audio';

// A handful per cycle: transcription is a paid round trip per audio, and the
// cycle also has to stay responsive for the operator watching the inbox.
const MAX_AUDIOS_PER_RUN = 3;

export type TranscribePendingAudiosResult = {
  transcribed: number;
  unavailable: number;
  failed: number;
};

type PendingAudio = {
  id: string;
  providerMessageKey: string | null;
};

const readPendingAudios = async (
  client: CoreApiClient,
): Promise<PendingAudio[]> => {
  const result = (await client.query({
    inboxMessages: {
      __args: {
        filter: {
          messageType: { eq: 'AUDIO' },
          transcriptionStatus: { is: 'NULL' },
        },
        first: MAX_AUDIOS_PER_RUN,
        orderBy: [{ sentAt: 'DescNullsLast' }],
      },
      edges: { node: { id: true, providerMessageKey: true } },
    },
  } as never)) as unknown as {
    inboxMessages?: {
      edges?: Array<{ node?: PendingAudio | null }>;
    };
  };

  return (result.inboxMessages?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is PendingAudio => Boolean(node?.id));
};

const saveOutcome = async ({
  client,
  inboxMessageId,
  status,
  transcription,
}: {
  client: CoreApiClient;
  inboxMessageId: string;
  status: InboxTranscriptionStatus;
  transcription: string | null;
}): Promise<void> => {
  await client.mutation({
    updateInboxMessage: {
      __args: {
        id: inboxMessageId,
        data: {
          transcriptionStatus: status,
          ...(transcription === null ? {} : { transcription }),
        },
      },
      id: true,
    },
  });
};

// What a customer says in a voice note is commercial context like any other:
// unread by the operator scanning the thread and invisible to the AI. Turning it
// into text puts it back in both.
export const transcribePendingAudios =
  async (): Promise<TranscribePendingAudiosResult> => {
    const client = new CoreApiClient();
    const pending = await readPendingAudios(client);
    let transcribed = 0;
    let unavailable = 0;
    let failed = 0;

    for (const audio of pending) {
      const media = await fetchEvolutionMediaBase64(audio.providerMessageKey);

      if (!media) {
        unavailable += 1;

        await saveOutcome({
          client,
          inboxMessageId: audio.id,
          status: InboxTranscriptionStatus.UNAVAILABLE,
          transcription: null,
        });

        continue;
      }

      const outcome = await transcribeAudio(media);

      if (outcome.status === 'DONE') {
        transcribed += 1;

        await saveOutcome({
          client,
          inboxMessageId: audio.id,
          status: InboxTranscriptionStatus.DONE,
          transcription: outcome.text,
        });

        continue;
      }

      if (outcome.status === 'UNAVAILABLE') {
        unavailable += 1;
      } else {
        failed += 1;
      }

      // eslint-disable-next-line no-console
      console.warn(
        `[diex-inbox] transcrição de ${audio.id}: ${outcome.status} — ${outcome.reason}`,
      );

      await saveOutcome({
        client,
        inboxMessageId: audio.id,
        status:
          outcome.status === 'UNAVAILABLE'
            ? InboxTranscriptionStatus.UNAVAILABLE
            : InboxTranscriptionStatus.FAILED,
        transcription: null,
      });
    }

    return { transcribed, unavailable, failed };
  };
