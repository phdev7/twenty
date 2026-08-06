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
    throw new Error(String(response.status));
  }
};
