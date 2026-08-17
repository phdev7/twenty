# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandatory repository-wide instructions

Read and follow `AGENTS.md` before changing this repository. In particular,
important features must preserve existing workspace usage and declare their
versioned adoption requirement in the workspace product-update registry. A
missing new answer must never be silently accepted as completed onboarding.
Do not create or run tests unless Pedro explicitly requests them.

## Key Commands

### Development
```bash
# Start development environment (frontend + backend + worker)
yarn start

# Individual package development
npx nx start diex-front     # Start frontend dev server
npx nx start diex-server    # Start backend server
npx nx run diex-server:worker  # Start background worker
```

### Testing
```bash
# Preferred: run a single test file (fast)
npx jest path/to/test.test.ts --config=packages/PROJECT/jest.config.mjs

# Run all tests for a package
npx nx test diex-front      # Frontend unit tests
npx nx test diex-server     # Backend unit tests
npx nx run diex-server:test:integration:with-db-reset  # Integration tests with DB reset
# To run an individual test or a pattern of tests, use the following command:
cd packages/{workspace} && npx jest "pattern or filename"

# Storybook
npx nx storybook:build diex-front
npx nx storybook:test diex-front

# When testing the UI end to end, click on "Continue with Email" and use the prefilled credentials.
```

### Code Quality

**Lint uncommitted work with `scripts/lint-changed.sh`, never with `lint:diff-with-main`.**
`lint:diff-with-main` compares `main...HEAD`, so it cannot see changes that are
still in the working tree. On uncommitted work it prints "No changed files" and
exits 0, reporting success over code it never read. Use it only to re-check
work that is already committed.

```bash
# Lint what you actually changed (working tree included)
bash scripts/lint-changed.sh              # both packages
bash scripts/lint-changed.sh diex-server  # one package
bash scripts/lint-changed.sh --fix        # apply autofixes

# Linting already-committed work only
npx nx lint:diff-with-main diex-front
npx nx lint:diff-with-main diex-server

# Linting (full project - slower, use only when needed)
npx nx lint diex-front
npx nx lint diex-server

# Type checking
npx nx typecheck diex-front
npx nx typecheck diex-server

# Format code
npx nx fmt diex-front
npx nx fmt diex-server
```

### Build
```bash
# Build packages (diex-shared must be built first)
npx nx build diex-shared
npx nx build diex-front
npx nx build diex-server
```

### Database, migrations and GraphQL

See the `database-and-graphql` skill for the reset/init/migrate commands, the
read-only Postgres MCP server, and `graphql:generate`.

## Architecture Overview

### Key Development Principles
- **Functional components only** (no class components)
- **Named exports only** (no default exports)
- **Types over interfaces** (except when extending third-party interfaces)
- **String literals over enums** (except for GraphQL enums)
- **Event handlers preferred over useEffect** for state updates
- **Props down, events up** — unidirectional data flow
- **Composition over inheritance**
- **No abbreviations** in variable names (`user` not `u`, `fieldMetadata` not `fm`)

### Naming Conventions
- **Variables/functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Types/Classes**: PascalCase (suffix component props with `Props`, e.g. `ButtonProps`)
- **Files/directories**: kebab-case with descriptive suffixes (`.component.tsx`, `.service.ts`, `.entity.ts`, `.dto.ts`, `.module.ts`)
- **TypeScript generics**: descriptive names (`TData` not `T`)

### File Structure
- Components under 300 lines, services under 500 lines
- Components in their own directories with tests and stories
- Use `index.ts` barrel exports for clean imports
- Import order: external libraries first, then internal (`@/`), then relative

### Comments
- Use short-form comments (`//`), not JSDoc blocks
- Explain WHY (business logic), not WHAT
- Do not comment obvious code
- Multi-line comments use multiple `//` lines, not `/** */`

### State Management
- **Jotai** for global state: atoms for primitive state, selectors for derived state, atom families for dynamic collections
- Component-specific state with React hooks (`useState`, `useReducer` for complex logic)
- GraphQL cache managed by Apollo Client
- Use functional state updates: `setState(prev => prev + 1)`

### Database & Upgrade Commands
- When changing entity files, generate an **instance command** (`database:migrate:generate --name <name> --type <fast|slow>`)
- **Fast** instance commands handle schema changes; **slow** ones add a `runDataMigration` step for data backfills
- **Workspace commands** iterate over all active/suspended workspaces for per-workspace upgrades
- Commands use `@RegisteredInstanceCommand` and `@RegisteredWorkspaceCommand` decorators for automatic discovery
- Include both `up` and `down` logic in instance commands
- Never delete or rewrite committed instance command `up`/`down` logic
- See `packages/diex-server/docs/UPGRADE_COMMANDS.md` for full documentation

### Utility Helpers
Use existing helpers from `diex-shared` instead of manual type guards:
- `isDefined()`, `isNonEmptyString()`, `isNonEmptyArray()`

## Development Workflow

IMPORTANT: Use Context7 for code generation, setup or configuration steps, or library/API documentation. Automatically use the Context7 MCP tools to resolve library IDs and get library docs without waiting for explicit requests.

### Before Making Changes
Read `docs/RECURRING_FAILURES.md` first. It lists the nine failure classes that
have actually broken this codebase, with the correct pattern for each. Most of
them take down the whole process at boot, not just the code you touched.

### Definition of done
Work is not finished until all of this passes. Run it before reporting success:

```bash
bash scripts/lint-changed.sh          # sees uncommitted work; diff-with-main does not
npx nx typecheck diex-server
npx nx typecheck diex-front
npx nx start diex-server              # both entrypoints: a require cycle can
npx nx run diex-server:worker         # break one and leave the other clean
```

A pre-commit hook in `.githooks/` runs the lint step on staged files and blocks
the commit when it fails, so that part cannot be skipped by forgetting. It is
enabled by `core.hooksPath`, which `yarn install` sets via the root `prepare`
script; run `git config core.hooksPath .githooks` if it is ever unset. The hook
covers lint and formatting only. Typecheck and the two boot checks are too slow
for a hook and remain your responsibility.

1. Test changes with relevant test suites (prefer single-file test runs)
2. Ensure instance commands are generated for entity changes (`database:migrate:generate`)
3. Check that GraphQL schema changes are backward compatible
4. Run `graphql:generate` after any GraphQL schema changes

### Code Style Notes
- Use **Linaria** for styling with zero-runtime CSS-in-JS (styled-components pattern)
- Follow **Nx** workspace conventions for imports
- Use **Lingui** for internationalization
- Apply security first, then formatting (sanitize before format)

## Dev Environment Setup

See the `dev-environment` skill for `packages/diex-utils/setup-dev-env.sh` and
its flags. Skip setup entirely for tasks that only read code.

## Important Files
- `.cursor/rules/` - Detailed development guidelines and best practices
