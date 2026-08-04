// Mirrors ResolvedPersonConversation on the server: the endpoint answers with a
// status instead of an HTTP error so a contact without a phone can be told
// exactly what is missing.
export type ResolvedPersonConversation =
  | { status: 'resolved'; conversationId: string; created: boolean }
  | { status: 'no_phone' }
  | { status: 'person_not_found' };
