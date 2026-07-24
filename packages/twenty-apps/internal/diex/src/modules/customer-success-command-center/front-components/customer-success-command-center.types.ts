export type CustomerSuccessRecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

export type CustomerSuccessRecordReference = {
  id: string;
  name?: string | CustomerSuccessRecordName | null;
};

export type CustomerSuccessRichText = {
  markdown?: string | null;
};

export type CustomerSuccessMoney = {
  amountMicros?: number | null;
  currencyCode?: string | null;
};

export type CustomerSuccessMilestone = {
  id: string;
  name: string;
  category?: string | null;
  status?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  impact?: string | null;
  outcome?: CustomerSuccessRichText | null;
  evidence?: CustomerSuccessRichText | null;
};

export type CustomerSuccessAiAction = {
  id: string;
  name: string;
  status?: string | null;
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
  recurringRevenue?: CustomerSuccessMoney | null;
  startDate?: string | null;
  renewalDate?: string | null;
  nextReviewAt?: string | null;
  objectives?: CustomerSuccessRichText | null;
  successCriteria?: CustomerSuccessRichText | null;
  risks?: CustomerSuccessRichText | null;
  executiveSummary?: CustomerSuccessRichText | null;
  updatedAt?: string | null;
  company?: CustomerSuccessRecordReference | null;
  primaryContact?: CustomerSuccessRecordReference | null;
  owner?: CustomerSuccessRecordReference | null;
  milestones: CustomerSuccessMilestone[];
  aiActions: CustomerSuccessAiAction[];
};

export type CustomerHealthReview = {
  score: number;
  health: string;
  completeness: number;
  gaps: string[];
  riskReasons: string[];
  expansionCandidate: boolean;
  recommendation: string;
};

export type CustomerSuccessReviewResult = {
  mode?: 'PREVIEW' | 'APPLY';
  successPlanId: string;
  health: CustomerHealthReview;
  summary: string;
  riskLevel: string;
  confidence: number;
  facts: string;
  gaps: string;
  intervention: string;
  nextReviewAt: string;
  successPlanUpdated: boolean;
  aiActionId?: string;
  message: string;
};
