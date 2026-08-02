export const DIEX_STANDARD_EXTENSION_RELATION_FIELDS = {
  aiAction: {
    executionTask: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000040',
    },
    executor: { universalIdentifier: 'd1e06000-0000-4000-8000-000000000042' },
    opportunity: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000030',
    },
    reviewer: { universalIdentifier: 'd1e06000-0000-4000-8000-000000000036' },
  },
  commercialSignal: {
    company: { universalIdentifier: 'd1e06000-0000-4000-8000-000000000012' },
    opportunity: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000014',
    },
    person: { universalIdentifier: 'd1e06000-0000-4000-8000-000000000010' },
  },
  customerRenewal: {
    company: { universalIdentifier: 'd1e14600-0000-4000-8000-000000000003' },
    owner: { universalIdentifier: 'd1e14600-0000-4000-8000-000000000005' },
  },
  customerRenewalEvent: {
    actor: { universalIdentifier: 'd1e14600-0000-4000-8000-000000000009' },
  },
  inboxAutomation: {
    assignee: { universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000016' },
  },
  inboxConversation: {
    assignee: { universalIdentifier: 'b14d36db-332b-40a2-8217-b395be47a39a' },
    company: { universalIdentifier: 'a93d3f74-dad6-4a40-90b6-d5ef72a18a12' },
    opportunity: {
      universalIdentifier: '14e32618-aeb9-4282-9e98-8b8aea4721e9',
    },
    person: { universalIdentifier: 'ad36d6ef-df23-4c50-8704-124ac3da6973' },
    tasks: { universalIdentifier: '074097e0-d250-47d6-b90d-6cf60fdb8030' },
  },
  inboxConversationEvent: {
    actor: { universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000007' },
  },
  inboxMacro: {
    assignee: { universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000e' },
  },
  inboxMention: {
    authorWorkspaceMember: {
      universalIdentifier: 'd1e0fa10-0000-4000-8000-00000000000a',
    },
    mentionedWorkspaceMember: {
      universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000009',
    },
  },
  inboxTeamMember: {
    workspaceMember: {
      universalIdentifier: 'd1e0f510-0000-4000-8000-000000000006',
    },
  },
  offer: {
    opportunities: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000002',
    },
  },
  successPlan: {
    company: { universalIdentifier: 'd1e06000-0000-4000-8000-000000000020' },
    operationalTasks: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000018',
    },
    opportunity: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000044',
    },
    owner: { universalIdentifier: 'd1e06000-0000-4000-8000-000000000024' },
    primaryContact: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000022',
    },
  },
  company: {
    diexCommercialSignals: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000013',
    },
    diexCustomerRenewals: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000004',
    },
    diexInboxConversations: {
      universalIdentifier: '8f49a1c0-8e0d-4794-a98f-5dbdec1e9b33',
    },
    diexSuccessPlans: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000021',
    },
  },
  opportunity: {
    diexAiActions: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000031',
    },
    diexCommercialSignals: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000015',
    },
    diexInboxConversations: {
      universalIdentifier: '4daced73-aa5e-4d6c-9e70-80b97fe28f97',
    },
    diexOffer: { universalIdentifier: 'd1e06000-0000-4000-8000-000000000001' },
    diexSuccessPlans: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000045',
    },
  },
  person: {
    diexCommercialSignals: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000011',
    },
    diexInboxConversations: {
      universalIdentifier: 'b59f1b65-40f9-4607-8da7-3010960ff2f0',
    },
    diexSuccessPlans: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000023',
    },
  },
  task: {
    diexAiActions: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000041',
    },
    diexInboxConversation: {
      universalIdentifier: 'eba85d8a-4525-4aaf-8a2c-7c51825deb84',
    },
    diexSuccessPlan: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000017',
    },
  },
  workspaceMember: {
    diexAssignedInboxConversations: {
      universalIdentifier: '9ae28763-02f7-44b6-aaf0-4a1d0d52be0f',
    },
    diexAuthoredInboxMentions: {
      universalIdentifier: 'd1e0fa20-0000-4000-8000-000000000004',
    },
    diexCustomerRenewalEvents: {
      universalIdentifier: 'd1e14600-0000-4000-8000-00000000000a',
    },
    diexExecutedAiActions: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000043',
    },
    diexInboxAutomations: {
      universalIdentifier: 'd1e0fd20-0000-4000-8000-000000000003',
    },
    diexInboxConversationEvents: {
      universalIdentifier: 'd1e0fc20-0000-4000-8000-000000000002',
    },
    diexInboxMacros: {
      universalIdentifier: 'd1e0fb20-0000-4000-8000-000000000004',
    },
    diexInboxMentions: {
      universalIdentifier: 'd1e0fa20-0000-4000-8000-000000000003',
    },
    diexInboxTeamMemberships: {
      universalIdentifier: 'd1e0f600-0000-4000-8000-000000000004',
    },
    diexOwnedCustomerRenewals: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000006',
    },
    diexOwnedSuccessPlans: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000025',
    },
    diexReviewActions: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000037',
    },
  },
} as const;
