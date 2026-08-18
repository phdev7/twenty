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
  inboxLabel: InboxLabel;
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

export type InboxConversationFilter =
  | 'ACTIVE'
  | 'OPEN'
  | 'PENDING'
  | 'SNOOZED'
  | 'RESOLVED';

export type InboxChannel =
  | 'WHATSAPP'
  | 'EMAIL'
  | 'INSTAGRAM'
  | 'MESSENGER'
  | 'WEBCHAT'
  | 'SMS'
  | 'TIKTOK';

export type InboxChannelFilter = 'ALL' | InboxChannel;

export type InboxAttentionFilter =
  | 'ALL'
  | 'UNREAD'
  | 'MENTIONED'
  | 'SLA_BREACHED'
  | 'URGENT'
  | 'FOLLOW_UP_DUE';
