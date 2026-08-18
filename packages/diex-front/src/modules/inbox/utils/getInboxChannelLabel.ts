import { INBOX_CHANNEL_OPTIONS } from '@/inbox/constants/INBOX_CHANNEL_OPTIONS';

// A workspace can carry a channel value this build does not know about, so the
// raw value is shown rather than hidden behind a generic fallback.
export const getInboxChannelLabel = (channel: string): string =>
  INBOX_CHANNEL_OPTIONS.find(({ value }) => value === channel)?.label ??
  channel;
