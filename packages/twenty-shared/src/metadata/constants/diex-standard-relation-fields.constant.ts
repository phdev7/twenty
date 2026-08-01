export const DIEX_STANDARD_RELATION_FIELDS = {
  aiAction: {
    commercialSignal: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000032',
    },
    customerRenewal: {
      universalIdentifier: 'd1e14600-0000-4000-8000-00000000000b',
    },
    inboxConversation: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000038',
    },
    successPlan: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000034',
    },
  },
  commercialSignal: {
    aiActions: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000033',
    },
  },
  customerRenewal: {
    aiActions: {
      universalIdentifier: 'd1e14600-0000-4000-8000-00000000000c',
    },
    renewalEvents: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000008',
    },
    successPlan: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000001',
    },
  },
  customerRenewalEvent: {
    customerRenewal: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000007',
    },
  },
  inboxConversation: {
    diexAiActions: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000039',
    },
  },
  successMilestone: {
    successPlan: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000026',
    },
  },
  successPlan: {
    aiActions: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000035',
    },
    customerRenewals: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000002',
    },
    milestones: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000027',
    },
  },
} as const;
