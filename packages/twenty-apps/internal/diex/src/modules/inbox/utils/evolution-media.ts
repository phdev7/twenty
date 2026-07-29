import { safeEvolutionFetch } from 'src/modules/inbox/utils/safe-evolution-fetch';
import { resolveWhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';

export type EvolutionMedia = {
  base64: string;
  mimeType: string;
  fileName: string | null;
};

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// The provider message key is `<instance>:<providerId>`; only the second half
// means anything to the provider. A key still in the pending shape belongs to a
// message this CRM created and never had media.
export const readExternalMessageId = (
  providerMessageKey: string | null | undefined,
): string | null => {
  const key = providerMessageKey ?? '';
  const separatorIndex = key.indexOf(':');
  const externalId = separatorIndex === -1 ? key : key.slice(separatorIndex + 1);

  return externalId && !externalId.startsWith('pending:') ? externalId : null;
};

// Media is read from the provider every time it is needed and never stored: the
// provider is already the durable copy, and keeping a second one is what fills a
// VPS disk with voice notes nobody opens twice.
export const fetchEvolutionMediaBase64 = async (
  providerMessageKey: string | null | undefined,
): Promise<EvolutionMedia | null> => {
  const externalMessageId = readExternalMessageId(providerMessageKey);

  if (!externalMessageId) {
    return null;
  }

  const configuration = resolveWhatsappProvisioning();
  const response = await safeEvolutionFetch({
    baseUrl: configuration.baseUrl,
    path: `/chat/getBase64FromMediaMessage/${encodeURIComponent(configuration.instanceName)}`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      apikey: configuration.apiKey,
    },
    body: JSON.stringify({
      message: { key: { id: externalMessageId } },
      convertToMp4: false,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as {
    base64?: unknown;
    mimetype?: unknown;
    mimeType?: unknown;
    fileName?: unknown;
  } | null;
  const base64 = readString(payload?.base64);

  if (!base64) {
    return null;
  }

  return {
    base64,
    mimeType:
      readString(payload?.mimetype) ??
      readString(payload?.mimeType) ??
      'application/octet-stream',
    fileName: readString(payload?.fileName),
  };
};
