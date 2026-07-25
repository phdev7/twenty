import { createHmac } from 'node:crypto';

import {
  getCurrentWorkspaceId,
  readBooleanEnvironmentValue,
} from 'src/modules/inbox/utils/evolution-environment';

export type WhatsappProvisioning = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  webhookSecret: string;
};

const readServerValue = (name: string): string | null => {
  const value = process.env[name]?.trim();

  return value && value.length > 0 ? value : null;
};

const assertUsableOrigin = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/+$/, '');
  const parsed = new URL(normalized);
  const allowPrivateNetwork = readBooleanEnvironmentValue(
    'DIEX_EVOLUTION_ALLOW_PRIVATE_NETWORK',
    false,
  );

  if (
    parsed.protocol !== 'https:' &&
    !(parsed.protocol === 'http:' && allowPrivateNetwork)
  ) {
    throw new Error(
      'A origem da Evolution precisa usar HTTPS, salvo liberação explícita para rede privada.',
    );
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'A origem da Evolution deve ser apenas o host, sem credenciais, caminho ou query.',
    );
  }

  return normalized;
};

// The instance name has to be stable per workspace and safe for a URL path,
// so it is derived from the workspace id rather than typed by anyone.
const buildInstanceName = (workspaceId: string): string =>
  `diex-${workspaceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).toLowerCase()}`;

// Each workspace gets its own webhook secret, derived from a single server
// secret. Deriving instead of storing means one tenant can never present
// another tenant's secret, and nothing extra has to be kept in sync.
const buildWebhookSecret = (
  serverSecret: string,
  workspaceId: string,
): string =>
  createHmac('sha256', serverSecret)
    .update(`diex:whatsapp:${workspaceId}`)
    .digest('hex');

// Resolution order matters: server-level credentials first, so a workspace
// admin never has to hold a provider API key to get an inbox. The per-workspace
// variables stay supported for tenants that bring their own Evolution.
export const resolveWhatsappProvisioning = (): WhatsappProvisioning => {
  const workspaceId = getCurrentWorkspaceId();

  const serverBaseUrl = readServerValue('DIEX_EVOLUTION_SERVER_BASE_URL');
  const serverApiKey = readServerValue('DIEX_EVOLUTION_SERVER_API_KEY');
  const serverWebhookSecret = readServerValue(
    'DIEX_EVOLUTION_SERVER_WEBHOOK_SECRET',
  );

  if (serverBaseUrl && serverApiKey && serverWebhookSecret) {
    return {
      baseUrl: assertUsableOrigin(serverBaseUrl),
      apiKey: serverApiKey,
      instanceName: buildInstanceName(workspaceId),
      webhookSecret: buildWebhookSecret(serverWebhookSecret, workspaceId),
    };
  }

  const workspaceBaseUrl = readServerValue('EVOLUTION_BASE_URL');
  const workspaceApiKey = readServerValue('EVOLUTION_API_KEY');
  const workspaceInstance = readServerValue('EVOLUTION_INSTANCE_NAME');
  const workspaceSecret = readServerValue('EVOLUTION_WEBHOOK_SECRET');

  if (
    workspaceBaseUrl &&
    workspaceApiKey &&
    workspaceInstance &&
    workspaceSecret
  ) {
    if (!/^[a-zA-Z0-9._-]{2,80}$/.test(workspaceInstance)) {
      throw new Error(
        'EVOLUTION_INSTANCE_NAME aceita apenas letras, números, pontos, sublinhados ou hifens.',
      );
    }

    if (workspaceSecret.length < 24) {
      throw new Error(
        'EVOLUTION_WEBHOOK_SECRET precisa ter ao menos 24 caracteres.',
      );
    }

    return {
      baseUrl: assertUsableOrigin(workspaceBaseUrl),
      apiKey: workspaceApiKey,
      instanceName: workspaceInstance,
      webhookSecret: workspaceSecret,
    };
  }

  throw new Error(
    'A integração WhatsApp não está disponível: o operador da infraestrutura precisa configurar a Evolution no servidor.',
  );
};
