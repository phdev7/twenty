import {
  InboxAutomationEvaluationRequestError,
  triggerInboxAutomationsAfterEmailSync,
} from '@/inbox/utils/triggerInboxAutomationsAfterEmailSync';

const AUTOMATION_EVALUATION_QUEUE_VERSION = 2;
const LEGACY_AUTOMATION_EVALUATION_QUEUE_VERSION = 1;
const AUTOMATION_EVALUATION_STORAGE_PREFIX =
  'diex-inbox-automation-evaluations';
const MAX_PENDING_EVALUATIONS = 5_000;
const MAX_TERMINAL_EVALUATIONS = 5_000;
const MAX_EVALUATIONS_PER_RECONCILIATION = 50;
const EVALUATION_BATCH_SIZE = 5;
const INITIAL_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 5 * 60_000;

type AutomationEvaluationQueueState = {
  version: typeof AUTOMATION_EVALUATION_QUEUE_VERSION;
  pendingMessageIds: string[];
  terminalMessageIds: string[];
  retryCountByMessageId: Record<string, number>;
  nextAttemptAtByMessageId: Record<string, number>;
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
  retryCountByMessageId: {},
  nextAttemptAtByMessageId: {},
});

const getStorageKey = (workspaceId: string): string =>
  `${AUTOMATION_EVALUATION_STORAGE_PREFIX}:${workspaceId}`;

const isValidMessageId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 64;

const uniqueMessageIds = (values: unknown[]): string[] => [
  ...new Set(values.filter(isValidMessageId)),
];

const readNumberMap = (value: unknown): Record<string, number> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, entry]) =>
        isValidMessageId(key) &&
        typeof entry === 'number' &&
        Number.isFinite(entry) &&
        entry >= 0,
    ),
  );
};

const pickPendingMetadata = (
  pendingMessageIds: string[],
  retryCountByMessageId: Record<string, number>,
  nextAttemptAtByMessageId: Record<string, number>,
): Pick<
  AutomationEvaluationQueueState,
  'retryCountByMessageId' | 'nextAttemptAtByMessageId'
> => {
  const pendingMessageIdSet = new Set(pendingMessageIds);

  return {
    retryCountByMessageId: Object.fromEntries(
      Object.entries(retryCountByMessageId).filter(([messageId]) =>
        pendingMessageIdSet.has(messageId),
      ),
    ),
    nextAttemptAtByMessageId: Object.fromEntries(
      Object.entries(nextAttemptAtByMessageId).filter(([messageId]) =>
        pendingMessageIdSet.has(messageId),
      ),
    ),
  };
};

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
    ) as {
      version?: unknown;
      pendingMessageIds?: unknown;
      terminalMessageIds?: unknown;
      retryCountByMessageId?: unknown;
      nextAttemptAtByMessageId?: unknown;
    } | null;
    const isSupportedVersion =
      parsedState?.version === AUTOMATION_EVALUATION_QUEUE_VERSION ||
      parsedState?.version === LEGACY_AUTOMATION_EVALUATION_QUEUE_VERSION;
    const persistedPendingMessageIds = Array.isArray(
      parsedState?.pendingMessageIds,
    )
      ? parsedState.pendingMessageIds
      : [];
    const persistedTerminalMessageIds = Array.isArray(
      parsedState?.terminalMessageIds,
    )
      ? parsedState.terminalMessageIds
      : [];
    const pendingMessageIds = uniqueMessageIds([
      ...persistedPendingMessageIds,
      ...(parsedState?.version === LEGACY_AUTOMATION_EVALUATION_QUEUE_VERSION
        ? persistedTerminalMessageIds
        : []),
    ]).slice(0, MAX_PENDING_EVALUATIONS);
    const state: AutomationEvaluationQueueState = isSupportedVersion
      ? {
          version: AUTOMATION_EVALUATION_QUEUE_VERSION,
          pendingMessageIds,
          terminalMessageIds:
            parsedState?.version === LEGACY_AUTOMATION_EVALUATION_QUEUE_VERSION
              ? []
              : uniqueMessageIds(persistedTerminalMessageIds).slice(
                  -MAX_TERMINAL_EVALUATIONS,
                ),
          retryCountByMessageId: readNumberMap(
            parsedState?.retryCountByMessageId,
          ),
          nextAttemptAtByMessageId: readNumberMap(
            parsedState?.nextAttemptAtByMessageId,
          ),
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
  const retryCountByMessageId = { ...state.retryCountByMessageId };
  const nextAttemptAtByMessageId = { ...state.nextAttemptAtByMessageId };

  for (const messageId of newMessageIds) {
    retryCountByMessageId[messageId] = 0;
    nextAttemptAtByMessageId[messageId] = 0;
  }

  return persistQueueState(workspaceId, {
    ...state,
    pendingMessageIds: nextPendingMessageIds.slice(0, MAX_PENDING_EVALUATIONS),
    ...pickPendingMetadata(
      nextPendingMessageIds.slice(0, MAX_PENDING_EVALUATIONS),
      retryCountByMessageId,
      nextAttemptAtByMessageId,
    ),
  });
};

