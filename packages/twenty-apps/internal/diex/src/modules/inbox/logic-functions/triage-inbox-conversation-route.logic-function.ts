import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  INBOX_TRIAGE_ROUTE,
  INBOX_TRIAGE_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-ai.constants';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';
import {
  triageInboxConversation,
  type TriageInboxConversationResult,
} from 'src/modules/inbox/logic-functions/triage-inbox-conversation';

type TriageRouteBody = {
  conversationId?: unknown;
  registerSignal?: unknown;
  proposeReply?: unknown;
};

const handler = async (
  routePayload: RoutePayload<TriageRouteBody>,
): Promise<TriageInboxConversationResult> => {
  getAuthenticatedRequestIdentity(routePayload.userWorkspaceId);

  const conversationId =
    typeof routePayload.body?.conversationId === 'string'
      ? routePayload.body.conversationId
      : '';

  return await triageInboxConversation({
    conversationId,
    registerSignal: routePayload.body?.registerSignal === true,
    proposeReply: routePayload.body?.proposeReply === true,
  });
};

export default defineLogicFunction({
  universalIdentifier:
    INBOX_TRIAGE_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'triage-diex-inbox-conversation-route',
  description:
    'Authenticated Inbox route for AI triage and draft generation with no automatic external effect.',
  timeoutSeconds: 60,
  handler,
  httpRouteTriggerSettings: {
    path: INBOX_TRIAGE_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
