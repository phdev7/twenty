import {
  AiActionRiskLevel,
  AiActionType,
} from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';

export type AiActionWriteSetEntry = {
  resourceType: 'OPPORTUNITY' | 'INBOX_CONVERSATION' | 'SUCCESS_PLAN' | 'TASK';
  resourceId: string | null;
  operation: 'CREATE' | 'UPDATE';
};

export type AiActionPolicy = {
  version: string;
  riskLevel: AiActionRiskLevel;
  requiresApproval: boolean;
  expiryMs: number;
  maxAttempts: number;
  maxProposalsPerHour: number;
  maxExecutionsPerHour: number;
  estimatedCostCredits: number;
};

export const AI_ACTION_POLICY_VERSION = '1.0.0';
export const AI_ACTION_PROPOSAL_WINDOW_MS = 60 * 60 * 1000;
export const AI_ACTION_EXECUTION_WINDOW_MS = 60 * 60 * 1000;

const DEFAULT_POLICY: AiActionPolicy = {
  version: AI_ACTION_POLICY_VERSION,
  riskLevel: AiActionRiskLevel.MEDIUM,
  requiresApproval: true,
  expiryMs: 24 * 60 * 60 * 1000,
  maxAttempts: 3,
  maxProposalsPerHour: 100,
  maxExecutionsPerHour: 50,
  estimatedCostCredits: 1,
};

const POLICY_BY_ACTION_TYPE: Record<AiActionType, AiActionPolicy> = {
  [AiActionType.QUALIFY]: {
    ...DEFAULT_POLICY,
    riskLevel: AiActionRiskLevel.LOW,
    expiryMs: 7 * 24 * 60 * 60 * 1000,
    estimatedCostCredits: 1,
  },
  [AiActionType.REPLY]: {
    ...DEFAULT_POLICY,
    riskLevel: AiActionRiskLevel.HIGH,
    expiryMs: 60 * 60 * 1000,
    maxProposalsPerHour: 10_000,
    maxExecutionsPerHour: 10_000,
    estimatedCostCredits: 2,
  },
  [AiActionType.FOLLOW_UP]: {
    ...DEFAULT_POLICY,
    expiryMs: 3 * 24 * 60 * 60 * 1000,
    estimatedCostCredits: 1,
  },
  [AiActionType.PIPELINE_UPDATE]: {
    ...DEFAULT_POLICY,
    expiryMs: 12 * 60 * 60 * 1000,
    estimatedCostCredits: 1,
  },
  [AiActionType.RISK_MITIGATION]: {
    ...DEFAULT_POLICY,
    riskLevel: AiActionRiskLevel.HIGH,
    expiryMs: 12 * 60 * 60 * 1000,
    maxProposalsPerHour: 50,
    estimatedCostCredits: 2,
  },
  [AiActionType.CS_INTERVENTION]: {
    ...DEFAULT_POLICY,
    riskLevel: AiActionRiskLevel.HIGH,
    expiryMs: 24 * 60 * 60 * 1000,
    maxProposalsPerHour: 50,
    estimatedCostCredits: 2,
  },
  [AiActionType.EXPANSION]: {
    ...DEFAULT_POLICY,
    riskLevel: AiActionRiskLevel.HIGH,
    expiryMs: 24 * 60 * 60 * 1000,
    maxProposalsPerHour: 50,
    estimatedCostCredits: 2,
  },
};

export const getAiActionPolicy = (type: AiActionType): AiActionPolicy =>
  POLICY_BY_ACTION_TYPE[type] ?? {
    ...DEFAULT_POLICY,
    riskLevel: AiActionRiskLevel.BLOCKED,
  };

export const buildAiActionWriteSet = ({
  type,
  opportunityId,
  inboxConversationId,
  successPlanId,
}: {
  type: AiActionType;
  opportunityId?: string;
  inboxConversationId?: string;
  successPlanId?: string;
}): AiActionWriteSetEntry[] => {
  const writeSet: AiActionWriteSetEntry[] =
    type === AiActionType.REPLY
      ? []
      : [
          {
            resourceType: 'TASK',
            resourceId: null,
            operation: 'CREATE',
          },
        ];

  if (opportunityId) {
    writeSet.push({
      resourceType: 'OPPORTUNITY',
      resourceId: opportunityId,
      operation: 'UPDATE',
    });
  }

  if (inboxConversationId) {
    writeSet.push({
      resourceType: 'INBOX_CONVERSATION',
      resourceId: inboxConversationId,
      operation: 'UPDATE',
    });
  }

  if (successPlanId) {
    writeSet.push({
      resourceType: 'SUCCESS_PLAN',
      resourceId: successPlanId,
      operation: 'UPDATE',
    });
  }

  return writeSet;
};
