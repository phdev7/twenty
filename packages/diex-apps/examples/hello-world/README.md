This is a [Diex](https://diex.com) application project bootstrapped with [`create-diex-app`](https://www.npmjs.com/package/create-diex-app).

## Getting Started

First, authenticate to your workspace:

```bash
yarn diex remote:add --api-url http://localhost:2020 --as local
```

Then, start development mode to sync your app and watch for changes:

```bash
yarn diex dev
```

Open your Diex instance and go to `/settings/applications` section to see the result.

## Available Commands

Run `yarn diex help` to list all available commands. Common commands:

```bash
# Remotes & Authentication
yarn diex remote:add --api-url http://localhost:2020 --as local     # Authenticate with Diex
yarn diex remote:status         # Check auth status
yarn diex remote:use            # Set default remote
yarn diex remote:list           # List all configured remotes
yarn diex remote:remove <name>  # Remove a remote

# Application
yarn diex dev            # Start dev mode (watch, build, sync, and auto-generate typed client)
yarn diex dev:add        # Scaffold a new entity (object, field, function, front-component, role, view, navigation-menu-item)
yarn diex dev:function:logs    # Stream function logs
yarn diex dev:function:exec    # Execute a function with JSON payload
yarn diex app:uninstall  # Uninstall app from workspace
```

## Integration Tests

If your project includes the example integration test (`src/__tests__/app-install.integration-test.ts`), you can run it with:

```bash
# Make sure a Diex server is running at http://localhost:3000
yarn test
```

The test builds and installs the app, then verifies it appears in the applications list. Test configuration (API URL and API key) is defined in `vitest.config.ts`.

## LLMs instructions

Main docs and pitfalls are available in LLMS.md file.

## Learn More

To learn more about Diex applications, take a look at the following resources:

- [diex-sdk](https://www.npmjs.com/package/diex-sdk) - learn about `diex-sdk` tool.
- [Diex doc](https://docs.diex.com/) - Diex's documentation.
- Join our [Discord](https://discord.gg/cx5n4Jzs57)

You can check out [the Diex GitHub repository](https://github.com/diexhq/diex) - your feedback and contributions are welcome!
