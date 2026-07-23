import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EVOLUTION_CONFIGURE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  EVOLUTION_CONFIGURE_ROUTE,
  EVOLUTION_EVENTS,
} from 'src/modules/inbox/constants/evolution.constants';
import {
  buildEvolutionInstanceClaimKey,
  buildEvolutionSecretClaimKey,
  buildEvolutionWebhookUrl,
  getAuthenticatedRequestIdentity,
  getCurrentWorkspaceId,
  getEvolutionConfiguration,
} from 'src/modules/inbox/utils/evolution-environment';
import { safeEvolutionFetch } from 'src/modules/inbox/utils/safe-evolution-fetch';
import { appKeyValue } from 'src/utils/app-key-value';

type ConfigureEvolutionResult = {
  configured: boolean;
  instanceName: string;
  webhookUrl: string;
  providerStatus: number;
  events: readonly string[];
};

const ACTIVE_SECRET_CLAIM_KEY = 'evolution:active-secret-claim';
const ACTIVE_INSTANCE_CLAIM_KEY = 'evolution:active-instance-claim';

const assertCanConfigureApplications = async (
  routeUserWorkspaceId: string | null,
): Promise<void> => {
  const identity = getAuthenticatedRequestIdentity(routeUserWorkspaceId);
  const metadataClient = new MetadataApiClient();
  const { currentUser } = await metadataClient.query({
    currentUser: {
      id: true,
      currentUserWorkspace: {
        id: true,
        permissionFlags: true,
      },
    },
  });
  const currentUserWorkspace = currentUser.currentUserWorkspace;

  if (
    currentUser.id !== identity.userId ||
    currentUserWorkspace?.id !== identity.userWorkspaceId ||
    !currentUserWorkspace.permissionFlags?.includes('APPLICATIONS')
  ) {
    throw new Error(
      'Application settings permission is required to configure Evolution.',
    );
  }
};

const postEvolutionWebhookConfiguration = async ({
  baseUrl,
  instanceName,
  apiKey,
  webhookSecret,
  webhookUrl,
}: {
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  webhookSecret: string;
  webhookUrl: string;
}): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: apiKey,
  };
  const nestedPayload = {
    webhook: {
      enabled: true,
      url: webhookUrl,
      byEvents: false,
      base64: true,
      events: EVOLUTION_EVENTS,
      headers: {
        'X-Diex-Webhook-Secret': webhookSecret,
      },
    },
  };
  const nestedBody = JSON.stringify(nestedPayload);
  let response = await safeEvolutionFetch({
    baseUrl,
    path: `/webhook/set/${encodeURIComponent(instanceName)}`,
    method: 'POST',
    headers,
    body: nestedBody,
  });

  if (response.status === 400) {
    response = await safeEvolutionFetch({
      baseUrl,
      path: `/webhook/set/${encodeURIComponent(instanceName)}`,
      method: 'POST',
      headers,
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: true,
        base64: true,
        events: EVOLUTION_EVENTS,
        headers: {
          'X-Diex-Webhook-Secret': webhookSecret,
        },
      }),
    });
  }

  return response;
};

export const configureEvolutionInboxHandler = async (
  routePayload: RoutePayload<Record<string, unknown>>,
): Promise<ConfigureEvolutionResult> => {
  await assertCanConfigureApplications(routePayload.userWorkspaceId);

  const workspaceId = getCurrentWorkspaceId();
  const configuration = getEvolutionConfiguration();
  const webhookUrl = buildEvolutionWebhookUrl();
  const secretClaimKey = buildEvolutionSecretClaimKey(
    configuration.webhookSecret,
  );
  const instanceClaimKey = buildEvolutionInstanceClaimKey(
    configuration.instanceName,
  );
  const [
    previousSecretOwner,
    previousInstanceOwner,
    previousActiveSecretClaim,
    previousActiveInstanceClaim,
  ] = await Promise.all([
    appKeyValue.get<string>(secretClaimKey, { scope: 'SERVER' }),
    appKeyValue.get<string>(instanceClaimKey, { scope: 'SERVER' }),
    appKeyValue.get<string>(ACTIVE_SECRET_CLAIM_KEY),
    appKeyValue.get<string>(ACTIVE_INSTANCE_CLAIM_KEY),
  ]);
  const claimedSecretDuringThisAttempt = previousSecretOwner === null;
  const claimedInstanceDuringThisAttempt = previousInstanceOwner === null;

  if (previousSecretOwner && previousSecretOwner !== workspaceId) {
    throw new Error(
      'This Evolution webhook secret is already assigned to another workspace.',
    );
  }

  if (previousInstanceOwner && previousInstanceOwner !== workspaceId) {
    throw new Error(
      'This Evolution instance is already assigned to another workspace.',
    );
  }

  try {
    await appKeyValue.set(secretClaimKey, workspaceId, { scope: 'SERVER' });
    await appKeyValue.set(instanceClaimKey, workspaceId, { scope: 'SERVER' });

    const response = await postEvolutionWebhookConfiguration({
      ...configuration,
      webhookUrl,
    });

    if (!response.ok) {
      throw new Error(
        `Evolution rejected the webhook configuration (${response.status}).`,
      );
    }

    await appKeyValue.set(ACTIVE_SECRET_CLAIM_KEY, secretClaimKey);
    await appKeyValue.set(ACTIVE_INSTANCE_CLAIM_KEY, instanceClaimKey);

    if (
      previousActiveSecretClaim &&
      previousActiveSecretClaim !== secretClaimKey
    ) {
      await appKeyValue
        .delete(previousActiveSecretClaim, { scope: 'SERVER' })
        .catch(() => false);
    }

    if (
      previousActiveInstanceClaim &&
      previousActiveInstanceClaim !== instanceClaimKey
    ) {
      await appKeyValue
        .delete(previousActiveInstanceClaim, { scope: 'SERVER' })
        .catch(() => false);
    }

    return {
      configured: true,
      instanceName: configuration.instanceName,
      webhookUrl,
      providerStatus: response.status,
      events: EVOLUTION_EVENTS,
    };
  } catch (error) {
    if (claimedInstanceDuringThisAttempt) {
      await appKeyValue
        .delete(instanceClaimKey, { scope: 'SERVER' })
        .catch(() => false);
    }

    if (claimedSecretDuringThisAttempt) {
      await appKeyValue
        .delete(secretClaimKey, { scope: 'SERVER' })
        .catch(() => false);
    }

    throw error;
  }
};

export default defineLogicFunction({
  universalIdentifier: EVOLUTION_CONFIGURE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'configure-diex-evolution-inbox',
  description:
    'Claims the isolated Evolution instance for the current workspace and configures its signed webhook without accepting or returning secrets.',
  timeoutSeconds: 30,
  handler: configureEvolutionInboxHandler,
  httpRouteTriggerSettings: {
    path: EVOLUTION_CONFIGURE_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
