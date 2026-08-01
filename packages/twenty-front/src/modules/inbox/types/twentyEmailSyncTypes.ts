export type TwentyEmailChannel = {
  id: string;
  handle: string;
  type: 'EMAIL' | 'EMAIL_GROUP' | string;
  visibility: string;
  isSyncEnabled: boolean;
  syncStatus: string;
  connectedAccountId: string;
  connectedAccount?: {
    id: string;
    handle: string;
    provider: string;
    archivedAt?: string | null;
  } | null;
};

export type TwentyEmailConversationMetadata = {
  source: 'TWENTY_NATIVE_EMAIL';
  messageChannelId: string;
  connectedAccountId: string;
  channelHandle: string;
  messageThreadId: string;
  messageThreadExternalId: string;
  lastMessageExternalId?: string | null;
  lastHeaderMessageId?: string | null;
  subject?: string | null;
  syncedAt: string;
};

export type TwentyEmailSyncRouting = {
  assigneeId?: string | null;
  inboxTeamId?: string | null;
  responseSlaMinutes?: number;
};

export type TwentyEmailSyncResult = {
  eligibleChannels: number;
  importedThreads: number;
  createdConversations: number;
  updatedConversations: number;
  createdMessages: number;
  automationsApplied: number;
  automationWarnings: string[];
};
