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

export type InboxTeamMembership = {
  id: string;
  memberRole: string;
  isActive: boolean;
  joinedAt?: string | null;
  workspaceMember?: InboxWorkspaceMember | null;
};

export type InboxTeam = {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  status: string;
  routingStrategy: string;
  defaultResponseSlaMinutes: number;
  isDefault: boolean;
  memberships?: InboxTeamMembership[];
};

export type InboxOpportunity = InboxRecordReference & {
  stage?: string | null;
};

export type InboxTask = {
  id: string;
  title?: string | null;
  status?: string | null;
  dueAt?: string | null;
  assignee?: InboxWorkspaceMember | null;
};

export type InboxTaskDraft = {
  title: string;
  dueAt: string;
  assigneeId: string | null;
};

export type InboxLabel = {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string | null;
  status: string;
  usageCount: number;
};

export type InboxConversationLabelAssignment = {
  id: string;
  isActive: boolean;
  assignedAt?: string | null;
  removedAt?: string | null;
  label: InboxLabel;
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
  metadata?: unknown;
  person?: InboxRecordReference | null;
  company?: InboxRecordReference | null;
  opportunity?: InboxOpportunity | null;
  inboxTeam?: InboxTeam | null;
  assignee?: InboxWorkspaceMember | null;
  tasks: InboxTask[];
  labelAssignments: InboxConversationLabelAssignment[];
};

export type InboxMessage = {
  id: string;
  name: string;
  providerMessageKey: string;
  direction: string;
  messageType: string;
  body?: string | null;
  deliveryStatus: string;
  sentAt?: string | null;
  senderHandle?: string | null;
  senderDisplayName?: string | null;
  mediaUrl?: string | null;
  transcription?: string | null;
  transcriptionStatus?: string | null;
  isInternalNote: boolean;
  metadata?: unknown;
};

export type InboxConversationEvent = {
  id: string;
  name: string;
  eventType: string;
  summary: string;
  details?: string | null;
  occurredAt?: string | null;
  inboxConversation?: InboxRecordReference | null;
  actor?: InboxWorkspaceMember | null;
};

export type InboxMention = {
  id: string;
  name: string;
  excerpt?: string | null;
  status: string;
  mentionedAt?: string | null;
  readAt?: string | null;
  resolvedAt?: string | null;
  inboxConversation?: InboxRecordReference | null;
  inboxMessage?: InboxRecordReference | null;
  mentionedWorkspaceMember?: InboxWorkspaceMember | null;
  authorWorkspaceMember?: InboxWorkspaceMember | null;
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

export type InboxMacro = {
  id: string;
  name: string;
  shortcut: string;
  description?: string | null;
  status: string;
  channel: string;
  targetConversationStatus: string;
  targetPriority: string;
  internalNoteTemplate?: string | null;
  usageCount: number;
  lastUsedAt?: string | null;
  savedReply?: InboxSavedReply | null;
  inboxLabel?: InboxLabel | null;
  inboxTeam?: InboxTeam | null;
  assignee?: InboxWorkspaceMember | null;
};

export type InboxMacroPreview = {
  macroId: string;
  actions: string[];
  replyDraft?: string | null;
  internalNote?: string | null;
  unresolvedReplyVariables: string[];
  unresolvedNoteVariables: string[];
};

export type InboxMacroApplyResult = {
  macroId: string;
  appliedActions: string[];
  warnings: string[];
  replyDraft?: string | null;
  unresolvedReplyVariables: string[];
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

export type InboxExternalMessagePreview =
  | (EvolutionTextPreview & {
      channel: 'WHATSAPP';
      subjectPreview?: null;
    })
  | {
      previewOnly: true;
      channel: 'EMAIL';
      conversationId: string;
      destination: string;
      subjectPreview: string;
      textPreview: string;
      connectedAccountId: string;
      messageChannelId: string;
      inReplyTo?: string | null;
      expiresAt: string;
      confirmationToken: string;
      message: string;
    };

export type EvolutionMediaPayload = {
  inboxMessageId: string;
  mimeType: string;
  fileName?: string | null;
  dataUri: string;
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

export type InboxAttentionFilter =
  'ALL' | 'UNREAD' | 'MENTIONED' | 'SLA_BREACHED' | 'URGENT' | 'FOLLOW_UP_DUE';
