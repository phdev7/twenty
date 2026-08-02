import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { getInboxAutomationEvaluationRoute } from '@/inbox/utils/getInboxAutomationEvaluationRoute';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

export type InboxAutomationEvaluationStatus =
  | 'queued'
  | 'alreadyQueued'
  | 'skipped';

export type InboxAutomationEvaluationResult = {
  status: InboxAutomationEvaluationStatus;
  evaluationId: string | null;
  messageId: string;
  reason?: string;
};

export class InboxAutomationEvaluationRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'InboxAutomationEvaluationRequestError';
  }
}

const isEvaluationStatus = (
  value: unknown,
): value is InboxAutomationEvaluationStatus =>
  value === 'queued' || value === 'alreadyQueued' || value === 'skipped';

const parseResponseBody = (rawBody: string): unknown => {
  if (rawBody.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return undefined;
  }
};

const isRetryableStatus = (status: number): boolean =>
  status === 404 ||
  status === 405 ||
  status === 408 ||
  status === 409 ||
  status === 425 ||
  status === 429 ||
  status >= 500;

export const triggerInboxAutomationsAfterEmailSync = async ({
  messageId,
}: {
  messageId: string;
}): Promise<InboxAutomationEvaluationResult> => {
  const accessToken = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  if (!accessToken) {
    throw new InboxAutomationEvaluationRequestError(
      'A sessão ainda não está pronta para avaliar a automação.',
      true,
    );
  }

  const response = await fetch(
    `${REACT_APP_SERVER_BASE_URL}${getInboxAutomationEvaluationRoute(messageId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    },
  ).catch((error) => {
    throw new InboxAutomationEvaluationRequestError(
      error instanceof Error
        ? error.message
        : 'O endpoint de automação está indisponível.',
      true,
    );
  });
  const parsedBody = parseResponseBody(await response.text());

  if (!response.ok) {
    throw new InboxAutomationEvaluationRequestError(
      `A avaliação da automação respondeu com status ${response.status}.`,
      isRetryableStatus(response.status),
      response.status,
    );
  }

  if (
    typeof parsedBody !== 'object' ||
    parsedBody === null ||
    !('status' in parsedBody) ||
    !isEvaluationStatus(parsedBody.status) ||
    !('messageId' in parsedBody) ||
    parsedBody.messageId !== messageId ||
    !('evaluationId' in parsedBody) ||
    (parsedBody.evaluationId !== null &&
      typeof parsedBody.evaluationId !== 'string') ||
    ('reason' in parsedBody &&
      parsedBody.reason !== undefined &&
      typeof parsedBody.reason !== 'string')
  ) {
    throw new InboxAutomationEvaluationRequestError(
      'O endpoint retornou um estado de automação incompatível. A tentativa foi mantida.',
      true,
    );
  }

  return parsedBody as InboxAutomationEvaluationResult;
};