const markTerminal = (workspaceId: string, messageIds: string[]): boolean => {
  const state = readQueueState(workspaceId);
  const terminalMessageIds = uniqueMessageIds([
    ...state.terminalMessageIds,
    ...messageIds,
  ]).slice(-MAX_TERMINAL_EVALUATIONS);
  const terminalMessageIdSet = new Set(terminalMessageIds);
  const pendingMessageIds = state.pendingMessageIds.filter(
    (messageId) => !terminalMessageIdSet.has(messageId),
  );

  return persistQueueState(workspaceId, {
    ...state,
    pendingMessageIds,
    ...pickPendingMetadata(
      pendingMessageIds,
      state.retryCountByMessageId,
      state.nextAttemptAtByMessageId,
    ),
    terminalMessageIds: terminalMessageIds.slice(-MAX_TERMINAL_EVALUATIONS),
  });
};

const scheduleRetry = (
  workspaceId: string,
  messageId: string,
  delayMs?: number,
): boolean => {
  const state = readQueueState(workspaceId);

  if (!state.pendingMessageIds.includes(messageId)) {
    return true;
  }

  const retryCount = (state.retryCountByMessageId[messageId] ?? 0) + 1;
  const retryDelay =
    delayMs ??
    Math.min(
      MAX_RETRY_DELAY_MS,
      INITIAL_RETRY_DELAY_MS * 2 ** Math.min(retryCount - 1, 6),
    );

  return persistQueueState(workspaceId, {
    ...state,
    retryCountByMessageId: {
      ...state.retryCountByMessageId,
      [messageId]: retryCount,
    },
    nextAttemptAtByMessageId: {
      ...state.nextAttemptAtByMessageId,
      [messageId]: Date.now() + retryDelay,
    },
  });
};

const isTerminalEvaluationState = (
  evaluationState: string | undefined,
): boolean =>
  evaluationState === 'done' || evaluationState === 'done_with_warnings';

const reconcilePendingEvaluations = async (
  workspaceId: string,
): Promise<InboxAutomationReconciliationResult> => {
  const now = Date.now();
  const queueState = readQueueState(workspaceId);
  const attemptedMessageIds = queueState.pendingMessageIds
    .filter(
      (messageId) =>
        (queueState.nextAttemptAtByMessageId[messageId] ?? 0) <= now,
    )
    .slice(0, MAX_EVALUATIONS_PER_RECONCILIATION);
  let queuedCount = 0;
  let alreadyQueuedCount = 0;
  let skippedCount = 0;
  let retryableFailureCount = 0;
  let acceptedPendingCount = 0;
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
    const retryMessageIds: string[] = [];

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
          retryMessageIds.push(result.messageId);
        }

        continue;
      }

      if (result.result.status === 'queued') {
        queuedCount += 1;
      } else if (result.result.status === 'alreadyQueued') {
        alreadyQueuedCount += 1;
      } else {
        skippedCount += 1;
      }

      if (
        result.result.status === 'skipped' ||
        isTerminalEvaluationState(result.result.evaluationState)
      ) {
        terminalMessageIds.push(result.messageId);
      } else {
        acceptedPendingCount += 1;
        retryMessageIds.push(result.messageId);
      }

      if (result.result.reason) {
        warnings.push(result.result.reason);
      }
    }

    if (
      terminalMessageIds.length > 0 &&
      !markTerminal(workspaceId, terminalMessageIds)
    ) {
      persistenceFailed = true;
    }

    for (const messageId of retryMessageIds) {
      if (!scheduleRetry(workspaceId, messageId)) {
        persistenceFailed = true;
      }
    }
  }

  const pendingCount = readQueueState(workspaceId).pendingMessageIds.length;

  if (retryableFailureCount + acceptedPendingCount > 0) {
    warnings.push(
      `${retryableFailureCount + acceptedPendingCount} avaliação(ões) de automação ficaram pendentes e serão tentadas novamente.`,
    );
  } else if (pendingCount > 0) {
    warnings.push(
      `${pendingCount} avaliação(ões) de automação continuam pendentes e serão tentadas novamente.`,
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
    pendingCount,
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
