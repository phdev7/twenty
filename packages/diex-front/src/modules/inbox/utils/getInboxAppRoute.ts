import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

export const getInboxAppRoute = async <TResponse>(
  route: string,
): Promise<TResponse> => {
  const accessToken = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  if (!accessToken) {
    throw new Error('missing-token');
  }

  const response = await fetch(`${REACT_APP_SERVER_BASE_URL}${route}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const rawBody = await response.text();
  const parsedBody =
    rawBody.trim().length > 0 ? JSON.parse(rawBody) : undefined;

  if (!response.ok) {
    throw new Error(String(response.status));
  }

  return parsedBody as TResponse;
};
