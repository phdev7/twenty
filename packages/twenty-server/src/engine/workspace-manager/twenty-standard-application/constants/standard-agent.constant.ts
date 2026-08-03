export const STANDARD_AGENT = {
  helper: {
    universalIdentifier: '20202020-c7ab-4065-b822-0ca1d5de60a9',
  },
  diexRevenueCopilot: {
    universalIdentifier: 'd1e0a000-0000-4000-8000-000000000001',
  },
  diexCustomerSuccessCopilot: {
    universalIdentifier: 'd1e0a000-0000-4000-8000-000000000002',
  },
  diexInboxTriage: {
    universalIdentifier: 'd1e0a000-0000-4000-8000-000000000003',
  },
  diexDealReview: {
    universalIdentifier: 'd1e0a000-0000-4000-8000-000000000004',
  },
  diexCustomerSuccessReview: {
    universalIdentifier: 'd1e0a000-0000-4000-8000-000000000005',
  },
} as const satisfies Record<
  string,
  {
    universalIdentifier: string;
  }
>;
