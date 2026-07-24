import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  CUSTOMER_SUCCESS_REVIEW_ROUTE,
  CUSTOMER_SUCCESS_REVIEW_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import {
  reviewCustomerSuccess,
  type ReviewCustomerSuccessResult,
} from 'src/logic-functions/review-customer-success.logic-function';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';

type CustomerSuccessReviewRouteBody = {
  successPlanId?: unknown;
  mode?: unknown;
};

type CustomerSuccessReviewRouteResult = ReviewCustomerSuccessResult & {
  mode: 'PREVIEW' | 'APPLY';
};

const handler = async (
  routePayload: RoutePayload<CustomerSuccessReviewRouteBody>,
): Promise<CustomerSuccessReviewRouteResult> => {
  getAuthenticatedRequestIdentity(routePayload.userWorkspaceId);

  const successPlanId =
    typeof routePayload.body?.successPlanId === 'string'
      ? routePayload.body.successPlanId.trim()
      : '';
  const mode = routePayload.body?.mode === 'APPLY' ? 'APPLY' : 'PREVIEW';

  if (!successPlanId) {
    throw new Error('Selecione um plano de sucesso válido.');
  }

  const result = await reviewCustomerSuccess({
    successPlanId,
    updateSuccessPlan: mode === 'APPLY',
    proposeAction: mode === 'APPLY',
  });

  return {
    ...result,
    mode,
  };
};

export default defineLogicFunction({
  universalIdentifier:
    CUSTOMER_SUCCESS_REVIEW_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'review-diex-customer-success-route',
  description:
    'Authenticated Customer Success route for previewing or applying an AI review without automatic external effects.',
  timeoutSeconds: 60,
  handler,
  httpRouteTriggerSettings: {
    path: CUSTOMER_SUCCESS_REVIEW_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
