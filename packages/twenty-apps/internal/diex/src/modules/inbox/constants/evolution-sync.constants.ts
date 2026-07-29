export const EVOLUTION_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'd1e0c000-0000-4000-8000-000000000005';

// Every minute. The webhook is still the fast path when the provider sends it;
// this only has to be quicker than a person noticing a missing message.
export const EVOLUTION_SYNC_CRON_PATTERN = '* * * * *';

export const EVOLUTION_SYNC_WATERMARK_KEY = 'evolution:sync:last-message-at';

// How far back the very first run reaches. The provider keeps months of history
// for every chat the number ever had, and importing all of it would fill the
// commercial inbox with verification codes and old broadcasts.
export const EVOLUTION_SYNC_INITIAL_WINDOW_MINUTES = 90;

// Enough to cover a provider outage of a few minutes at normal volume, small
// enough that a run stays well inside the function timeout.
export const EVOLUTION_SYNC_MESSAGE_LIMIT = 40;

// A message can reach the provider's storage slightly after its own timestamp,
// so the window reaches a little behind the watermark. Deduplication makes the
// overlap free.
export const EVOLUTION_SYNC_OVERLAP_SECONDS = 120;
