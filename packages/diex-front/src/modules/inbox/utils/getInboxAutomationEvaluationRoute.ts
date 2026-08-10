import { INBOX_AUTOMATION_EVALUATION_ROUTE_PREFIX } from '@/inbox/constants/INBOX_AUTOMATION_EVALUATION_ROUTE';

export const getInboxAutomationEvaluationRoute = (messageId: string): string =>
  `${INBOX_AUTOMATION_EVALUATION_ROUTE_PREFIX}/${encodeURIComponent(messageId)}/automation-evaluations`;
