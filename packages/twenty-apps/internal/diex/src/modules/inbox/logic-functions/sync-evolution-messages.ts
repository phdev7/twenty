import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  EVOLUTION_SYNC_MAX_BACKFILL_DAYS,
  EVOLUTION_SYNC_MAX_PAGES,
  EVOLUTION_SYNC_OVERLAP_SECONDS,
  EVOLUTION_SYNC_WATERMARK_KEY,
} from 'src/modules/inbox/constants/evolution-sync.constants';
import { ingestMessage } from 'src/modules/inbox/logic-functions/process-evolution-webhook';
import { transcribePendingAudios } from 'src/modules/inbox/logic-functions/transcribe-pending-audios';
import { normalizeEvolutionMessages } from 'src/modules/inbox/utils/evolution-payload';
import { safeEvolutionFetch } from 'src/modules/inbox/utils/safe-evolution-fetch';
import { resolveWhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';
import { appKeyValue } from 'src/utils/app-key-value';

export type SyncEvolutionMessagesResult = {
  fetched: number;
  considered: number;
  createdMessages: number;
  duplicateMessages: number;
  transcribedAudios: number;
  watermark: string;
  message: string;
};

type ProviderMessageRecord = Record<string, unknown>;

const readProviderRecords = (payload: unknown): ProviderMessageRecord[] => {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const messages = (payload as { messages?: unknown }).messages;

  if (Array.isArray(messages)) {
    return messages as ProviderMessageRecord[];
  }

  const records =
    typeof messages === 'object' && messages !== null
      ? (messages as { records?: unknown }).records
      : undefined;

  return Array.isArray(records) ? (records as ProviderMessageRecord[]) : [];
};

const readRecordTimestamp = (record: ProviderMessageRecord): number => {
  const raw = record.messageTimestamp;
  const numeric = typeof raw === 'string' ? Number(raw) : raw;

  return typeof numeric === 'number' && Number.isFinite(numeric)
    ? numeric * 1_000
    : 0;
};

// The stored record and the webhook body describe the same message in different
// wrappers. Rewrapping it means the sync reuses the parser the webhook already
// uses, so LID resolution, ignored addresses and message types cannot drift
// between the two paths.
const asWebhookPayload = (
  record: ProviderMessageRecord,
  instanceName: string,
): Record<string, unknown> => ({
  event: 'messages.upsert',
  instance: instanceName,
  data: record,
});

// Where to resume from on a workspace that has never synced: the newest message
// the inbox already holds. Whatever the provider stored after that is exactly
// the gap, however long the webhook stayed quiet.
const readNewestStoredMessageAt = async (
  client: CoreApiClient,
): Promise<number | null> => {
  const result = (await client.query({
    inboxMessages: {
      __args: {
        first: 1,
        orderBy: [{ sentAt: 'DescNullsLast' }],
      },
      edges: { node: { sentAt: true } },
    },
  })) as {
    inboxMessages?: {
      edges?: Array<{ node?: { sentAt?: string | null } | null }>;
    };
  };
  const sentAt = result.inboxMessages?.edges?.[0]?.node?.sentAt;
  const parsed = sentAt ? Date.parse(sentAt) : NaN;

  return Number.isFinite(parsed) ? parsed : null;
};

const fetchRecordsSince = async ({
  baseUrl,
  apiKey,
  instanceName,
  floor,
}: {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  floor: number;
}): Promise<{ records: ProviderMessageRecord[]; fetched: number }> => {
  const collected: ProviderMessageRecord[] = [];
  let fetched = 0;

  for (let page = 1; page <= EVOLUTION_SYNC_MAX_PAGES; page += 1) {
    const response = await safeEvolutionFetch({
      baseUrl,
      path: `/chat/findMessages/${encodeURIComponent(instanceName)}`,
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({ page }),
    });

    if (!response.ok) {
      throw new Error(
        `A Evolution não devolveu o histórico de mensagens (HTTP ${response.status}).`,
      );
    }

    const records = readProviderRecords(await response.json());

    fetched += records.length;
    collected.push(
      ...records.filter((record) => readRecordTimestamp(record) >= floor),
    );

    // Records come newest first, so the first page that ends before the floor
    // is the last one worth reading.
    const reachedFloor =
      records.length === 0 ||
      records.some((record) => readRecordTimestamp(record) < floor);

    if (reachedFloor) {
      break;
    }
  }

  return { records: collected, fetched };
};

// The provider stores every message it receives but does not always announce
// it: a chat addressed by LID goes silent on the webhook while landing in
// storage all the same. Reading storage on a schedule turns delivery into
// something the inbox can rely on, and deduplication keeps it free when the
// webhook did its job.
export const syncEvolutionMessages =
  async (): Promise<SyncEvolutionMessagesResult> => {
    const configuration = resolveWhatsappProvisioning();
    const client = new CoreApiClient();
    const now = Date.now();
    const oldestAllowed = now - EVOLUTION_SYNC_MAX_BACKFILL_DAYS * 86_400_000;
    const storedWatermark = await appKeyValue.get<string>(
      EVOLUTION_SYNC_WATERMARK_KEY,
    );
    const parsedWatermark = storedWatermark ? Date.parse(storedWatermark) : NaN;
    const watermark = Number.isFinite(parsedWatermark)
      ? parsedWatermark
      : Math.max(
          (await readNewestStoredMessageAt(client)) ?? oldestAllowed,
          oldestAllowed,
        );
    const floor = watermark - EVOLUTION_SYNC_OVERLAP_SECONDS * 1_000;

    const { records, fetched } = await fetchRecordsSince({
      baseUrl: configuration.baseUrl,
      apiKey: configuration.apiKey,
      instanceName: configuration.instanceName,
      floor,
    });

    let createdMessages = 0;
    let duplicateMessages = 0;
    let newestTimestamp = watermark;

    // Oldest first, so a conversation is created by the message that actually
    // opened it and the thread reads in the order it happened.
    for (const record of [...records].sort(
      (left, right) => readRecordTimestamp(left) - readRecordTimestamp(right),
    )) {
      const [message] = normalizeEvolutionMessages(
        asWebhookPayload(record, configuration.instanceName),
      );

      if (!message) {
        continue;
      }

      const result = await ingestMessage(client, message);

      if (result.status === 'CREATED') {
        createdMessages += 1;
      } else {
        duplicateMessages += 1;
      }

      newestTimestamp = Math.max(newestTimestamp, readRecordTimestamp(record));
    }

    const nextWatermark = new Date(newestTimestamp).toISOString();

    await appKeyValue.set(EVOLUTION_SYNC_WATERMARK_KEY, nextWatermark);

    // Audio arrives as sound and is useless to a reader and to the AI until it
    // is text, so the same cycle that stores it also drains the transcription
    // queue. A failure here must not fail the sync that already worked.
    const transcription = await transcribePendingAudios().catch(() => ({
      transcribed: 0,
      unavailable: 0,
      failed: 0,
    }));

    return {
      fetched,
      considered: records.length,
      createdMessages,
      duplicateMessages,
      transcribedAudios: transcription.transcribed,
      watermark: nextWatermark,
      message:
        createdMessages > 0
          ? `${createdMessages} mensagem(ns) que o webhook não entregou foram recuperadas.`
          : 'Nenhuma mensagem pendente: o webhook está entregando.',
    };
  };
