import {
  InboxAutomationEvaluationRequestError,
  triggerInboxAutomationsAfterEmailSync,
} from '@/inbox/utils/triggerInboxAutomationsAfterEmailSync';

const AUTOMATION_EVALUATION_QUEUE_VERSION = 1;
const AUTOMATION_EVALUATION_STORAGE_PREFIX =
  'twenty-inbox-automation-evaluations';
const MAX_PENDING_EVALUATIONS = 5_000;
const MAX_TERMINAL_EVALUATIONS = 5_000;
const MAX_EVALUATIONS_PER_RECONCILIATION = 50;
const EVALUATION_BATCH_SIZE = 5;

type AutomationEvaluationQueueState = {
  version: typeof AUTOMATION_EVALUATION_QUEUE_VERSION;
  pendingMessageIds: string[];
  terminalMessageIds: string[];
};

export type InboxAutomationReconciliationResult = {
  queuedCount: number;
  alreadyQueuedCount: number;
  skippedCount: number;
  pendingCount: number;
  warnings: string[];
};

const queueStateCache = new Map<string, AutomationEvaluationQueueState>();
const reconciliationTails = new Map<string, Promise<unknown>>();

const emptyQueueState = (): AutomationEvaluationQueueState => ({
  version: AUTOMATION_EVALUATION_QUEUE_VERSION,
  pendingMessageIds: [],
  terminalMessageIds: [],
});

const getStorageKey = (workspaceId: string): string =>
  `${AUTOMATION_EVALUATION_STORAGE_PREFIX}:${workspaceId}`;

const isValidMessageId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 64;

const uniqueMessageIds = (values: unknown[]): string[] => [
  ...new Set(values.filter(isValidMessageId)),
];

const readQueueState = (
  workspaceId: string,
): AutomationEvaluationQueueState => {
  const cachedState = queueStateCache.get(workspaceId);

  if (cachedState) {
    return cachedState;
  }

  if (typeof window === 'undefined') {
    const state = emptyQueueState();

    queueStateCache.set(workspaceId, state);

    return state;
  }

  try {
    const parsedState = JSON.parse(
      window.localStorage.getItem(getStorageKey(workspaceId)) ?? 'null',
    ) as Partial<AutomationEvaluationQueueState> | null;
    const state: AutomationEvaluationQueueState =
      parsedState?.version === AUTOMATION_EVALUATION_QUEUE_VERSION &&
      Array.isArray(parsedState.pendingMessageIds) &&
      Array.isArray(parsedState.terminalMessageIds)
        ? {
            version: AUTOMATION_EVALUATION_QUEUE_VERSION,
            pendingMessageIds: uniqueMessageIds(
              parsedState.pendingMessageIds,
            ).slice(0, MAX_PENDING_EVALUATIONS),
            terminalMessageIds: uniqueMessageIds(
              parsedState.terminalMessageIds,
            ).slice(-MAX_TERMINAL_EVALUATIONS),
          }
        : emptyQueueState();

    queueStateCache.set(workspaceId, state);

    return state;
  } catch {
    const state = emptyQueueState();

    queueStateCache.set(workspaceId, state);

    return state;
  }
};

const persistQueueState = (
  workspaceId: string,
  state: AutomationEvaluationQueueState,
): boolean => {
  queueStateCache.set(workspaceId, state);

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(
      getStorageKey(workspaceId),
      JSON.stringify(state),
    );

    return true;
  } catch {
    return false;
  }
};

export const queueInboxAutomationEvaluations = ({
  workspaceId,
  messageIds,
  prioritize = false,
}: {
  workspaceId: string;
  messageIds: string[];
  prioritize?: boolean;
}): boolean => {
  const state = readQueueState(workspaceId);
  const terminalMessageIds = new Set(state.terminalMessageIds);
  const pendingMessageIds = new Set(state.pendingMessageIds);
  const newMessageIds = uniqueMessageIds(messageIds).filter(
    (messageId) =>
      !terminalMessageIds.has(messageId) && !pendingMessageIds.has(messageId),
  );
  const nextPendingMessageIds = prioritize
    ? [...newMessageIds, ...state.pendingMessageIds]
    : [...state.pendingMessageIds, ...newMessageIds];

  return persistQueueState(workspaceId, {
    ...state,
    pendingMessageIds: nextPendingMessageIds.slice(0, MAX_PENDING_EVALUATIONS),
  });
};

