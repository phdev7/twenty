import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EVOLUTION_EVENTS,
  EVOLUTION_WEBHOOK_SECRET_HEADER,
} from 'src/modules/inbox/constants/evolution.constants';
import {
  WHATSAPP_CONNECTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  WHATSAPP_CONNECTION_ROUTE,
} from 'src/modules/inbox/constants/whatsapp-connection.constants';
import { buildEvolutionWebhookUrl } from 'src/modules/inbox/utils/evolution-environment';
import { resolveWhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';
import { safeEvolutionFetch } from 'src/modules/inbox/utils/safe-evolution-fetch';

export type WhatsappConnectionState =
  | 'CONNECTED'
  | 'AWAITING_SCAN'
  | 'CONNECTING'
  | 'NOT_PROVISIONED'
  | 'UNAVAILABLE';

export type WhatsappConnectionResult = {
  state: WhatsappConnectionState;
  instanceName: string | null;
  phone: string | null;
  // Data URI for an <img>. Rendered only inside the authenticated settings
  // page — a WhatsApp QR is a live credential and must never leave that screen,
  // which is why it is not returned by any MCP-exposed tool.
  qrCodeDataUri: string | null;
  message: string;
};

const jsonHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  apikey: apiKey,
});

const readJson = async (response: Response): Promise<Record<string, unknown>> => {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const extractQrCode = (payload: Record<string, unknown>): string | null => {
  const direct = asString(payload.base64);

  if (direct) {
    return direct.startsWith('data:') ? direct : `data:image/png;base64,${direct}`;
  }

  const nested = payload.qrcode;

  if (nested && typeof nested === 'object') {
    const base64 = asString((nested as Record<string, unknown>).base64);

    if (base64) {
      return base64.startsWith('data:')
        ? base64
        : `data:image/png;base64,${base64}`;
    }
  }

  return null;
};

const readConnectionState = (payload: Record<string, unknown>): string | null => {
  const instance = payload.instance;

  if (instance && typeof instance === 'object') {
    return asString((instance as Record<string, unknown>).state);
  }

  return asString(payload.state);
};

// One Evolution instance per workspace, provisioned on demand from the settings
// page. The workspace admin never handles the provider API key: they scan a QR
// and the inbox starts receiving.
export const whatsappConnectionHandler = async (
  _routePayload: RoutePayload<Record<string, unknown>>,
): Promise<WhatsappConnectionResult> => {
  const { baseUrl, instanceName, apiKey, webhookSecret } =
    resolveWhatsappProvisioning();
  const headers = jsonHeaders(apiKey);

  const stateResponse = await safeEvolutionFetch({
    baseUrl,
    path: `/instance/connectionState/${encodeURIComponent(instanceName)}`,
    method: 'GET',
    headers,
  });

  if (stateResponse.ok) {
    const payload = await readJson(stateResponse);
    const state = readConnectionState(payload);

    if (state === 'open') {
      return {
        state: 'CONNECTED',
        instanceName,
        phone: null,
        qrCodeDataUri: null,
        message: 'WhatsApp conectado. As mensagens chegam no Inbox Comercial.',
      };
    }
  }

  if (stateResponse.status === 404) {
    const createResponse = await safeEvolutionFetch({
      baseUrl,
      path: '/instance/create',
      method: 'POST',
      headers,
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          enabled: true,
          url: buildEvolutionWebhookUrl(),
          byEvents: false,
          base64: true,
          events: EVOLUTION_EVENTS,
          headers: { [EVOLUTION_WEBHOOK_SECRET_HEADER]: webhookSecret },
        },
      }),
    });

    if (!createResponse.ok) {
      return {
        state: 'UNAVAILABLE',
        instanceName,
        phone: null,
        qrCodeDataUri: null,
        message: `Não foi possível criar a instância na Evolution (HTTP ${createResponse.status}).`,
      };
    }

    const created = await readJson(createResponse);
    const qrCodeDataUri = extractQrCode(created);

    return {
      state: qrCodeDataUri ? 'AWAITING_SCAN' : 'CONNECTING',
      instanceName,
      phone: null,
      qrCodeDataUri,
      message: qrCodeDataUri
        ? 'Leia o código no WhatsApp do número comercial para conectar.'
        : 'Instância criada. Atualize em alguns segundos para obter o código.',
    };
  }

  const connectResponse = await safeEvolutionFetch({
    baseUrl,
    path: `/instance/connect/${encodeURIComponent(instanceName)}`,
    method: 'GET',
    headers,
  });

  if (!connectResponse.ok) {
    return {
      state: 'UNAVAILABLE',
      instanceName,
      phone: null,
      qrCodeDataUri: null,
      message: `A Evolution não respondeu ao pedido de conexão (HTTP ${connectResponse.status}).`,
    };
  }

  const connectPayload = await readJson(connectResponse);
  const qrCodeDataUri = extractQrCode(connectPayload);

  return {
    state: qrCodeDataUri ? 'AWAITING_SCAN' : 'CONNECTING',
    instanceName,
    phone: null,
    qrCodeDataUri,
    message: qrCodeDataUri
      ? 'Leia o código no WhatsApp do número comercial para conectar.'
      : 'Conexão em andamento. Atualize em alguns segundos.',
  };
};

export default defineLogicFunction({
  universalIdentifier: WHATSAPP_CONNECTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'diex-whatsapp-connection',
  description:
    'Provisiona a instância WhatsApp deste workspace na Evolution e devolve o estado da conexão com o QR Code para leitura no painel autenticado.',
  timeoutSeconds: 30,
  handler: whatsappConnectionHandler,
  // Deliberately no toolTriggerSettings: the QR is a live credential and must
  // not be reachable through MCP or an agent.
  httpRouteTriggerSettings: {
    path: WHATSAPP_CONNECTION_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
