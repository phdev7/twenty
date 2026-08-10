export type DiexEmailChannel = {
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

export type DiexEmailConversationMetadata = {
  source: 'DIEX_NATIVE_EMAIL';
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

export type DiexEmailSyncRouting = {
  assigneeId?: string | null;
  inboxTeamId?: string | null;
  responseSlaMinutes?: number;
};

export type DiexEmailSyncResult = {
  eligibleChannels: number;
  importedThreads: number;
  createdConversations: number;
  updatedConversations: number;
  createdMessages: number;
  automationEvaluationsQueued: number;
  automationEvaluationsPending: number;
  automationWarnings: string[];
};
