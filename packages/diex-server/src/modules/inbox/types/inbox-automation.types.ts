export type InboxAutomationTriggerValue =
  | 'CONVERSATION_CREATED'
  | 'INBOUND_MESSAGE_CREATED';

export type ExecuteInboxAutomationsResult = {
  evaluated: number;
  matched: number;
  applied: number;
  failed: number;
  skippedAsDuplicate: number;
  warnings: string[];
};

export type InboxAutomationEvaluationStatus =
  | 'queued'
  | 'alreadyQueued'
  | 'skipped';

export type InboxAutomationEvaluationState =
  | 'pending'
  | 'running'
  | 'done'
  | 'done_with_warnings'
  | 'failed';

export type InboxAutomationEvaluationResponse = {
  status: InboxAutomationEvaluationStatus;
  evaluationId: string | null;
  messageId: string;
  reason?: string;
  evaluationState?: InboxAutomationEvaluationState;
};

export type InboxAutomationEvaluationMetadata = {
  evaluationId: string;
  trigger?: InboxAutomationTriggerValue;
  status: 'queued' | 'running' | 'done' | 'done_with_warnings' | 'failed';
  queuedAt: string;
  startedAt?: string;
  leaseExpiresAt?: string;
  completedAt?: string;
  attempts?: number;
  warnings?: string[];
  lastError?: string;
};
