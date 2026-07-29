import { MCP_SETUP } from '@/settings/mcp-and-apis/constants/McpSetup';

export const buildMcpServerUrl = (serverBaseUrl: string) =>
  `${serverBaseUrl.replace(/\/+$/, '')}/mcp`;

export const isHttpsUrl = (url: string) => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

export const buildMcpAuthorizationHeaders = (apiKey?: string) => ({
  [MCP_SETUP.authorizationHeader.key]: apiKey
    ? `Bearer ${apiKey}`
    : MCP_SETUP.authorizationHeader.value,
});

export const buildRemoteMcpServerConfig = (
  mcpServerUrl: string,
  apiKey?: string,
) => ({
  url: mcpServerUrl,
  headers: buildMcpAuthorizationHeaders(apiKey),
});

export const buildMcpConfig = (mcpServerUrl: string, apiKey?: string) =>
  JSON.stringify(
    {
      mcpServers: {
        [MCP_SETUP.server.name]: buildRemoteMcpServerConfig(
          mcpServerUrl,
          apiKey,
        ),
      },
    },
    null,
    2,
  );

export const buildMcpOAuthConfig = (mcpServerUrl: string) =>
  JSON.stringify(
    {
      mcpServers: {
        [MCP_SETUP.server.name]: {
          url: mcpServerUrl,
        },
      },
    },
    null,
    2,
  );

export const buildClaudeInstallLink = (mcpServerUrl: string) => {
  const params = new URLSearchParams({
    modal: 'add-custom-connector',
    connectorName: MCP_SETUP.server.displayName,
    connectorUrl: mcpServerUrl,
  });

  return `https://claude.ai/customize/connectors?${params.toString()}`;
};

// ChatGPT has no prefill parameters for a custom connector: the URL is typed
// into the connector dialog behind developer mode. The link opens that screen,
// and the MCP URL to paste is the one shown right below these cards.
export const buildChatGptConnectorLink = () =>
  `${MCP_SETUP.chatGpt.appUrl}#settings/Connectors`;

export const buildCursorInstallLink = (mcpServerUrl: string) => {
  const config = btoa(JSON.stringify(buildRemoteMcpServerConfig(mcpServerUrl)));

  const params = new URLSearchParams({
    name: MCP_SETUP.server.name,
    config,
  });

  return `https://cursor.com/en/install-mcp?${params.toString()}`;
};

export const buildVsCodeInstallLink = (mcpServerUrl: string) =>
  `vscode:mcp/install?${encodeURIComponent(
    JSON.stringify({
      name: MCP_SETUP.server.name,
      type: 'http',
      url: mcpServerUrl,
      headers: buildMcpAuthorizationHeaders(),
    }),
  )}`;

export const buildGooseInstallLink = (mcpServerUrl: string) => {
  const params = new URLSearchParams({
    url: mcpServerUrl,
    type: 'streamable_http',
    timeout: '300',
    id: MCP_SETUP.server.name,
    name: MCP_SETUP.server.displayName,
    description: 'Access your Diex CRM workspace through MCP',
  });

  params.append(
    'header',
    `${MCP_SETUP.authorizationHeader.key}=${MCP_SETUP.authorizationHeader.value}`,
  );

  return `goose://extension?${params.toString()}`;
};

export const buildReplitInstallLink = (mcpServerUrl: string) => {
  const payload = btoa(
    JSON.stringify({
      displayName: MCP_SETUP.server.displayName,
      baseUrl: mcpServerUrl,
      headers: [
        {
          key: MCP_SETUP.authorizationHeader.key,
          value: MCP_SETUP.authorizationHeader.value,
        },
      ],
    }),
  );

  const params = new URLSearchParams({
    mcp: payload,
  });

  return `https://replit.com/integrations?${params.toString()}`;
};

export const buildLmStudioInstallLink = (mcpServerUrl: string) => {
  const config = btoa(JSON.stringify(buildRemoteMcpServerConfig(mcpServerUrl)));

  const params = new URLSearchParams({
    name: MCP_SETUP.server.name,
    config,
  });

  return `lmstudio://add_mcp?${params.toString()}`;
};
