export const INBOX_STANDARD_RELATION_FIELDS = {
  inboxAutomation: {
    inboxLabel: {
      universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000014',
    },
    inboxTeam: {
      universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000015',
    },
  },
  inboxConversation: {
    conversationEvents: {
      universalIdentifier: 'd1e0fc20-0000-4000-8000-000000000001',
    },
    inboxTeam: {
      universalIdentifier: 'd1e0f600-0000-4000-8000-000000000001',
    },
    labelAssignments: {
      universalIdentifier: 'd1e0f200-0000-4000-8000-000000000001',
    },
    mentions: {
      universalIdentifier: 'd1e0fa20-0000-4000-8000-000000000001',
    },
    messages: {
      universalIdentifier: '34bb2d1c-17c0-435f-a00d-4a30224a054c',
    },
  },
  inboxConversationEvent: {
    inboxConversation: {
      universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000006',
    },
  },
  inboxConversationLabel: {
    inboxConversation: {
      universalIdentifier: 'd1e0f100-0000-4000-8000-000000000005',
    },
    inboxLabel: {
      universalIdentifier: 'd1e0f100-0000-4000-8000-000000000006',
    },
  },
  inboxLabel: {
    conversationAssignments: {
      universalIdentifier: 'd1e0f200-0000-4000-8000-000000000002',
    },
    inboxAutomations: {
      universalIdentifier: 'd1e0fd20-0000-4000-8000-000000000001',
    },
    inboxMacros: {
      universalIdentifier: 'd1e0fb20-0000-4000-8000-000000000002',
    },
  },
  inboxMacro: {
    inboxLabel: {
      universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000c',
    },
    inboxTeam: {
      universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000d',
    },
    savedReply: {
      universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000b',
    },
  },
  inboxMention: {
    inboxConversation: {
      universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000007',
    },
    inboxMessage: {
      universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000008',
    },
  },
  inboxMessage: {
    inboxConversation: {
      universalIdentifier: '1b017ced-89f2-4358-a166-fa62e486e361',
    },
    mentions: {
      universalIdentifier: 'd1e0fa20-0000-4000-8000-000000000002',
    },
  },
  inboxSavedReply: {
    inboxMacros: {
      universalIdentifier: 'd1e0fb20-0000-4000-8000-000000000001',
    },
  },
  inboxTeam: {
    inboxAutomations: {
      universalIdentifier: 'd1e0fd20-0000-4000-8000-000000000002',
    },
    inboxConversations: {
      universalIdentifier: 'd1e0f600-0000-4000-8000-000000000002',
    },
    inboxMacros: {
      universalIdentifier: 'd1e0fb20-0000-4000-8000-000000000003',
    },
    memberships: {
      universalIdentifier: 'd1e0f600-0000-4000-8000-000000000003',
    },
  },
  inboxTeamMember: {
    inboxTeam: {
      universalIdentifier: 'd1e0f510-0000-4000-8000-000000000005',
    },
  },
} as const;
