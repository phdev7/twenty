<div align="center">
  <a href="https://diex.com">
    <picture>
      <img alt="Diex logo" src="https://raw.githubusercontent.com/diexhq/diex/main/packages/diex-website/public/images/core/logo.svg" height="128">
    </picture>
  </a>
  <h1>Diex SDK</h1>

<a href="https://www.npmjs.com/package/diex-sdk"><img alt="NPM version" src="https://img.shields.io/npm/v/diex-sdk.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/diexhq/diex/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/next.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://discord.gg/cx5n4Jzs57"><img alt="Join the community on Discord" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&logo=Diex&labelColor=000000&logoWidth=20"></a>

</div>

A CLI and SDK to develop, build, and publish applications that extend [Diex CRM](https://diex.com).

## Quick start

The recommended way to start is with [create-diex-app](https://www.npmjs.com/package/create-diex-app):

```bash
npx create-diex-app@latest my-diex-app
cd my-diex-app
yarn diex dev
```

## Documentation

Full documentation is available at **[docs.diex.com/developers/extend/apps](https://docs.diex.com/developers/extend/apps/getting-started)**:

- [Getting Started](https://docs.diex.com/developers/extend/apps/getting-started) — scaffolding, local server, authentication, dev mode
- [Building Apps](https://docs.diex.com/developers/extend/apps/building) — entity definitions, API clients, testing, CLI reference
- [Publishing](https://docs.diex.com/developers/extend/apps/publishing) — deploy, npm publish, marketplace

Guides in this repository:

- [Logic function inputs](./docs/logic-function-inputs.md) — input schema inference, record-typed inputs, and the id contract

## Manual installation

If you are adding `diex-sdk` to an existing project instead of using `create-diex-app`:

```bash
yarn add diex-sdk diex-client-sdk
```

Then add a `diex` script to your `package.json`:

```json
{
  "scripts": {
    "diex": "diex"
  }
}
```

Run `yarn diex help` to see all available commands.

## Configuration

The CLI stores credentials per remote in `~/.diex/config.json`. Run `yarn diex remote:add` to configure a remote, or `yarn diex remote:list` to see existing ones.

## Troubleshooting

- Auth errors: run `yarn diex remote:add` to re-authenticate.
- Typings out of date: restart `yarn diex dev` to refresh the client and types.
- Not seeing changes in dev: make sure dev mode is running (`yarn diex dev`).

## Contributing

### Development setup

```bash
git clone https://github.com/diexhq/diex.git
cd diex
yarn install
```

### Development mode

```bash
npx nx run diex-sdk:dev
```

### Production build

```bash
npx nx run diex-sdk:build
```

### Running the CLI locally

```bash
npx nx run diex-sdk:start -- <command>
```

### Resources

- See our [GitHub](https://github.com/diexhq/diex)
- Join our [Discord](https://discord.gg/cx5n4Jzs57)
