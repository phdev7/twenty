import { isDefined } from 'diex-shared/utils';

import { type InboxAutomationEvaluationMetadata } from 'src/modules/inbox/types/inbox-automation.types';

const METADATA_KEY = 'automationEvaluation';

export const readInboxAutomationEvaluationMetadata = (
  metadata: Record<string, unknown> | null,
): InboxAutomationEvaluationMetadata | null => {
  const candidate = metadata?.[METADATA_KEY];

  if (
    !isDefined(candidate) ||
    typeof candidate !== 'object' ||
    typeof (candidate as { evaluationId?: unknown }).evaluationId !== 'string'
  ) {
    return null;
  }

  return candidate as InboxAutomationEvaluationMetadata;
};

export const mergeInboxAutomationEvaluationMetadata = (
  metadata: Record<string, unknown> | null,
  evaluation: InboxAutomationEvaluationMetadata,
): Record<string, unknown> => ({
  ...(metadata ?? undefined),
  [METADATA_KEY]: evaluation,
});
