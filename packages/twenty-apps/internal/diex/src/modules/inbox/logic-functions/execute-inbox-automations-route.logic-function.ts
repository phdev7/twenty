import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  INBOX_AUTOMATION_EXECUTE_ROUTE,
  INBOX_AUTOMATION_EXECUTE_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-automation.constants';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';
import {
  executeInboxAutomations,
  type ExecuteInboxAutomationsResult,
  type InboxAutomationTriggerValue,
} from 'src/modules/inbox/utils/inbox-automation';

type ExecuteInboxAutomationsRouteBody = {
  conversationId?: unknown;
  trigger?: unknown;
  triggerKey?: unknown;
  messageBody?: unknown;
};

const isInboxAutomationTrigger = (
  value: unknown,
): value is InboxAutomationTriggerValue =>
  value === 'CONVERSATION_CREATED' || value === 'INBOUND_MESSAGE_CREATED';

const readRequiredText = (
  value: unknown,
  fieldName: string,
  maxLength: number,
): string => {
  const text = typeof value === 'string' ? value.trim() : '';

  if (text.length === 0 || text.length > maxLength) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return text;
};

const handler = async (
  routePayload: RoutePayload<ExecuteInboxAutomationsRouteBody>,
): Promise<ExecuteInboxAutomationsResult> => {
  getAuthenticatedRequestIdentity(routePayload.userWorkspaceId);

  const conversationId = readRequiredText(
    routePayload.body?.conversationId,
    'conversationId',
    36,
  );
  const triggerKey = readRequiredText(
    routePayload.body?.triggerKey,
    'triggerKey',
    1_000,
  );
  const trigger = routePayload.body?.trigger;

  if (!isInboxAutomationTrigger(trigger)) {
    throw new Error('trigger is invalid.');
  }

  const messageBody = routePayload.body?.messageBody;

  if (
    messageBody !== undefined &&
    messageBody !== null &&
    typeof messageBody !== 'string'
  ) {
    throw new Error('messageBody is invalid.');
  }

  return executeInboxAutomations({
    conversationId,
    trigger,
    triggerKey,
    messageBody,
  });
};

export default defineLogicFunction({
  universalIdentifier:
    INBOX_AUTOMATION_EXECUTE_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'execute-diex-inbox-automations-route',
  description:
    'Authenticated workspace route that evaluates idempotent Inbox automations after native message ingestion.',
  timeoutSeconds: 60,
  handler,
  httpRouteTriggerSettings: {
    path: INBOX_AUTOMATION_EXECUTE_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
