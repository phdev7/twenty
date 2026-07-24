export type RenewalRecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

export type RenewalRecordReference = {
  id: string;
  name?: string | RenewalRecordName | null;
};

export type RenewalWorkspaceMember = RenewalRecordReference & {
  userId?: string | null;
};

export type RenewalRichText = {
  markdown?: string | null;
};

export type RenewalMoney = {
  amountMicros?: number | null;
  currencyCode?: string | null;
};

export type RenewalEvent = {
  id: string;
  eventType: string;
  summary: string;
  occurredAt: string;
  actor?: RenewalRecordReference | null;
};

export type CustomerRenewal = {
  id: string;
  name: string;
  stage: string;
  risk: string;
  forecast: string;
  renewalValue?: RenewalMoney | null;
  probability?: number | null;
  targetDate?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  lastTouchAt?: string | null;
  riskReason?: RenewalRichText | null;
  valueEvidence?: RenewalRichText | null;
  commercialTerms?: RenewalRichText | null;
  outcome?: RenewalRichText | null;
  closedAt?: string | null;
  updatedAt?: string | null;
  successPlan?: RenewalRecordReference | null;
  company?: RenewalRecordReference | null;
  owner?: RenewalWorkspaceMember | null;
  events: RenewalEvent[];
};

export type RenewalSuccessPlan = {
  id: string;
  name: string;
  health?: string | null;
  healthScore?: number | null;
  renewalDate?: string | null;
  recurringRevenue?: RenewalMoney | null;
  risks?: RenewalRichText | null;
  executiveSummary?: RenewalRichText | null;
  company?: RenewalRecordReference | null;
  owner?: RenewalWorkspaceMember | null;
};

export type RenewalDraft = {
  stage: string;
  risk: string;
  forecast: string;
  probability: number;
  targetDate: string;
  nextAction: string;
  nextActionAt: string;
  ownerId: string;
  riskReason: string;
  valueEvidence: string;
  commercialTerms: string;
  outcome: string;
};
