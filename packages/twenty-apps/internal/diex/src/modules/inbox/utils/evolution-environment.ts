import { createHash } from 'node:crypto';

import {
  EVOLUTION_SERVER_INSTANCE_CLAIM_PREFIX,
  EVOLUTION_SERVER_SECRET_CLAIM_PREFIX,
  EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/evolution.constants';

const readRequiredEnvironmentValue = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is not configured. Complete the Evolution setup in the authenticated application settings.`,
    );
  }

  return value;
};

export const getEvolutionConfiguration = () => {
  const baseUrl = readRequiredEnvironmentValue('EVOLUTION_BASE_URL').replace(
    /\/+$/,
    '',
  );
  const instanceName = readRequiredEnvironmentValue('EVOLUTION_INSTANCE_NAME');
  const apiKey = readRequiredEnvironmentValue('EVOLUTION_API_KEY');
  const webhookSecret = readRequiredEnvironmentValue(
    'EVOLUTION_WEBHOOK_SECRET',
  );

  const parsedBaseUrl = new URL(baseUrl);
  const allowPrivateNetwork = readBooleanEnvironmentValue(
    'DIEX_EVOLUTION_ALLOW_PRIVATE_NETWORK',
    false,
  );

  if (
    parsedBaseUrl.protocol !== 'https:' &&
    !(parsedBaseUrl.protocol === 'http:' && allowPrivateNetwork)
  ) {
    throw new Error(
      'EVOLUTION_BASE_URL must use HTTPS unless private-network access was explicitly enabled by the infrastructure administrator.',
    );
  }

  if (
    parsedBaseUrl.username ||
    parsedBaseUrl.password ||
    parsedBaseUrl.pathname !== '/' ||
    parsedBaseUrl.search ||
    parsedBaseUrl.hash
  ) {
    throw new Error(
      'EVOLUTION_BASE_URL must be an origin without credentials, path, query string or fragment.',
    );
  }

  if (!/^[a-zA-Z0-9._-]{2,80}$/.test(instanceName)) {
    throw new Error(
      'EVOLUTION_INSTANCE_NAME must contain only letters, numbers, dots, underscores or hyphens.',
    );
  }

  if (webhookSecret.length < 24) {
    throw new Error(
      'EVOLUTION_WEBHOOK_SECRET must contain at least 24 characters.',
    );
  }

  return {
    apiKey,
    baseUrl,
    instanceName,
    webhookSecret,
  };
};

export const normalizeEvolutionInstanceName = (instanceName: string): string =>
  instanceName.trim().toLowerCase();

export const hashSecret = (secret: string): string =>
  createHash('sha256').update(secret).digest('hex');

export const buildEvolutionSecretClaimKey = (secret: string): string =>
  `${EVOLUTION_SERVER_SECRET_CLAIM_PREFIX}${hashSecret(secret)}`;

export const buildEvolutionInstanceClaimKey = (instanceName: string): string =>
  `${EVOLUTION_SERVER_INSTANCE_CLAIM_PREFIX}${normalizeEvolutionInstanceName(instanceName)}`;

type ApplicationAccessTokenClaims = {
  userId?: string;
  userWorkspaceId?: string;
  workspaceId?: string;
};

export const getAuthenticatedRequestIdentity = (
  routeUserWorkspaceId: string | null,
): { userId: string; userWorkspaceId: string; workspaceId: string } => {
  if (!routeUserWorkspaceId) {
    throw new Error('An authenticated workspace member is required.');
  }

  const token = process.env.TWENTY_APP_ACCESS_TOKEN;
  const encodedPayload = token?.split('.')[1];

  if (!encodedPayload) {
    throw new Error(
      'The authenticated request identity could not be resolved.',
    );
  }

  try {
    const claims = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as ApplicationAccessTokenClaims;

    if (
      !claims.userId ||
      !claims.userWorkspaceId ||
      !claims.workspaceId ||
      claims.userWorkspaceId !== routeUserWorkspaceId
    ) {
      throw new Error(
        'The authenticated request identity does not match the route context.',
      );
    }

    return {
      userId: claims.userId,
      userWorkspaceId: claims.userWorkspaceId,
      workspaceId: claims.workspaceId,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('route context')) {
      throw error;
    }

    throw new Error(
      'The authenticated request identity could not be resolved.',
    );
  }
};

export const getCurrentWorkspaceId = (): string => {
  const token = process.env.TWENTY_APP_ACCESS_TOKEN;
  const encodedPayload = token?.split('.')[1];

  if (!encodedPayload) {
    throw new Error('The current workspace could not be resolved.');
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as unknown;

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'workspaceId' in payload &&
      typeof payload.workspaceId === 'string' &&
      payload.workspaceId.length > 0
    ) {
      return payload.workspaceId;
    }
  } catch {
    throw new Error('The current workspace token is invalid.');
  }

  throw new Error('The current workspace could not be resolved.');
};

// The Evolution calls this URL from outside the deployment, so it has to be
// the public address. TWENTY_API_URL is the in-network one and resolves to
// nothing from the provider's side.
export const buildEvolutionWebhookUrl = (): string => {
  const publicApiUrl = process.env.TWENTY_PUBLIC_API_URL?.replace(/\/+$/, '');
  const apiUrl =
    publicApiUrl || process.env.TWENTY_API_URL?.replace(/\/+$/, '');

  if (!apiUrl) {
    throw new Error(
      'TWENTY_PUBLIC_API_URL is not available to build the webhook URL.',
    );
  }

  // A single-label hostname is a container name on some internal network, and
  // the Evolution resolves it to nothing. Loopback stays allowed for a local
  // Evolution running next to the developer's server.
  const { hostname } = new URL(apiUrl);

  if (
    hostname.split('.').length < 2 &&
    !['localhost', '127.0.0.1'].includes(hostname)
  ) {
    throw new Error(
      `The webhook URL would point to "${hostname}", a hostname the Evolution cannot reach. Configure SERVER_URL with the public address.`,
    );
  }

  return `${apiUrl}/webhooks/server/${EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER}`;
};

export const readBooleanEnvironmentValue = (
  name: string,
  fallback: boolean,
): boolean => {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value);
};

export const readResponseSlaMinutes = (): number => {
  const parsed = Number(process.env.DEFAULT_RESPONSE_SLA_MINUTES ?? 60);

  if (!Number.isFinite(parsed)) {
    return 60;
  }

  return Math.min(10_080, Math.max(1, Math.round(parsed)));
};
