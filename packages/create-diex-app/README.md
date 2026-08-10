<div align="center">
  <a href="https://diex.com">
    <picture>
      <img alt="Diex logo" src="https://raw.githubusercontent.com/diexhq/diex/main/packages/diex-website/public/images/core/logo.svg" height="128">
    </picture>
  </a>
  <h1>Create Diex App</h1>

<a href="https://www.npmjs.com/package/create-diex-app"><img alt="NPM version" src="https://img.shields.io/npm/v/create-diex-app.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/diexhq/diex/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/next.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://discord.gg/cx5n4Jzs57"><img alt="Join the community on Discord" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&logo=Diex&labelColor=000000&logoWidth=20"></a>

</div>

The official scaffolding CLI for building apps on top of [Diex CRM](https://diex.com). Sets up a ready-to-run project with [diex-sdk](https://www.npmjs.com/package/diex-sdk).

## Quick start

```bash
npx create-diex-app@latest my-diex-app
cd my-diex-app
yarn diex dev
```

The scaffolder will:

1. Create a new project with TypeScript, linting, tests, and a preconfigured `diex` CLI
2. Start a local Diex server via Docker (pulls the latest image automatically)
3. Authenticate with the development API key

## Options

| Flag                               | Description                                                           |
| ---------------------------------- | --------------------------------------------------------------------- |
| `--name <name>`                    | Set the app name                                                      |
| `--display-name <displayName>`     | Set the display name                                                  |
| `--description <description>`      | Set the description                                                   |
| `--url <url>`                      | Diex workspace URL (default: `http://localhost:2020`)               |
| `--authentication-method <method>` | `oauth` or `apiKey` (default: `apiKey` for local, `oauth` for remote) |

## Documentation

Full documentation is available at **[docs.diex.com/developers/extend/apps](https://docs.diex.com/developers/extend/apps/getting-started/quick-start)**:

- [Quick Start](https://docs.diex.com/developers/extend/apps/getting-started/quick-start) — scaffold, run a local server, sync your code
- [Concepts](https://docs.diex.com/developers/extend/apps/getting-started/concepts) — how apps work: entity model, sandboxing, lifecycle
- [Operations](https://docs.diex.com/developers/extend/apps/operations/overview) — CLI, testing, CI, deploy and publish

## Troubleshooting

- Server not starting: check Docker is running (`docker info`), then try `yarn diex docker:logs`.
- Auth not working: run `yarn diex remote:add` to re-authenticate.
- Types not generated: ensure `yarn diex dev` is running — it auto-generates the typed client.

## Contributing

- See our [GitHub](https://github.com/diexhq/diex)
- Join our [Discord](https://discord.gg/cx5n4Jzs57)
