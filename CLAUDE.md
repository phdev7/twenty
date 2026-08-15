# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandatory repository-wide instructions

Read and follow `AGENTS.md` before changing this repository. In particular,
important features must preserve existing workspace usage and declare their
versioned adoption requirement in the workspace product-update registry. A
missing new answer must never be silently accepted as completed onboarding.
Do not create or run tests unless Pedro explicitly requests them.

## Project Overview

Diex is an open-source CRM built with modern technologies in a monorepo structure. The codebase is organized as an Nx workspace with multiple packages.

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

### Database Operations
```bash
# Database management
npx nx database:reset diex-server         # Reset database
npx nx run diex-server:database:init:prod # Initialize database
npx nx run diex-server:database:migrate:prod # Run instance commands (fast only)

# Generate an instance command (fast or slow)
npx nx run diex-server:database:migrate:generate --name <name> --type <fast|slow>
```

### Database Inspection (Postgres MCP)

A read-only Postgres MCP server is configured in `.mcp.json`. Use it to:
- Inspect workspace data, metadata, and object definitions while developing
- Verify migration results (columns, types, constraints) after running migrations
- Explore the multi-tenant schema structure (core, metadata, workspace-specific schemas)
- Debug issues by querying raw data to confirm whether a bug is frontend, backend, or data-level
- Inspect metadata tables to debug GraphQL schema generation issues

This server is read-only — for write operations (reset, migrations, sync), use the CLI commands above.

### GraphQL
```bash
# Generate GraphQL types (run after schema changes)
npx nx run diex-front:graphql:generate
npx nx run diex-front:graphql:generate --configuration=metadata
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Jotai (state management), Linaria (styling), Vite
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, GraphQL (with GraphQL Yoga)
- **Monorepo**: Nx workspace managed with Yarn 4

### Package Structure
```
packages/
├── diex-front/          # React frontend application
├── diex-server/         # NestJS backend API
├── diex-ui/             # Shared UI components library
├── diex-shared/         # Common types and utilities
├── diex-emails/         # Email templates with React Email
├── diex-website/    # Next.js marketing website
├── diex-docs/           # Documentation website
├── diex-zapier/         # Zapier integration
└── diex-e2e-testing/    # Playwright E2E tests
```

### Key Development Principles
- **Functional components only** (no class components)
- **Named exports only** (no default exports)
- **Types over interfaces** (except when extending third-party interfaces)
- **String literals over enums** (except for GraphQL enums)
- **No 'any' type allowed** — strict TypeScript enforced
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

### Backend Architecture
- **NestJS modules** for feature organization
- **TypeORM** for database ORM with PostgreSQL
- **GraphQL** API with code-first approach
- **Redis** for caching and session management
- **BullMQ** for background job processing

### Database & Upgrade Commands
- **PostgreSQL** as primary database
- **Redis** for caching and sessions
- **ClickHouse** for analytics (when enabled)
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

### Testing Strategy
- **Test behavior, not implementation** — focus on user perspective
- **Test pyramid**: 70% unit, 20% integration, 10% E2E
- Query by user-visible elements (text, roles, labels) over test IDs
- Use `@testing-library/user-event` for realistic interactions
- Descriptive test names: "should [behavior] when [condition]"
- Clear mocks between tests with `jest.clearAllMocks()`

## Dev Environment Setup

All dev environments (Claude Code web, Cursor, local) use one script:

```bash
bash packages/diex-utils/setup-dev-env.sh
```

This handles everything: starts Postgres + Redis (auto-detects local services vs Docker), creates databases, copies `.env` files, and initializes the database schema (runs migrations) on a fresh database. Idempotent — safe to run multiple times.

- `--docker` — force Docker mode (uses `packages/diex-docker/docker-compose.dev.yml`)
- `--down` — stop services
- `--reset` — wipe data and restart fresh
- **Skip the setup script** for tasks that only read code — architecture questions, code review, documentation, etc.

**Note:** CI workflows (GitHub Actions) manage services via Actions service containers and run setup steps individually — they don't use this script.

## Important Files
- `nx.json` - Nx workspace configuration with task definitions
- `tsconfig.base.json` - Base TypeScript configuration
- `package.json` - Root package with workspace definitions
- `.cursor/rules/` - Detailed development guidelines and best practices
