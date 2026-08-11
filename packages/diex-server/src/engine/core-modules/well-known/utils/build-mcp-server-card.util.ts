import { MCP_PROTOCOL_VERSION } from 'src/engine/api/mcp/constants/mcp-protocol-version.const';

type BuildMcpServerCardArgs = {
  baseUrl: string;
  version: string;
};

export const buildMcpServerCard = ({
  baseUrl,
  version,
}: BuildMcpServerCardArgs) => ({
  $schema:
    'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json',
  name: 'com.bydiex/diex-crm',
  version,
  title: 'Diex CRM',
  description:
    'Operate sales, Inbox, Customer Success, renewals, tasks, notes and custom CRM objects from AI assistants. Tools are discovered at runtime and isolated by the authenticated Diex workspace.',
  websiteUrl: 'https://bydiex.com',
  remotes: [
    {
      type: 'streamable-http',
      url: `${baseUrl}/mcp`,
      supportedProtocolVersions: [MCP_PROTOCOL_VERSION],
      headers: [
        {
          name: 'Authorization',
          description:
            "Optional. Bearer <api-key> for static API-key auth. Omit to use OAuth 2.1, auto-discovered from this host's /.well-known/oauth-protected-resource and /.well-known/oauth-authorization-server.",
          isRequired: false,
          isSecret: true,
        },
      ],
    },
  ],
});
