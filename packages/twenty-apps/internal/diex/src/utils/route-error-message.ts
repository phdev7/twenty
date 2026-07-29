// An app route that throws answers with the reason in the response body, but
// the REST client only puts the status line in error.message. Surfacing the
// body is the difference between "failed with status 500" and a sentence the
// operator can act on.
const readMessagesFromBody = (body: unknown): string | null => {
  if (typeof body === 'string') {
    return body.trim() || null;
  }

  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const fromList = Array.isArray(record.messages)
    ? record.messages.find(
        (message): message is string =>
          typeof message === 'string' && message.trim().length > 0,
      )
    : undefined;
  const candidate =
    fromList ??
    (typeof record.message === 'string' ? record.message : undefined) ??
    (typeof record.error === 'string' ? record.error : undefined);

  return candidate?.replace(/^Error:\s*/, '').trim() || null;
};

export const getRouteErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (typeof error === 'object' && error !== null && 'body' in error) {
    const fromBody = readMessagesFromBody((error as { body: unknown }).body);

    if (fromBody) {
      return fromBody;
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
};
