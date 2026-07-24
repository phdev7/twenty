export type AiRecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

export type AiRecordReference = {
  id: string;
  name?: string | AiRecordName | null;
};

export type AiRichText = {
  markdown?: string | null;
};

export type AiAction = {
  id: string;
  name: string;
  type: string;
  status: string;
  confidence?: number | null;
  requiresApproval: boolean;
  rationale?: AiRichText | null;
  proposedAction?: AiRichText | null;
  approvalNotes?: AiRichText | null;
  executionReceipt?: AiRichText | null;
  requestedAt?: string | null;
  approvedAt?: string | null;
  executedAt?: string | null;
  opportunity?: AiRecordReference | null;
  commercialSignal?: AiRecordReference | null;
  successPlan?: AiRecordReference | null;
  inboxConversation?: AiRecordReference | null;
  reviewer?: AiRecordReference | null;
};

export type CurrentReviewer = AiRecordReference & {
  userId?: string | null;
};
