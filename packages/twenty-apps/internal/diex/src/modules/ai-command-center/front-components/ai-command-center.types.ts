export type AiRecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

export type AiRecordReference = {
  id: string;
  name?: string | AiRecordName | null;
  stage?: string | null;
};

export type AiRichText = {
  markdown?: string | null;
};

export type AiAction = {
  id: string;
  name: string;
  actionType: string;
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
  customerRenewal?: AiRecordReference | null;
  inboxConversation?: AiRecordReference | null;
  reviewer?: AiRecordReference | null;
  executor?: AiRecordReference | null;
  executionTask?: {
    id: string;
    title?: string | null;
    dueAt?: string | null;
    status?: string | null;
  } | null;
};

export type CurrentReviewer = AiRecordReference & {
  userId?: string | null;
};

export type AiActionExecutionTaskPreview = {
  id: string;
  title: string;
  dueAt: string;
  assignee: AiRecordReference;
  targets: Array<{
    id: string;
    label: string;
    objectNameSingular: 'company' | 'person' | 'opportunity';
  }>;
  body: string;
};

export type PipelineStageOption = {
  value: string;
  label: string;
  position: number;
  color?: string | null;
};

export type AiActionPipelineChangePreview = {
  opportunity: {
    id: string;
    name: string;
  };
  sourceStage: PipelineStageOption;
  targetStage: PipelineStageOption;
};

export type AiActionExecutionPreview =
  | {
      mode: 'PREVIEW';
      supported: false;
      actionId: string;
      blockedReason: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      executionKind: 'TASK';
      actionId: string;
      task: AiActionExecutionTaskPreview;
      confirmationToken: string;
      expiresAt: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      executionKind: 'PIPELINE_UPDATE';
      actionId: string;
      requiresTargetStage: true;
      opportunity: AiActionPipelineChangePreview['opportunity'];
      currentStage: PipelineStageOption;
      stageOptions: PipelineStageOption[];
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      executionKind: 'PIPELINE_UPDATE';
      actionId: string;
      requiresTargetStage: false;
      pipelineChange: AiActionPipelineChangePreview;
      stageOptions: PipelineStageOption[];
      confirmationToken: string;
      expiresAt: string;
      message: string;
    };

export type AiActionExecutionApplyResult = {
  mode: 'APPLY';
  supported: true;
  executionKind: 'TASK' | 'PIPELINE_UPDATE';
  actionId: string;
  executed: true;
  alreadyExecuted: boolean;
  task: AiActionExecutionTaskPreview | null;
  pipelineChange: AiActionPipelineChangePreview | null;
  receipt: string;
  message: string;
};

export type AiActionExecutionResult =
  AiActionExecutionPreview | AiActionExecutionApplyResult;
