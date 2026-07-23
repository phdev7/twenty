import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  EVOLUTION_WEBHOOK_SECRET_HEADER,
  PROCESS_EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/evolution.constants';
import {
  buildEvolutionInstanceClaimKey,
  buildEvolutionSecretClaimKey,
} from 'src/modules/inbox/utils/evolution-environment';
import { extractEvolutionInstanceName } from 'src/modules/inbox/utils/evolution-payload';
import { appKeyValue } from 'src/utils/app-key-value';

type EvolutionWebhookResolution = {
  workspaceId: string;
  targetLogicFunctionUniversalIdentifier: string;
  payload: Record<string, unknown>;
};

const getHeader = (
  headers: Record<string, string | undefined>,
  headerName: string,
): string | undefined => {
  const directValue = headers[headerName];

  if (directValue) {
    return directValue.trim();
  }

  const entry = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === headerName.toLowerCase(),
  );

  return entry?.[1]?.trim();
};

const readWebhookSecret = (
  headers: Record<string, string | undefined>,
): string | undefined => {
  const explicitSecret =
    getHeader(headers, EVOLUTION_WEBHOOK_SECRET_HEADER) ??
    getHeader(headers, 'x-evolution-webhook-secret');

  if (explicitSecret) {
    return explicitSecret;
  }

  const authorization = getHeader(headers, 'authorization');

  return authorization?.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : undefined;
};

export const evolutionWebhookRouteHandler = async (
  routePayload: RoutePayload<Record<string, unknown>>,
): Promise<EvolutionWebhookResolution> => {
  const body = routePayload.body;
  const webhookSecret = readWebhookSecret(routePayload.headers);

  if (!body || !webhookSecret || webhookSecret.length < 24) {
    throw new Error('Evolution webhook authorization was rejected.');
  }

  const workspaceId = await appKeyValue.get<string>(
    buildEvolutionSecretClaimKey(webhookSecret),
    { scope: 'SERVER' },
  );
  const instanceName = extractEvolutionInstanceName(body);

  if (!workspaceId || !instanceName) {
    throw new Error('Evolution webhook routing was rejected.');
  }

  const instanceWorkspaceId = await appKeyValue.get<string>(
    buildEvolutionInstanceClaimKey(instanceName),
    { scope: 'SERVER' },
  );

  if (instanceWorkspaceId !== workspaceId) {
    throw new Error('Evolution webhook instance isolation check failed.');
  }

  return {
    workspaceId,
    targetLogicFunctionUniversalIdentifier:
      PROCESS_EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
    payload: body,
  };
};

export default defineLogicFunction({
  universalIdentifier: EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'diex-evolution-webhook',
  description:
    'Authenticates a shared Evolution webhook and routes it to the workspace that exclusively claimed the instance.',
  timeoutSeconds: 15,
  handler: evolutionWebhookRouteHandler,
  serverRouteTriggerSettings: {
    forwardedRequestHeaders: [
      EVOLUTION_WEBHOOK_SECRET_HEADER,
      'x-evolution-webhook-secret',
      'authorization',
    ],
  },
});
