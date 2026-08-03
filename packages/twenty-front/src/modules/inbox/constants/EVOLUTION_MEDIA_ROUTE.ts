export const getEvolutionMediaRoute = (messageId: string): string =>
  `/rest/inbox/messages/${encodeURIComponent(messageId)}/evolution-media`;
