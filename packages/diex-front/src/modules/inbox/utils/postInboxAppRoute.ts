import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

export const postInboxAppRoute = async <TResponse>(
  route: string,
  body: unknown,
): Promise<TResponse> => {
  const accessToken = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  if (!accessToken) {
    throw new Error('missing-token');
  }

  const response = await fetch(`${REACT_APP_SERVER_BASE_URL}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const rawBody = await response.text();
  const parsedBody =
    rawBody.trim().length > 0 ? JSON.parse(rawBody) : undefined;

  if (!response.ok) {
    throw new Error(String(response.status));
  }

  return parsedBody as TResponse;
};
