import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  CUSTOMER_SUCCESS_MILESTONE_ACTION_ROUTE,
  CUSTOMER_SUCCESS_MILESTONE_ACTION_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import {
  type CustomerSuccessMilestoneAction,
  type CustomerSuccessMilestoneActionResult,
  updateSuccessMilestone,
} from 'src/modules/customer-success-command-center/logic-functions/update-success-milestone.logic-function';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';

type MilestoneActionRouteBody = {
  milestoneId?: unknown;
  action?: unknown;
  outcome?: unknown;
  evidence?: unknown;
  impact?: unknown;
  previewOnly?: unknown;
  confirmUpdate?: unknown;
  confirmationToken?: unknown;
};

const readString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const handler = async (
  routePayload: RoutePayload<MilestoneActionRouteBody>,
): Promise<CustomerSuccessMilestoneActionResult> => {
  const identity = getAuthenticatedRequestIdentity(
    routePayload.userWorkspaceId,
  );

  return await updateSuccessMilestone({
    milestoneId: readString(routePayload.body?.milestoneId),
    action: readString(
      routePayload.body?.action,
    ) as CustomerSuccessMilestoneAction,
    outcome: readString(routePayload.body?.outcome),
    evidence: readString(routePayload.body?.evidence),
    impact: readString(routePayload.body?.impact),
    previewOnly: routePayload.body?.previewOnly !== false,
    confirmUpdate: routePayload.body?.confirmUpdate === true,
    confirmationToken: readString(routePayload.body?.confirmationToken),
    confirmationScope: identity.userWorkspaceId,
  });
};

export default defineLogicFunction({
  universalIdentifier:
    CUSTOMER_SUCCESS_MILESTONE_ACTION_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'update-diex-customer-success-milestone-route',
  description:
    'Authenticated route for previewing and confirming a Customer Success milestone action.',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: CUSTOMER_SUCCESS_MILESTONE_ACTION_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