const markTerminal = (workspaceId: string, messageIds: string[]): boolean => {
  const state = readQueueState(workspaceId);
  const terminalMessageIds = uniqueMessageIds([
    ...state.terminalMessageIds,
    ...messageIds,
  ]).slice(-MAX_TERMINAL_EVALUATIONS);
  const terminalMessageIdSet = new Set(terminalMessageIds);

  return persistQueueState(workspaceId, {
    ...state,
    pendingMessageIds: state.pendingMessageIds.filter(
      (messageId) => !terminalMessageIdSet.has(messageId),
    ),
    terminalMessageIds,
  });
};

const reconcilePendingEvaluations = async (
  workspaceId: string,
): Promise<InboxAutomationReconciliationResult> => {
  const attemptedMessageIds = readQueueState(
    workspaceId,
  ).pendingMessageIds.slice(0, MAX_EVALUATIONS_PER_RECONCILIATION);
  let queuedCount = 0;
  let alreadyQueuedCount = 0;
  let skippedCount = 0;
  let retryableFailureCount = 0;
  let persistenceFailed = false;
  const warnings: string[] = [];

  for (
    let offset = 0;
    offset < attemptedMessageIds.length;
    offset += EVALUATION_BATCH_SIZE
  ) {
    const batch = attemptedMessageIds.slice(
      offset,
      offset + EVALUATION_BATCH_SIZE,
    );
    const results = await Promise.all(
      batch.map(async (messageId) => {
        try {
          return {
            messageId,
            result: await triggerInboxAutomationsAfterEmailSync({ messageId }),
          };
        } catch (error) {
          return { messageId, error };
        }
      }),
    );
    const terminalMessageIds: string[] = [];

    for (const result of results) {
      if ('error' in result) {
        if (
          result.error instanceof InboxAutomationEvaluationRequestError &&
          result.error.retryable === false
        ) {
          terminalMessageIds.push(result.messageId);
          warnings.push(
            result.error.status === 401 || result.error.status === 403
              ? 'Você não possui autorização para avaliar uma automação pendente.'
              : result.error.message,
          );
        } else {
          retryableFailureCount += 1;
        }

        continue;
      }

      terminalMessageIds.push(result.messageId);

      if (result.result.status === 'queued') {
        queuedCount += 1;
      } else if (result.result.status === 'alreadyQueued') {
        alreadyQueuedCount += 1;
      } else {
        skippedCount += 1;

        if (result.result.reason) {
          warnings.push(result.result.reason);
        }
      }
    }

    if (
      terminalMessageIds.length > 0 &&
      !markTerminal(workspaceId, terminalMessageIds)
    ) {
      persistenceFailed = true;
    }
  }

  if (retryableFailureCount > 0) {
    warnings.push(
      `${retryableFailureCount} avaliação(ões) de automação ficaram pendentes e serão tentadas novamente.`,
    );
  }

  if (persistenceFailed) {
    warnings.push(
      'O navegador não conseguiu persistir todo o estado das automações pendentes.',
    );
  }

  return {
    queuedCount,
    alreadyQueuedCount,
    skippedCount,
    pendingCount: readQueueState(workspaceId).pendingMessageIds.length,
    warnings: [...new Set(warnings)],
  };
};

export const reconcileInboxAutomationEvaluations = ({
  workspaceId,
  messageIds = [],
  prioritizedMessageIds = [],
}: {
  workspaceId: string;
  messageIds?: string[];
  prioritizedMessageIds?: string[];
}): Promise<InboxAutomationReconciliationResult> => {
  const prioritizedMessageIdSet = new Set(prioritizedMessageIds);

  queueInboxAutomationEvaluations({
    workspaceId,
    messageIds: messageIds.filter(
      (messageId) => !prioritizedMessageIdSet.has(messageId),
    ),
  });
  queueInboxAutomationEvaluations({
    workspaceId,
    messageIds: prioritizedMessageIds,
    prioritize: true,
  });

  const previousReconciliation = reconciliationTails.get(workspaceId);
  const reconciliation = (previousReconciliation ?? Promise.resolve())
    .catch(() => undefined)
    .then(() => reconcilePendingEvaluations(workspaceId));

  reconciliationTails.set(workspaceId, reconciliation);

  return reconciliation.finally(() => {
    if (reconciliationTails.get(workspaceId) === reconciliation) {
      reconciliationTails.delete(workspaceId);
    }
  });
};
