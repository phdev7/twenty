import { createHash, timingSafeEqual } from 'node:crypto';

const CONFIRMATION_TOKEN_TTL_MS = 15 * 60_000;

const digestFor = ({
  workspaceId,
  scope,
  fingerprint,
  expiresAtMs,
}: {
  workspaceId: string;
  scope: string;
  fingerprint: string;
  expiresAtMs: number;
}): string =>
  createHash('sha256')
    .update(
      `${workspaceId}:${scope}:${fingerprint}:${expiresAtMs.toString(10)}`,
    )
    .digest('hex');

export const issueConfirmationToken = ({
  workspaceId,
  scope,
  fingerprint,
  now = Date.now(),
}: {
  workspaceId: string;
  scope: string;
  fingerprint: string;
  now?: number;
}): { token: string; expiresAt: string } => {
  const expiresAtMs = now + CONFIRMATION_TOKEN_TTL_MS;
  const digest = digestFor({
    workspaceId,
    scope,
    fingerprint,
    expiresAtMs,
  });

  return {
    token: `${digest}.${expiresAtMs.toString(10)}`,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
};

export const verifyConfirmationToken = ({
  token,
  workspaceId,
  scope,
  fingerprint,
  now = Date.now(),
}: {
  token: string | undefined;
  workspaceId: string;
  scope: string;
  fingerprint: string;
  now?: number;
}): boolean => {
  if (!token) {
    return false;
  }

  const separatorIndex = token.lastIndexOf('.');

  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return false;
  }

  const digest = token.slice(0, separatorIndex);
  const expiresAtMs = Number(token.slice(separatorIndex + 1));

  if (
    !Number.isSafeInteger(expiresAtMs) ||
    expiresAtMs <= now ||
    !/^[0-9a-f]{64}$/.test(digest)
  ) {
    return false;
  }

  const expectedDigest = digestFor({
    workspaceId,
    scope,
    fingerprint,
    expiresAtMs,
  });

  return timingSafeEqual(
    Buffer.from(digest, 'utf8'),
    Buffer.from(expectedDigest, 'utf8'),
  );
};
