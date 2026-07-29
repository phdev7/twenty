import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EVOLUTION_CONFIGURE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  EVOLUTION_CONFIGURE_ROUTE,
} from 'src/modules/inbox/constants/evolution.constants';
import {
  getAuthenticatedRequestIdentity,
  getCurrentWorkspaceId,
} from 'src/modules/inbox/utils/evolution-environment';
import { registerEvolutionWebhook } from 'src/modules/inbox/utils/evolution-webhook-registration';
import { resolveWhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';

type ConfigureEvolutionResult = {
  configured: boolean;
  instanceName: string;
  webhookUrl: string;
  providerStatus: number;
  events: readonly string[];
};

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

export const configureEvolutionInboxHandler = async (
  routePayload: RoutePayload<Record<string, unknown>>,
): Promise<ConfigureEvolutionResult> => {
  await assertCanConfigureApplications(routePayload.userWorkspaceId);

  const registration = await registerEvolutionWebhook({
    workspaceId: getCurrentWorkspaceId(),
    configuration: resolveWhatsappProvisioning(),
  });

  return {
    configured: true,
    ...registration,
  };
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
