export const getInboxPersonWhatsappConversationRoute = (
  personId: string,
): string =>
  `/rest/inbox/people/${encodeURIComponent(personId)}/whatsapp-conversation`;
