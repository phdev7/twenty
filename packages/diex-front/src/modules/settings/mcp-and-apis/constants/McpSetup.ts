export const MCP_SETUP = {
  apiKey: {
    defaultName: 'Diex CRM MCP',
    roleLabel: 'Diex CRM function role',
  },
  protocolVersion: '2025-06-18',
  tooltipIds: {
    chatGptInstallDisabled: 'mcp-chatgpt-install-disabled',
    claudeInstallDisabled: 'mcp-claude-install-disabled',
    replitInstallDisabled: 'mcp-replit-install-disabled',
  },
  authorizationHeader: {
    key: 'Authorization',
    value: 'Bearer <YOUR_API_KEY>',
  },
  server: {
    name: 'diex-crm',
    displayName: 'Diex CRM',
  },
  chatGpt: {
    appUrl: 'https://chatgpt.com/',
    docsUrl:
      'https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt',
  },
  clientDocsUrls: {
    augment: 'https://docs.augmentcode.com/setup-augment/mcp',
    amazonQ:
      'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/qdev-mcp.html',
    cline: 'https://docs.cline.bot/mcp/mcp-overview',
    geminiCli: 'https://geminicli.com/docs/tools/mcp-server/',
    jetbrains: 'https://www.jetbrains.com/help/ai-assistant/mcp.html',
    libreChat: 'https://www.librechat.ai/docs/features/mcp',
    lmStudio: 'https://lmstudio.ai/docs/app/mcp',
    raycast: 'https://manual.raycast.com/ai/model-context-protocol',
    warp: 'https://docs.warp.dev/agent-platform/capabilities/mcp/',
    windsurf: 'https://docs.devin.ai/desktop/cascade/mcp',
    zed: 'https://zed.dev/docs/ai/mcp',
  },
} as const;
