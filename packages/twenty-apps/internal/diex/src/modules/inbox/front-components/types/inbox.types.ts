export type PersonName = {
  firstName?: string | null;
  lastName?: string | null;
};

export type InboxRecordReference = {
  id: string;
  name?: string | PersonName | null;
};

export type InboxWorkspaceMember = InboxRecordReference & {
  avatarUrl?: string | null;
};

export type InboxOpportunity = InboxRecordReference & {
  stage?: string | null;
};

export type InboxTask = {
  id: string;
  title?: string | null;
  status?: string | null;
  dueAt?: string | null;
};

export type InboxConversation = {
  id: string;
  name: string;
  providerThreadKey: string;
  channel: string;
  provider: string;
  status: string;
  priority: string;
  contactHandle?: string | null;
  unreadCount: number;
  lastMessagePreview?: string | null;
  lastMessageDirection?: string | null;
  lastMessageAt?: string | null;
  firstResponseDueAt?: string | null;
  firstRespondedAt?: string | null;
  followUpDueAt?: string | null;
  snoozedUntil?: string | null;
  slaBreachedAt?: string | null;
  person?: InboxRecordReference | null;
  company?: InboxRecordReference | null;
  opportunity?: InboxOpportunity | null;
  assignee?: InboxWorkspaceMember | null;
  tasks: InboxTask[];
};

export type InboxMessage = {
  id: string;
  name: string;
  providerMessageKey: string;
  direction: string;
  type: string;
  body?: string | null;
  deliveryStatus: string;
  sentAt?: string | null;
  senderHandle?: string | null;
  senderDisplayName?: string | null;
  mediaUrl?: string | null;
  isInternalNote: boolean;
};

export type InboxSavedReply = {
  id: string;
  name: string;
  shortcut: string;
  body: string;
  status: string;
  channel: string;
  category?: string | null;
  usageCount: number;
  lastUsedAt?: string | null;
};

export type SavedReplyRenderResult = {
  text: string;
  unresolvedVariables: string[];
};

export type EvolutionTextPreview = {
  previewOnly: true;
  conversationId: string;
  destination: string;
  textPreview: string;
  expiresAt: string;
  confirmationToken: string;
  message: string;
};

export type EvolutionTextReceipt = {
  previewOnly: false;
  sent: boolean;
  conversationId: string;
  inboxMessageId?: string;
  providerMessageKey?: string;
  sentAt?: string;
  message: string;
};

export type EvolutionConfigureReceipt = {
  configured: boolean;
  instanceName: string;
  webhookUrl: string;
  providerStatus: number;
  events: string[];
};

export type InboxTriageResult = {
  conversationId: string;
  summary: string;
  intent: string;
  sentiment: string;
  urgency: number;
  signalType?: string | null;
  signalStrength: number;
  confidence: number;
  evidence: string;
  recommendedAction: string;
  suggestedReply: string;
  commercialSignalId?: string;
  aiActionId?: string;
  message: string;
};

export type InboxConversationFilter =
  'ACTIVE' | 'OPEN' | 'PENDING' | 'SNOOZED' | 'RESOLVED';
