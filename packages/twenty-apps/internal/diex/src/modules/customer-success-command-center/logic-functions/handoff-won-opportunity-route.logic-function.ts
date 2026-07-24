import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  CUSTOMER_SUCCESS_HANDOFF_ROUTE,
  CUSTOMER_SUCCESS_HANDOFF_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import {
  handoffWonOpportunity,
  type CustomerSuccessHandoffResult,
} from 'src/modules/customer-success-command-center/logic-functions/handoff-won-opportunity.logic-function';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';

type HandoffRouteBody = {
  opportunityId?: unknown;
  ownerId?: unknown;
  renewalDate?: unknown;
  recurringRevenueMicros?: unknown;
  currencyCode?: unknown;
  objectives?: unknown;
  successCriteria?: unknown;
  previewOnly?: unknown;
  confirmCreate?: unknown;
  confirmationToken?: unknown;
};

const readString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const handler = async (
  routePayload: RoutePayload<HandoffRouteBody>,
): Promise<CustomerSuccessHandoffResult> => {
  const identity = getAuthenticatedRequestIdentity(
    routePayload.userWorkspaceId,
  );

  return await handoffWonOpportunity({
    opportunityId: readString(routePayload.body?.opportunityId),
    ownerId: readString(routePayload.body?.ownerId),
    renewalDate: readString(routePayload.body?.renewalDate),
    recurringRevenueMicros:
      typeof routePayload.body?.recurringRevenueMicros === 'number'
        ? routePayload.body.recurringRevenueMicros
        : Number.NaN,
    currencyCode: readString(routePayload.body?.currencyCode),
    objectives: readString(routePayload.body?.objectives),
    successCriteria: readString(routePayload.body?.successCriteria),
    previewOnly: routePayload.body?.previewOnly !== false,
    confirmCreate: routePayload.body?.confirmCreate === true,
    confirmationToken: readString(routePayload.body?.confirmationToken),
    confirmationScope: identity.userWorkspaceId,
  });
};

export default defineLogicFunction({
  universalIdentifier:
    CUSTOMER_SUCCESS_HANDOFF_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'handoff-won-opportunity-to-customer-success-route',
  description:
    'Authenticated route for previewing and confirming a commercial handoff into Customer Success.',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: CUSTOMER_SUCCESS_HANDOFF_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
