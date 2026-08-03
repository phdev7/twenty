// Nothing pushes provider messages down to the front, so a live conversation
// only stays live if the inbox re-reads on its own.
export const INBOX_POLL_INTERVAL_MS = 6_000;
