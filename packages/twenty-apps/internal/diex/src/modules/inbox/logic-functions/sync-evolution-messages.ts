import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  EVOLUTION_SYNC_INITIAL_WINDOW_MINUTES,
  EVOLUTION_SYNC_MESSAGE_LIMIT,
  EVOLUTION_SYNC_OVERLAP_SECONDS,
  EVOLUTION_SYNC_WATERMARK_KEY,
} from 'src/modules/inbox/constants/evolution-sync.constants';
import { ingestMessage } from 'src/modules/inbox/logic-functions/process-evolution-webhook';
import { normalizeEvolutionMessages } from 'src/modules/inbox/utils/evolution-payload';
import { safeEvolutionFetch } from 'src/modules/inbox/utils/safe-evolution-fetch';
import { resolveWhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';
import { appKeyValue } from 'src/utils/app-key-value';

export type SyncEvolutionMessagesResult = {
  fetched: number;
  considered: number;
  createdMessages: number;
  duplicateMessages: number;
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

// The provider stores every message it receives but does not always announce
// it: a chat addressed by LID goes silent on the webhook while landing in
// storage all the same. Reading storage on a schedule turns delivery into
// something the inbox can rely on, and deduplication keeps it free when the
// webhook did its job.
export const syncEvolutionMessages =
  async (): Promise<SyncEvolutionMessagesResult> => {
    const configuration = resolveWhatsappProvisioning();
    const now = Date.now();
    const storedWatermark = await appKeyValue.get<string>(
      EVOLUTION_SYNC_WATERMARK_KEY,
    );
    const parsedWatermark = storedWatermark ? Date.parse(storedWatermark) : NaN;
    const watermark = Number.isFinite(parsedWatermark)
      ? parsedWatermark
      : now - EVOLUTION_SYNC_INITIAL_WINDOW_MINUTES * 60_000;
    const floor = watermark - EVOLUTION_SYNC_OVERLAP_SECONDS * 1_000;

    const response = await safeEvolutionFetch({
      baseUrl: configuration.baseUrl,
      path: `/chat/findMessages/${encodeURIComponent(configuration.instanceName)}`,
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        apikey: configuration.apiKey,
      },
      body: JSON.stringify({ limit: EVOLUTION_SYNC_MESSAGE_LIMIT }),
    });

    if (!response.ok) {
      throw new Error(
        `A Evolution não devolveu o histórico de mensagens (HTTP ${response.status}).`,
      );
    }

    const records = readProviderRecords(await response.json());
    const recent = records.filter(
      (record) => readRecordTimestamp(record) >= floor,
    );
    const client = new CoreApiClient();
    let createdMessages = 0;
    let duplicateMessages = 0;
    let newestTimestamp = watermark;

    // Oldest first, so a conversation is created by the message that actually
    // opened it and the thread reads in the order it happened.
    for (const record of [...recent].sort(
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

      newestTimestamp = Math.max(
        newestTimestamp,
        readRecordTimestamp(record),
      );
    }

    const nextWatermark = new Date(newestTimestamp).toISOString();

    await appKeyValue.set(EVOLUTION_SYNC_WATERMARK_KEY, nextWatermark);

    return {
      fetched: records.length,
      considered: recent.length,
      createdMessages,
      duplicateMessages,
      watermark: nextWatermark,
      message:
        createdMessages > 0
          ? `${createdMessages} mensagem(ns) que o webhook não entregou foram recuperadas.`
          : 'Nenhuma mensagem pendente: o webhook está entregando.',
    };
  };
