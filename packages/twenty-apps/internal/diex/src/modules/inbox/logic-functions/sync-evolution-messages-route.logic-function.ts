import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EVOLUTION_SYNC_ROUTE,
  EVOLUTION_SYNC_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/evolution-sync.constants';
import {
  syncEvolutionMessages,
  type SyncEvolutionMessagesResult,
} from 'src/modules/inbox/logic-functions/sync-evolution-messages';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';

const handler = async (
  routePayload: RoutePayload<Record<string, unknown>>,
): Promise<SyncEvolutionMessagesResult> => {
  getAuthenticatedRequestIdentity(routePayload.userWorkspaceId);

  return syncEvolutionMessages();
};

export default defineLogicFunction({
  universalIdentifier: EVOLUTION_SYNC_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'sync-diex-evolution-messages-route',
  description:
    'Reconcilia a inbox com o histórico da Evolution sob demanda, para o inbox aberto não esperar o próximo ciclo agendado.',
  timeoutSeconds: 60,
  handler,
  httpRouteTriggerSettings: {
    path: EVOLUTION_SYNC_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
