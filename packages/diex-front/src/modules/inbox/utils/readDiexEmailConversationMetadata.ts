import { type DiexEmailConversationMetadata } from '@/inbox/types/diexEmailSyncTypes';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readDiexEmailConversationMetadata = (
  value: unknown,
): DiexEmailConversationMetadata | null => {
  if (
    !isRecord(value) ||
    value.source !== 'DIEX_NATIVE_EMAIL' ||
    typeof value.messageChannelId !== 'string' ||
    typeof value.connectedAccountId !== 'string' ||
    typeof value.channelHandle !== 'string' ||
    typeof value.messageThreadId !== 'string' ||
    typeof value.messageThreadExternalId !== 'string' ||
    typeof value.syncedAt !== 'string'
  ) {
    return null;
  }

  return {
    source: 'DIEX_NATIVE_EMAIL',
    messageChannelId: value.messageChannelId,
    connectedAccountId: value.connectedAccountId,
    channelHandle: value.channelHandle,
    messageThreadId: value.messageThreadId,
    messageThreadExternalId: value.messageThreadExternalId,
    lastMessageExternalId:
      typeof value.lastMessageExternalId === 'string'
        ? value.lastMessageExternalId
        : null,
    lastHeaderMessageId:
      typeof value.lastHeaderMessageId === 'string'
        ? value.lastHeaderMessageId
        : null,
    subject: typeof value.subject === 'string' ? value.subject : null,
    syncedAt: value.syncedAt,
  };
};
