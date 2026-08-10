export const getEvolutionSendTextRoute = (conversationId: string): string =>
  `/rest/inbox/conversations/${encodeURIComponent(conversationId)}/evolution-messages`;
