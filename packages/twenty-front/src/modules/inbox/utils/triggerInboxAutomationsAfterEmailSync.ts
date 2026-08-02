import { postInboxAppRoute } from '@/inbox/utils/postInboxAppRoute';

const INBOX_AUTOMATION_EXECUTE_ROUTE = '/diex/inbox/automations/execute';

type TriggerInboxAutomationsResult = {
  applied: number;
  warnings: string[];
};

export const triggerInboxAutomationsAfterEmailSync = async (input: {
  conversationId: string;
  trigger: 'CONVERSATION_CREATED' | 'INBOUND_MESSAGE_CREATED';
  triggerKey: string;
  messageBody?: string | null;
}): Promise<TriggerInboxAutomationsResult> =>
  postInboxAppRoute<TriggerInboxAutomationsResult>(
    INBOX_AUTOMATION_EXECUTE_ROUTE,
    input,
  );
