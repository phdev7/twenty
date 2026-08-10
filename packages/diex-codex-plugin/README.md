# Diex Codex Plugin

Official Codex plugin for building, deploying, and querying Diex apps. Bundles five focused skills, the public Diex documentation MCP server, and a one-command workspace MCP setup helper.

This package is the source of the plugin published to the Codex marketplace.

## What This Plugin Does

The plugin teaches Codex how to work with the Diex CRM platform. After installation, Codex can:

- Scaffold a new Diex app with `create-diex-app`.
- Add or modify app entities (objects, fields, logic functions, layouts, front components, workflows).
- Manage remotes, sync changes, build, deploy, view logs, and configure CI/CD.
- Prepare README, marketplace metadata, logos, and screenshots for npm/marketplace publication.
- Connect to a Diex workspace via MCP and present records as readable Markdown with linked record names.

## Installation

### From the Codex Marketplace

Search for "Diex" in the Codex plugin directory and install.

### Locally for Development

Copy the marketplace template to a local marketplace config:

```bash
cp packages/diex-codex-plugin/templates/marketplace.example.json .agents/plugins/marketplace.json
```

Then enable it in Codex via the plugin manager. See [`templates/marketplace.example.json`](./templates/marketplace.example.json) for the exact entry shape.

## Skills

| Skill | Use it for |
|---|---|
| [`create-app`](./skills/create-app/SKILL.md) | Scaffold a new Diex app with `create-diex-app`. |
| [`develop-app`](./skills/develop-app/SKILL.md) | Add or modify objects, fields, logic functions, layouts, front components, workflows. |
| [`manage-app`](./skills/manage-app/SKILL.md) | Manage remotes, sync, build, deploy, logs, troubleshooting, CI/CD. |
| [`publish-app`](./skills/publish-app/SKILL.md) | Prepare README, marketplace metadata, logos, screenshots, public assets. |
| [`use-diex-mcp`](./skills/use-diex-mcp/SKILL.md) | Configure Diex MCP and retrieve workspace records as readable Markdown. |

Cross-skill operating rules are in [`AGENTS.md`](./AGENTS.md). Reference docs are under [`references/`](./references/).

## MCP Setup

The plugin works in two layers:

- The bundled `diex-docs` MCP server works immediately and lets Codex search public Diex documentation.
- Workspace data access is user-specific. Each user adds their own Diex workspace MCP endpoint to their private Codex MCP config using the helper below.

**Do not** add workspace-specific MCP URLs to this package. They are user-local and belong only in the user's machine-local Codex MCP configuration.

### Quick MCP Setup

```bash
bash packages/diex-codex-plugin/scripts/setup-mcp.sh myworkspace.diex.com
```

The helper names the server after the workspace host (`diex-myworkspace`, `diex-acme-example`, etc.). Codex may open OAuth automatically after the server is added; if it does not, run `codex mcp login <server-name>`. Use `--force-login` only for terminal-only setup.

Equivalent manual CLI setup:

```bash
codex mcp add diex-myworkspace --url https://myworkspace.diex.com/mcp
codex mcp login diex-myworkspace
```

Supported workspace forms:

```text
myworkspace.diex.com       -> https://myworkspace.diex.com/mcp       name: diex-myworkspace
acme.example.com             -> https://acme.example.com/mcp             name: diex-acme-example
myworkspace.customdomain.com -> https://myworkspace.customdomain.com/mcp name: diex-myworkspace-customdomain
myworkspace.localhost:3001   -> http://myworkspace.localhost:3001/mcp    name: diex-myworkspace-localhost-3001
```

### App Declaration

Codex app declarations require a ChatGPT-created app or connector id. The plugin can reference that id, but it cannot create one from an MCP URL by itself.

For that reason, this package does not ship a default `.app.json`. A bundled app declaration would either point to the wrong workspace or expose an app id that is not valid for each user's ChatGPT Developer Mode setup. Keep app declarations local until there is an official shared Diex connector id.

After creating the Diex app in ChatGPT Developer Mode with your workspace MCP URL, add `packages/diex-codex-plugin/.app.json`:

```json
{
  "apps": {
    "diex": {
      "id": "asdk_app_OR_connector_ID_FROM_CHATGPT"
    }
  }
}
```

Then add `"apps": "./.app.json"` to `packages/diex-codex-plugin/.codex-plugin/plugin.json` and include `.app.json` in this package's `files` array.

## Development

Want to improve the plugin itself? See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for skill authoring, reference editing, validation, and the release process.

### Common Commands

```bash
# Validate the plugin
npx nx run diex-codex-plugin:validate

# Run validator unit tests
npx nx run diex-codex-plugin:test
```

### Compliance

Best-practices compliance is tracked in [`CHECKLIST.md`](./CHECKLIST.md) — every official Codex requirement maps to either an automated `validate.js` assertion or a manual sign-off. Changes are recorded in [`CHANGELOG.md`](./CHANGELOG.md).
