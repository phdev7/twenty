export const EVOLUTION_WEBHOOK_SECRET_HEADER = 'x-diex-webhook-secret';

export const EVOLUTION_EVENTS = [
  'MESSAGES_UPSERT',
  'MESSAGES_UPDATE',
  'SEND_MESSAGE',
  'CONNECTION_UPDATE',
] as const;

export const EVOLUTION_SERVER_SECRET_CLAIM_PREFIX =
  'diex:evolution:webhook-secret:';
export const EVOLUTION_SERVER_INSTANCE_CLAIM_PREFIX =
  'diex:evolution:instance:';
export const EVOLUTION_ACTIVE_SECRET_CLAIM_KEY =
  'diex:evolution:active-secret-claim';
export const EVOLUTION_ACTIVE_INSTANCE_CLAIM_KEY =
  'diex:evolution:active-instance-claim';

export const EVOLUTION_SYNC_WATERMARK_KEY =
  'diex:evolution:sync:last-message-at';

// With no watermark yet, the gap to close is everything since the newest
// message the inbox already holds. This only caps how far back that reach can
// go on a workspace whose inbox is empty, so a first run never drags months of
// unrelated history into it.
export const EVOLUTION_SYNC_MAX_BACKFILL_DAYS = 7;

// A message can reach the provider's storage slightly after its own timestamp,
// so the window reaches a little behind the watermark. Deduplication makes the
// overlap free.
export const EVOLUTION_SYNC_OVERLAP_SECONDS = 120;

// Roughly 4.5 MB of binary once decoded. A voice note or a photo from a phone
// fits comfortably; anything past this is a file to open in WhatsApp.
export const EVOLUTION_MEDIA_MAX_BASE64_BYTES = 6_000_000;

// WhatsApp's customer service window. Answering someone who wrote first is a
// reply, not outreach.
export const EVOLUTION_SERVICE_WINDOW_MS = 24 * 60 * 60_000;

export const EVOLUTION_SEND_TEXT_MAX_LENGTH = 4_096;
export const EVOLUTION_SEND_CONFIRMATION_TTL_MS = 10 * 60_000;

export const EVOLUTION_SYNC_CRON_PATTERN = '* * * * *';
export const INBOX_MAINTENANCE_CRON_PATTERN = '* * * * *';

// A breach is a fact about one conversation, so a run that finds many still has
// to finish inside the minute it shares with the rest of the cycle.
export const INBOX_SLA_MAX_CONVERSATIONS_PER_RUN = 50;

// A handful per cycle: transcription is a paid round trip per audio.
export const INBOX_MAX_AUDIOS_PER_TRANSCRIPTION_RUN = 3;

export const buildEvolutionSecretClaimKey = (secretHash: string): string =>
  `${EVOLUTION_SERVER_SECRET_CLAIM_PREFIX}${secretHash}`;

export const buildEvolutionInstanceClaimKey = (instanceName: string): string =>
  `${EVOLUTION_SERVER_INSTANCE_CLAIM_PREFIX}${instanceName.trim().toLowerCase()}`;
