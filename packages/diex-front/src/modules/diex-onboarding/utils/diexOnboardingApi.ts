import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const requestDiexOnboardingRoute = async <TResponse>(
  route: string,
  method: 'GET' | 'POST',
  body?: unknown,
): Promise<TResponse> => {
  const accessToken = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  if (!accessToken) {
    throw new Error('missing-token');
  }

  const response = await fetch(`${REACT_APP_SERVER_BASE_URL}${route}`, {
    method,
    headers: {
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${accessToken}`,
    },
    ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  const rawBody = await response.text();
  const parsedBody =
    rawBody.trim().length > 0 ? JSON.parse(rawBody) : undefined;

  if (!response.ok) {
    const message =
      parsedBody?.message ?? parsedBody?.messages?.[0] ?? `HTTP ${response.status}`;

    throw new Error(String(message));
  }

  if (method === 'POST' && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('diex-onboarding-updated'));
  }

  return parsedBody as TResponse;
};

export const getDiexOnboardingRoute = async <TResponse>(
  route: string,
): Promise<TResponse> => requestDiexOnboardingRoute<TResponse>(route, 'GET');

export const postDiexOnboardingRoute = async <TResponse>(
  route: string,
  body?: unknown,
): Promise<TResponse> =>
  requestDiexOnboardingRoute<TResponse>(route, 'POST', body);
