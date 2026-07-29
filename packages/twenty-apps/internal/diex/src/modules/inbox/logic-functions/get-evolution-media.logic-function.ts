import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EVOLUTION_MEDIA_MAX_BASE64_BYTES,
  EVOLUTION_MEDIA_ROUTE,
  EVOLUTION_MEDIA_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/evolution-media.constants';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';
import { fetchEvolutionMediaBase64 } from 'src/modules/inbox/utils/evolution-media';

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

// Media is fetched from the provider when an operator asks to see it and is
// never written to disk. The provider already holds the durable copy.
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
    },
  })) as {
    inboxMessage?: {
      id?: string | null;
      providerMessageKey?: string | null;
    } | null;
  };
  const message = result.inboxMessage;

  if (!message?.id) {
    throw new Error('Mensagem não encontrada nesta workspace.');
  }

  const media = await fetchEvolutionMediaBase64(message.providerMessageKey);

  if (!media) {
    throw new Error(
      'O provedor não devolveu mídia para esta mensagem. Veja pelo WhatsApp do número comercial.',
    );
  }

  if (media.base64.length > EVOLUTION_MEDIA_MAX_BASE64_BYTES) {
    throw new Error(
      'Mídia grande demais para abrir aqui. Veja pelo WhatsApp do número comercial.',
    );
  }

  return {
    inboxMessageId: message.id,
    mimeType: media.mimeType,
    fileName: media.fileName,
    dataUri: `data:${media.mimeType};base64,${media.base64}`,
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
