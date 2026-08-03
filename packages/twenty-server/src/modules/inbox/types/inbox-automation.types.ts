export type InboxAutomationTriggerValue =
  | 'CONVERSATION_CREATED'
  | 'INBOUND_MESSAGE_CREATED';

export type ExecuteInboxAutomationsResult = {
  evaluated: number;
  matched: number;
  applied: number;
  skippedAsDuplicate: number;
  warnings: string[];
};

export type InboxAutomationEvaluationStatus =
  | 'queued'
  | 'alreadyQueued'
  | 'skipped';

export type InboxAutomationEvaluationResponse = {
  status: InboxAutomationEvaluationStatus;
  evaluationId: string | null;
  messageId: string;
  reason?: string;
};

export type InboxAutomationEvaluationMetadata = {
  evaluationId: string;
  status: 'queued' | 'running' | 'done' | 'done_with_warnings' | 'failed';
  queuedAt: string;
  completedAt?: string;
  attempts?: number;
  warnings?: string[];
  lastError?: string;
};
