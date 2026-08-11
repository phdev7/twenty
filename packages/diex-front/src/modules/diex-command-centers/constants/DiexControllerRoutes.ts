export const DIEX_CONTROLLER_ROUTES = {
  aiExecuteAction: '/rest/diex/ai/execute-action',
  aiReviewAction: '/rest/diex/ai/review-action',
  customerSuccessReview: '/rest/diex/customer-success/review',
  customerSuccessHandoff: '/rest/diex/customer-success/handoff',
  customerSuccessMilestoneAction:
    '/rest/diex/customer-success/milestone-action',
} as const;

export type DiexControllerRoute =
  (typeof DIEX_CONTROLLER_ROUTES)[keyof typeof DIEX_CONTROLLER_ROUTES];
