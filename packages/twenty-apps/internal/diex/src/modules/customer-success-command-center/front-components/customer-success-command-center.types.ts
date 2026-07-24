export type CustomerSuccessRecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

export type CustomerSuccessRecordReference = {
  id: string;
  name?: string | CustomerSuccessRecordName | null;
};

export type CustomerSuccessWorkspaceMember = CustomerSuccessRecordReference & {
  userId?: string | null;
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
  opportunity?: CustomerSuccessRecordReference | null;
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

export type CustomerSuccessHandoffOpportunity = {
  id: string;
  name?: string | null;
  stage?: string | null;
  closeDate?: string | null;
  updatedAt?: string | null;
  amount?: CustomerSuccessMoney | null;
  company?:
    | (CustomerSuccessRecordReference & {
        diexLifecycle?: string | null;
      })
    | null;
  pointOfContact?: CustomerSuccessRecordReference | null;
  owner?: CustomerSuccessWorkspaceMember | null;
  diexOffer?:
    | (CustomerSuccessRecordReference & {
        pricingModel?: string | null;
        valueProposition?: CustomerSuccessRichText | null;
      })
    | null;
};

export type CustomerSuccessHandoffDraft = {
  ownerId: string;
  renewalDate: string;
  recurringRevenueMicros: number;
  currencyCode: string;
  objectives: string;
  successCriteria: string;
};

export type CustomerSuccessHandoffMilestonePreview = {
  id: string;
  name: string;
  category: string;
  dueAt: string;
};

export type CustomerSuccessHandoffPreviewPayload = {
  opportunity: {
    id: string;
    name: string;
    companyId: string;
    companyName: string;
    contactId?: string;
    contactName?: string;
    offerName?: string;
  };
  plan: {
    id: string;
    name: string;
    owner: CustomerSuccessRecordReference;
    startDate: string;
    renewalDate: string;
    nextReviewAt: string;
    recurringRevenueMicros: number;
    currencyCode: string;
    objectives: string;
    successCriteria: string;
  };
  milestones: CustomerSuccessHandoffMilestonePreview[];
  task: {
    id: string;
    title: string;
    dueAt: string;
    assignee: CustomerSuccessRecordReference;
  };
  warnings: string[];
};

export type CustomerSuccessHandoffPreviewResult =
  | {
      mode: 'PREVIEW';
      supported: false;
      opportunityId: string;
      existingPlanId?: string;
      blockedReason: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      opportunityId: string;
      preview: CustomerSuccessHandoffPreviewPayload;
      confirmationToken: string;
      expiresAt: string;
      message: string;
    };

export type CustomerSuccessHandoffApplyResult = {
  mode: 'APPLY';
  supported: true;
  opportunityId: string;
  created: true;
  alreadyCreated: boolean;
  successPlanId: string;
  taskId?: string;
  milestonesCreated: number;
  milestonesExpected: number;
  warnings: string[];
  receipt: string;
  message: string;
};

export type CustomerSuccessHandoffResult =
  CustomerSuccessHandoffPreviewResult | CustomerSuccessHandoffApplyResult;

export type CustomerSuccessMilestoneAction = 'START' | 'BLOCK' | 'COMPLETE';

export type CustomerSuccessMilestoneActionDraft = {
  action: CustomerSuccessMilestoneAction;
  outcome: string;
  evidence: string;
  impact: string;
};

export type CustomerSuccessMilestoneActionPreviewPayload = {
  generatedAt: string;
  milestone: {
    id: string;
    name: string;
    category?: string;
    dueAt?: string;
    previousStatus: string;
    nextStatus: string;
    outcome?: string;
    evidence?: string;
    impact?: string;
    completedAt?: string;
  };
  successPlan: {
    id: string;
    name: string;
    previousLifecycle?: string;
    nextLifecycle?: string;
    previousHealth?: string;
    nextHealth?: string;
    nextReviewAt: string;
    risks?: string;
    valueEvidenceRating?: string;
    expansionSignal?: boolean;
  };
  effects: string[];
  warnings: string[];
};

export type CustomerSuccessMilestoneActionPreviewResult =
  | {
      mode: 'PREVIEW';
      supported: false;
      milestoneId: string;
      blockedReason: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      milestoneId: string;
      preview: CustomerSuccessMilestoneActionPreviewPayload;
      confirmationToken: string;
      expiresAt: string;
      message: string;
    };

export type CustomerSuccessMilestoneActionApplyResult = {
  mode: 'APPLY';
  supported: true;
  milestoneId: string;
  successPlanId: string;
  action: CustomerSuccessMilestoneAction;
  milestoneUpdated: true;
  successPlanUpdated: boolean;
  warnings: string[];
  receipt: string;
  message: string;
};

export type CustomerSuccessMilestoneActionResult =
  | CustomerSuccessMilestoneActionPreviewResult
  | CustomerSuccessMilestoneActionApplyResult;
