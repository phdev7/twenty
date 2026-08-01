// Seam left for ticket 05 (backend): the automation engine (label/status/team
// routing, follow-up tasks, internal notes) is shared between this
// client-driven Twenty email sync and the Evolution webhook, which already
// runs server-side. Porting it a second time here would fork the rule engine
// into two diverging copies. Once the inbox service exists, this calls it
// (likely a REST/GraphQL trigger) instead of running the rules in the browser.
export const triggerInboxAutomationsAfterEmailSync = async (_input: {
  conversationId: string;
  trigger: 'CONVERSATION_CREATED' | 'INBOUND_MESSAGE_CREATED';
  triggerKey: string;
  messageBody?: string | null;
}): Promise<{ applied: number; warnings: string[] }> => ({
  applied: 0,
  warnings: [],
});
