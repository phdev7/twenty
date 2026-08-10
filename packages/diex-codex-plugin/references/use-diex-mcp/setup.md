# Set Up Diex MCP

## Overview

Use this reference to configure a workspace-specific Diex MCP endpoint. The plugin must not assume a fixed workspace domain; collect the user's workspace URL first, normalize it to an MCP URL, then configure and authenticate the MCP client.

## Required User Input

Ask for the workspace URL or host if it is missing. Do not invent or reuse a private default domain.

Accept any of these forms:

```text
myworkspace.diex.com
myworkspace.customdomain.com
myworkspace.localhost:3001
https://myworkspace.diex.com
https://myworkspace.customdomain.com/mcp
http://myworkspace.localhost:3001/mcp
```

Optional inputs:

- MCP server name. Default to a workspace-derived name in the form `diex-<host-without-tld>`, for example `acme.example.com` becomes `diex-acme-example`.
- Whether to force CLI OAuth login immediately. Default to no in Codex, because Codex can open OAuth automatically when it sees the new MCP server. Only force login if the automatic OAuth window does not appear.

Important OAuth guard:

- Do not pass `--login` from Codex. It is deprecated.
- Do not manually run `open <authorization-url>` for an OAuth URL printed by `codex mcp add` unless the user confirms no browser tab opened. Opening the same authorization URL twice creates two callback tabs with the same `state` and different one-time `code` values.

## URL Normalization

Normalize workspace input as follows:

- If the input already starts with `http://` or `https://`, preserve that scheme.
- If the input has no scheme and is `localhost`, `127.x.x.x`, `[::1]`, `*.localhost`, or `*.localhost:<port>`, use `http://`.
- If the input has no scheme and is any other host, use `https://`.
- If the final URL does not end with `/mcp`, append `/mcp`.

Examples:

```text
myworkspace.diex.com       -> https://myworkspace.diex.com/mcp       name: diex-myworkspace
acme.example.com             -> https://acme.example.com/mcp             name: diex-acme-example
myworkspace.customdomain.com -> https://myworkspace.customdomain.com/mcp name: diex-myworkspace-customdomain
myworkspace.localhost:3001   -> http://myworkspace.localhost:3001/mcp   name: diex-myworkspace-localhost-3001
```

## Setup Workflow

Use the bundled helper from the Diex repo or plugin checkout:

```bash
bash packages/diex-codex-plugin/scripts/setup-mcp.sh <workspace-url-or-mcp-url>
```

Use `--name <server-name>` when configuring multiple Diex workspaces:

```bash
bash packages/diex-codex-plugin/scripts/setup-mcp.sh --name diex-prod acme.diex.com
bash packages/diex-codex-plugin/scripts/setup-mcp.sh --name diex-local acme.localhost:3001
```

Use `--force-login` only when running from a normal terminal and Codex did not open OAuth automatically:

```bash
bash packages/diex-codex-plugin/scripts/setup-mcp.sh --force-login acme.diex.com
```

Use `--print-url` to preview normalization without changing client config:

```bash
bash packages/diex-codex-plugin/scripts/setup-mcp.sh --print-url myworkspace.localhost:3001
```

The helper:

- Normalizes the URL.
- Derives a workspace-specific default MCP server name unless `--name` is provided.
- Replaces any existing MCP server with the same name.
- Runs `codex mcp add <name> --url <normalized-url>`.
- Prints the login command if Codex does not open OAuth automatically.
- Runs `codex mcp login <name>` only when `--force-login` is provided outside a Codex-managed shell.

## Manual Fallback

If the helper is unavailable, configure Codex manually:

```bash
codex mcp add diex-myworkspace --url https://myworkspace.diex.com/mcp
codex mcp login diex-myworkspace
```

For local development:

```bash
codex mcp add diex-local --url http://myworkspace.localhost:3001/mcp
codex mcp login diex-local
```

## Validation

After setup, verify the MCP server is available:

```bash
codex mcp get <server-name>
```

When connected, use the Diex MCP discovery flow:

```text
learn_tools -> execute_tool
```

## Troubleshooting

### Debugging Workflow

Use this workflow when the user reports missing tools, unexpected workspace data, authentication failures, or suspects Codex queried the wrong Diex workspace.

1. Identify the intended workspace URL or host from the user's request, using Required User Input when it is missing.
2. Normalize the intended workspace to its MCP URL:

```bash
bash packages/diex-codex-plugin/scripts/setup-mcp.sh --print-url <workspace-url-or-mcp-url>
```

3. Inspect configured Diex MCP servers and compare their URLs to the intended normalized URL:

```bash
codex mcp list
codex mcp get <server-name>
```

4. If no configured server points to the intended MCP URL, configure one with a workspace-specific name:

```bash
bash packages/diex-codex-plugin/scripts/setup-mcp.sh --name <server-name> <workspace-url-or-mcp-url>
```

5. If the server exists but authentication fails or MCP startup reports `Auth required`, run OAuth for that exact server:

```bash
codex mcp login <server-name>
```

6. If the configured server is correct and authenticated but its tools are not visible in the current Codex thread, explain that the thread may have loaded tools before the server was added or authenticated. Ask the user to refresh/reload Codex, start a new thread, or run a fresh `codex exec` query that loads the updated MCP config.
7. Before querying workspace data, confirm the callable Diex MCP namespace or tool name corresponds to the intended server. If only a different Diex server is callable, do not use it as a fallback unless the user explicitly asks.
8. When reporting results, state which workspace URL or MCP server was used if there was any ambiguity.

### Common Failure Modes

- If OAuth fails for a self-hosted workspace, check that `SERVER_URL` matches the public workspace origin. OAuth metadata and MCP URLs derive from that value.
- If a local workspace fails over HTTPS, use `http://` explicitly or rely on the helper's localhost default.
- If the server name already exists, the helper replaces that MCP entry with the new URL. Use a custom `--name` to keep multiple workspaces.

### Safety Rules

- Do not put API keys in plugin files. Prefer OAuth login. If an MCP client does not support OAuth, configure bearer headers only in the user's private MCP client config.
- Do not inspect or manually extract OAuth tokens as a workaround.
