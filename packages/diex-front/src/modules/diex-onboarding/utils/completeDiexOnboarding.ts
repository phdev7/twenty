import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const COMPLETE_DIEX_ONBOARDING_ROUTE =
  '/rest/diex/onboarding/operation-context';

export const completeDiexOnboarding = async (
  operationDescription: string,
): Promise<void> => {
  const accessToken = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  if (!accessToken) {
    throw new Error('missing-token');
  }

  const response = await fetch(
    `${REACT_APP_SERVER_BASE_URL}${COMPLETE_DIEX_ONBOARDING_ROUTE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ operationDescription }),
    },
  );

  if (!response.ok) {
    // The server explains why (no AI provider configured, model unavailable,
    // credits exhausted). Discarding it left the user re-writing a description
    // that was never the problem.
    const reason = await response
      .json()
      .then((body) => body?.messages?.[0] ?? body?.message)
      .catch(() => undefined);

    throw new Error(reason ?? `HTTP ${response.status}`);
  }
};
