export type ContextFieldKey =
  | 'businessDescription'
  | 'idealCustomerProfile'
  | 'toneOfVoice'
  | 'commercialRules'
  | 'objectionPlaybook'
  | 'competitiveLandscape'
  | 'forbiddenClaims';

export type RichTextValue = { markdown?: string | null } | null;

export type WorkspaceContextDraft = Record<ContextFieldKey, string>;

export type WorkspaceContextRecord = {
  id: string;
  name: string | null;
  status: string | null;
  reviewedAt: string | null;
} & Record<ContextFieldKey, RichTextValue>;

export type WorkspaceContextReadState =
  | 'LOADING'
  | 'ABSENT'
  | 'READY'
  | 'READ_ERROR'
  | 'RECONCILIATION_ERROR';

export type ContextField = {
  key: ContextFieldKey;
  label: string;
  hint: string;
  // Agents read the context only once it is ACTIVE, and activating it with
  // nothing written would be worse than leaving it off. These three are the
  // ones that stop every generated line from sounding like a generic vendor.
  isRequiredForActivation: boolean;
  isFilled: boolean;
};

export type DataFlowSummary = {
  conversationCount: number;
  messageCount: number;
  peopleCount: number;
};
