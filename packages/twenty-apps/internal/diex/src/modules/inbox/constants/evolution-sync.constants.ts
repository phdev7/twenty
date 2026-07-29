export const EVOLUTION_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'd1e0c000-0000-4000-8000-000000000006';

export const EVOLUTION_SYNC_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'd1e0c000-0000-4000-8000-000000000007';

// The cron guarantees messages arrive even with nobody watching. When somebody
// *is* watching, waiting up to a minute for the next tick is the whole latency,
// so the open inbox pulls the same reconciliation itself.
export const EVOLUTION_SYNC_ROUTE = '/diex/inbox/evolution/sync';

// Every minute. The webhook is still the fast path when the provider sends it;
// this only has to be quicker than a person noticing a missing message.
export const EVOLUTION_SYNC_CRON_PATTERN = '* * * * *';

export const EVOLUTION_SYNC_WATERMARK_KEY = 'evolution:sync:last-message-at';

// With no watermark yet, the gap to close is everything since the newest
// message the inbox already holds — however long the webhook has been silent.
// This only caps how far back that reach can go on a workspace whose inbox is
// empty, so a first run never drags months of unrelated history into it.
export const EVOLUTION_SYNC_MAX_BACKFILL_DAYS = 7;

// The provider ignores the requested page size and answers with 50 records, so
// reaching further back means walking pages. Five is far more than a normal gap
// and keeps a run inside the function timeout.
export const EVOLUTION_SYNC_MAX_PAGES = 5;

// A message can reach the provider's storage slightly after its own timestamp,
// so the window reaches a little behind the watermark. Deduplication makes the
// overlap free.
export const EVOLUTION_SYNC_OVERLAP_SECONDS = 120;
