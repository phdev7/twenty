export const inboxWorkspaceMemberGqlFields = {
  id: true,
  name: { firstName: true, lastName: true },
  avatarUrl: true,
};

export const inboxTeamMembershipGqlFields = {
  edges: {
    node: {
      id: true,
      memberRole: true,
      isActive: true,
      joinedAt: true,
      workspaceMember: inboxWorkspaceMemberGqlFields,
    },
  },
};

export const inboxTeamGqlFields = {
  id: true,
  name: true,
  key: true,
  description: true,
  status: true,
  routingStrategy: true,
  defaultResponseSlaMinutes: true,
  isDefault: true,
  memberships: inboxTeamMembershipGqlFields,
};

export const inboxLabelGqlFields = {
  id: true,
  name: true,
  slug: true,
  color: true,
  description: true,
  status: true,
  usageCount: true,
};

export const inboxSavedReplyGqlFields = {
  id: true,
  name: true,
  shortcut: true,
  body: true,
  status: true,
  channel: true,
  category: true,
  usageCount: true,
  lastUsedAt: true,
};

export const inboxMacroGqlFields = {
  id: true,
  name: true,
  shortcut: true,
  description: true,
  status: true,
  channel: true,
  targetConversationStatus: true,
  targetPriority: true,
  internalNoteTemplate: true,
  usageCount: true,
  lastUsedAt: true,
  savedReply: inboxSavedReplyGqlFields,
  inboxLabel: inboxLabelGqlFields,
  inboxTeam: inboxTeamGqlFields,
  assignee: inboxWorkspaceMemberGqlFields,
};

export const inboxConversationGqlFields = {
  id: true,
  name: true,
  providerThreadKey: true,
  channel: true,
  provider: true,
  status: true,
  priority: true,
  contactHandle: true,
  unreadCount: true,
  lastMessagePreview: true,
  lastMessageDirection: true,
  lastMessageAt: true,
  firstResponseDueAt: true,
  firstRespondedAt: true,
  followUpDueAt: true,
  snoozedUntil: true,
  slaBreachedAt: true,
  metadata: true,
  person: { id: true, name: { firstName: true, lastName: true } },
  company: { id: true, name: true },
  opportunity: { id: true, name: true, stage: true },
  inboxTeam: inboxTeamGqlFields,
  assignee: inboxWorkspaceMemberGqlFields,
  tasks: {
    edges: {
      node: {
        id: true,
        title: true,
        status: true,
        dueAt: true,
        assignee: inboxWorkspaceMemberGqlFields,
      },
    },
  },
  labelAssignments: {
    edges: {
      node: {
        id: true,
        isActive: true,
        assignedAt: true,
        removedAt: true,
        inboxLabel: inboxLabelGqlFields,
      },
    },
  },
};

export const inboxMessageGqlFields = {
  id: true,
  name: true,
  providerMessageKey: true,
  direction: true,
  messageType: true,
  body: true,
  deliveryStatus: true,
  sentAt: true,
  senderHandle: true,
  senderDisplayName: true,
  mediaUrl: true,
  transcription: true,
  transcriptionStatus: true,
  isInternalNote: true,
  metadata: true,
};

export const inboxMentionGqlFields = {
  id: true,
  name: true,
  excerpt: true,
  status: true,
  mentionedAt: true,
  readAt: true,
  resolvedAt: true,
  inboxConversation: { id: true, name: true },
  inboxMessage: { id: true, name: true },
  mentionedWorkspaceMember: inboxWorkspaceMemberGqlFields,
  authorWorkspaceMember: inboxWorkspaceMemberGqlFields,
};

export const inboxConversationEventGqlFields = {
  id: true,
  name: true,
  eventType: true,
  summary: true,
  details: true,
  occurredAt: true,
  inboxConversation: { id: true, name: true },
  actor: inboxWorkspaceMemberGqlFields,
};
