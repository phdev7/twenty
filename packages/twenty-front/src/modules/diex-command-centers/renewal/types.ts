import {
  type DiexMoney,
  type DiexNamedRecord,
  type DiexRichText,
} from '@/diex-command-centers/customer-success/types';

export type RenewalEvent = {
  id: string;
  eventType: string;
  summary: string;
  occurredAt: string;
  actor?: DiexNamedRecord | null;
};

export type CustomerRenewal = {
  id: string;
  name: string;
  stage: string;
  risk: string;
  forecast: string;
  renewalValue?: DiexMoney | null;
  probability?: number | null;
  targetDate?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  lastTouchAt?: string | null;
  riskReason?: DiexRichText | null;
  valueEvidence?: DiexRichText | null;
  commercialTerms?: DiexRichText | null;
  outcome?: DiexRichText | null;
  closedAt?: string | null;
  successPlan?: DiexNamedRecord | null;
  company?: DiexNamedRecord | null;
  owner?: DiexNamedRecord | null;
  renewalEvents: RenewalEvent[];
};

export type RenewalSuccessPlan = {
  id: string;
  name: string;
  health?: string | null;
  renewalDate?: string | null;
  recurringRevenue?: DiexMoney | null;
  risks?: DiexRichText | null;
  executiveSummary?: DiexRichText | null;
  company?: DiexNamedRecord | null;
  owner?: DiexNamedRecord | null;
};

export type RenewalWorkspaceMember = DiexNamedRecord & {
  userId?: string | null;
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
