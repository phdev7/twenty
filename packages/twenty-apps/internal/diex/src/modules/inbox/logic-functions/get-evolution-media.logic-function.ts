import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EVOLUTION_MEDIA_MAX_BASE64_BYTES,
  EVOLUTION_MEDIA_ROUTE,
  EVOLUTION_MEDIA_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/evolution-media.constants';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';
import { safeEvolutionFetch } from 'src/modules/inbox/utils/safe-evolution-fetch';
import { resolveWhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';

type GetMediaRequest = {
  inboxMessageId?: unknown;
};

export type EvolutionMediaResult = {
  inboxMessageId: string;
  mimeType: string;
  fileName: string | null;
  dataUri: string;
};

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// Media lives with the provider and is read only when an operator asks for it.
// Nothing is written to disk: storing every voice note a WhatsApp number
// receives is how a VPS runs out of space, and the provider already keeps them.
export const getEvolutionMediaHandler = async (
  routePayload: RoutePayload<GetMediaRequest>,
): Promise<EvolutionMediaResult> => {
  getAuthenticatedRequestIdentity(routePayload.userWorkspaceId);

  const inboxMessageId = readString(routePayload.body?.inboxMessageId);

  if (!inboxMessageId) {
    throw new Error('Informe a mensagem cuja mídia deve ser carregada.');
  }

  const client = new CoreApiClient();
  const result = (await client.query({
    inboxMessage: {
      __args: { filter: { id: { eq: inboxMessageId } } },
      id: true,
      providerMessageKey: true,
      messageType: true,
      body: true,
    },
  })) as {
    inboxMessage?: {
      id?: string | null;
      providerMessageKey?: string | null;
      messageType?: string | null;
      body?: string | null;
    } | null;
  };
  const message = result.inboxMessage;

  if (!message?.id) {
    throw new Error('Mensagem não encontrada nesta workspace.');
  }

  const configuration = resolveWhatsappProvisioning();
  const providerMessageKey = message.providerMessageKey ?? '';
  const separatorIndex = providerMessageKey.indexOf(':');
  const externalMessageId =
    separatorIndex === -1
      ? providerMessageKey
      : providerMessageKey.slice(separatorIndex + 1);

  if (!externalMessageId || externalMessageId.startsWith('pending:')) {
    throw new Error('Esta mensagem não possui mídia no provedor.');
  }

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
    throw new Error(
      response.status === 400
        ? 'O provedor não reconhece esta mensagem como mídia.'
        : `Não foi possível carregar a mídia (HTTP ${response.status}).`,
    );
  }

  const payload = (await response.json()) as {
    base64?: unknown;
    mimetype?: unknown;
    mimeType?: unknown;
    fileName?: unknown;
  };
  const base64 = readString(payload.base64);
  const mimeType =
    readString(payload.mimetype) ??
    readString(payload.mimeType) ??
    'application/octet-stream';

  if (!base64) {
    throw new Error('O provedor devolveu a mídia vazia.');
  }

  if (base64.length > EVOLUTION_MEDIA_MAX_BASE64_BYTES) {
    throw new Error(
      'Mídia grande demais para abrir aqui. Veja pelo WhatsApp do número comercial.',
    );
  }

  return {
    inboxMessageId: message.id,
    mimeType,
    fileName: readString(payload.fileName),
    dataUri: `data:${mimeType};base64,${base64}`,
  };
};

export default defineLogicFunction({
  universalIdentifier:
    EVOLUTION_MEDIA_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'get-diex-evolution-media',
  description:
    'Carrega sob demanda o áudio, imagem, vídeo ou documento de uma mensagem do WhatsApp, sem armazenar nada no servidor.',
  timeoutSeconds: 60,
  handler: getEvolutionMediaHandler,
  httpRouteTriggerSettings: {
    path: EVOLUTION_MEDIA_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
