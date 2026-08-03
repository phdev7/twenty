export type DiexRichText = {
  markdown?: string | null;
};

export type DiexNamedRecord = {
  id: string;
  name?:
    | string
    | { firstName?: string | null; lastName?: string | null }
    | null;
};

export type DiexMoney = {
  amountMicros?: number | null;
  currencyCode?: string | null;
};

export type CustomerSuccessMilestone = {
  id: string;
  name: string;
  category?: string | null;
  status: string;
  dueAt?: string | null;
  completedAt?: string | null;
  impact?: string | null;
  outcome?: DiexRichText | null;
  evidence?: DiexRichText | null;
};

export type CustomerSuccessAiAction = {
  id: string;
  name: string;
  status: string;
  requestedAt?: string | null;
};

export type CustomerSuccessPlan = {
  id: string;
  name: string;
  lifecycle?: string | null;
  health?: string | null;
  healthScore?: number | null;
  activeUseRating?: string | null;
  valueEvidenceRating?: string | null;
  expansionSignal?: boolean | null;
  recurringRevenue?: DiexMoney | null;
  startDate?: string | null;
  renewalDate?: string | null;
  nextReviewAt?: string | null;
  objectives?: DiexRichText | null;
  successCriteria?: DiexRichText | null;
  risks?: DiexRichText | null;
  executiveSummary?: DiexRichText | null;
  updatedAt?: string | null;
  company?: DiexNamedRecord | null;
  primaryContact?: DiexNamedRecord | null;
  owner?: DiexNamedRecord | null;
  opportunity?: DiexNamedRecord | null;
  milestones: CustomerSuccessMilestone[];
  aiActions: CustomerSuccessAiAction[];
};

export type CustomerSuccessHandoffOpportunity = {
  id: string;
  name?: string | null;
  closeDate?: string | null;
  updatedAt?: string | null;
  amount?: DiexMoney | null;
  company?: (DiexNamedRecord & { diexLifecycle?: string | null }) | null;
  pointOfContact?: DiexNamedRecord | null;
  owner?: DiexNamedRecord | null;
  diexOffer?: {
    id: string;
    name?: string | null;
    pricingModel?: string | null;
    valueProposition?: DiexRichText | null;
  } | null;
};

export type CustomerSuccessWorkspaceMember = DiexNamedRecord & {
  userId?: string | null;
};

export type CustomerSuccessHandoffDraft = {
  ownerId: string;
  renewalDate: string;
  recurringRevenueMicros: number;
  currencyCode: string;
  objectives: string;
  successCriteria: string;
};

export type CustomerSuccessReviewResult = {
  mode: 'PREVIEW' | 'APPLY';
  successPlanId: string;
  summary: string;
  intervention: string;
  gaps?: string | null;
  confidence: number;
  health: { health: string; score: number };
  successPlanUpdated?: boolean;
  aiActionId?: string | null;
};

export type CustomerSuccessHandoffPreview = {
  mode: 'PREVIEW';
  supported: boolean;
  opportunityId: string;
  blockedReason?: string;
  confirmationToken?: string;
  expiresAt?: string;
  message: string;
  preview?: {
    plan: { name: string; renewalDate: string };
    milestones: Array<{ id: string; name: string; dueAt: string }>;
    task: { title: string; dueAt: string };
    warnings: string[];
  };
};

export type CustomerSuccessMilestoneActionDraft = {
  action: 'START' | 'BLOCK' | 'COMPLETE';
  outcome: string;
  evidence: string;
  impact: string;
};

export type CustomerSuccessMilestonePreview = {
  mode: 'PREVIEW';
  supported: boolean;
  milestoneId: string;
  blockedReason?: string;
  confirmationToken?: string;
  expiresAt?: string;
  message: string;
  preview?: { effects: string[]; warnings: string[] };
};
