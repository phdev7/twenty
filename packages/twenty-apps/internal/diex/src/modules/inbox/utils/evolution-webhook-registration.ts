import { EVOLUTION_EVENTS } from 'src/modules/inbox/constants/evolution.constants';
import {
  buildEvolutionInstanceClaimKey,
  buildEvolutionSecretClaimKey,
  buildEvolutionWebhookUrl,
} from 'src/modules/inbox/utils/evolution-environment';
import { safeEvolutionFetch } from 'src/modules/inbox/utils/safe-evolution-fetch';
import { type WhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';
import { appKeyValue } from 'src/utils/app-key-value';

const ACTIVE_SECRET_CLAIM_KEY = 'evolution:active-secret-claim';
const ACTIVE_INSTANCE_CLAIM_KEY = 'evolution:active-instance-claim';

export type EvolutionWebhookRegistration = {
  instanceName: string;
  webhookUrl: string;
  providerStatus: number;
  events: readonly string[];
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
  const webhookHeaders = {
    'X-Diex-Webhook-Secret': webhookSecret,
  };
  let response = await safeEvolutionFetch({
    baseUrl,
    path: `/webhook/set/${encodeURIComponent(instanceName)}`,
    method: 'POST',
    headers,
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        base64: true,
        events: EVOLUTION_EVENTS,
        headers: webhookHeaders,
      },
    }),
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
        headers: webhookHeaders,
      }),
    });
  }

  return response;
};

// Claiming and webhook configuration always travel together: a webhook the
// route cannot map back to a workspace is silently dropped, and a claim with
// no webhook behind it never receives anything. Both are idempotent so any
// entry point — the QR connection or the explicit configure action — can call
// this and end with a channel that actually delivers.
export const registerEvolutionWebhook = async ({
  workspaceId,
  configuration,
}: {
  workspaceId: string;
  configuration: WhatsappProvisioning;
}): Promise<EvolutionWebhookRegistration> => {
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
