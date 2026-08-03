import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

export const postLogicFunction = async <TResponse,>(
  route: string,
  body: Record<string, unknown>,
): Promise<TResponse> => {
  const accessToken = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  if (!accessToken) {
    throw new Error('missing-access-token');
  }

  const response = await fetch(`${REACT_APP_SERVER_BASE_URL}/s${route}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(String(response.status));
  }

  return (await response.json()) as TResponse;
};
