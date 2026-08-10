import {
  type DiexNamedRecord,
  type DiexRichText,
} from '@/diex-command-centers/customer-success/types';

export type AiAction = {
  id: string;
  name: string;
  actionType: string;
  status: string;
  confidence?: number | null;
  requiresApproval: boolean;
  rationale?: DiexRichText | null;
  proposedAction?: DiexRichText | null;
  approvalNotes?: DiexRichText | null;
  executionReceipt?: DiexRichText | null;
  contextVersion?: string | null;
  executionStartedAt?: string | null;
  failureReason?: DiexRichText | null;
  attemptCount?: number | null;
  requestedAt?: string | null;
  approvedAt?: string | null;
  executedAt?: string | null;
  opportunity?: DiexNamedRecord | null;
  commercialSignal?: DiexNamedRecord | null;
  successPlan?: DiexNamedRecord | null;
  customerRenewal?: DiexNamedRecord | null;
  inboxConversation?: DiexNamedRecord | null;
  reviewer?: DiexNamedRecord | null;
  executor?: DiexNamedRecord | null;
  executionTask?: {
    id: string;
    title?: string | null;
    dueAt?: string | null;
    status?: string | null;
  } | null;
};

export type PipelineStageOption = {
  value: string;
  label: string;
  position: number;
  color?: string | null;
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
      task: {
        id: string;
        title: string;
        dueAt: string;
        assignee: DiexNamedRecord;
        targets: Array<{
          id: string;
          label: string;
          objectNameSingular: 'company' | 'person' | 'opportunity';
        }>;
        body: string;
      };
      confirmationToken: string;
      expiresAt: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      executionKind: 'EXTERNAL_REPLY';
      actionId: string;
      externalMessage: {
        channel: 'WHATSAPP';
        conversationId?: string;
        textPreview: string;
      };
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
      opportunity: { id: string; name: string };
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
      pipelineChange: {
        opportunity: { id: string; name: string };
        sourceStage: PipelineStageOption;
        targetStage: PipelineStageOption;
      };
      stageOptions: PipelineStageOption[];
      confirmationToken: string;
      expiresAt: string;
      message: string;
    };
export type AiActionExecutionResult =
  | AiActionExecutionPreview
  | { mode: 'APPLY'; actionId: string; executed: boolean; message: string };
