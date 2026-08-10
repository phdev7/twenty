# Front Components

Use this reference for Diex app front component source files, registration, data access, Diex UI imports, runtime imports, and browser verification.

Use `layout.md` for placing a front component in a page layout. Use `standalone-pages.md` for full-page custom UI rendered through a front component widget. Use `../design/front-component-ui.md` for visual design, spacing, states, and polish. Use `app-structure.md` for the develop-app validation checklist and `../manage-app/cli-and-sync.md` for command behavior or troubleshooting.

## Source And Registration

By convention, keep front components under `src/front-components/`, often as `<name>.front-component.tsx`.

Register the component with `defineFrontComponent`:

```tsx
import { defineFrontComponent } from 'diex-sdk/define';

const MyFrontComponent = () => {
  return <div />;
};

export default defineFrontComponent({
  universalIdentifier: '<front-component-uuid>',
  name: '<front-component-name>',
  description: '<short description>',
  component: MyFrontComponent,
});
```

Do not import or call `react-dom/client` in the component source. The SDK renderer mounts front components.

## Runtime Imports

Keep imports narrow:

- Use `diex-sdk/front-component` for front component hooks and host APIs.
- Use `diex-client-sdk/core` or `diex-client-sdk/metadata` for data access.
- Install `diex-ui@1.0.0-alpha.1` from npm and import Diex UI components, icons, and theme tokens from its subpaths (`diex-ui/input`, `diex-ui/data-display`, `diex-ui/icon`, `diex-ui/typography`, `diex-ui/theme-constants`, and others) before adding external UI libraries.

The front component renderer provides a Diex `ThemeProvider` around the remote root. For isolated examples or local story-style verification, wrapping the component in `ThemeProvider` from `diex-ui/theme-constants` is also acceptable.

The canonical Diex UI front component example is `packages/diex-front-component-renderer/src/__stories__/showcase/diex-ui-example.front-component.tsx`. It imports `Button` from `diex-ui/input`; `Chip`, `Status`, and `Tag` from `diex-ui/data-display`; `H2Title` from `diex-ui/typography`; and `ThemeProvider` from `diex-ui/theme-constants`.

Read theme tokens with the `useTheme()` hook from `diex-ui/theme-constants` inside the component body. The same tokens are also exported as the `themeCssVariables` constant, but the SDK mocks `diex-ui` during manifest extraction, so a module-level constant that dereferences `themeCssVariables` can fail before the component renders — prefer `useTheme()`.

Prefer Diex UI icons from `diex-ui/icon` when one exists. Use inline SVG only for app-specific marks or icons that are not available from `diex-ui/icon`.

## Record Context And Data

For record-page components, read selection from front component context:

- Use `useSelectedRecordIds()` for single, bulk, or empty selection; derive one id only when the array length is 1.

Use the generated or core Diex client for reads and writes. Keep loading, empty, error, disabled, and saving states explicit so runtime failures are visible and recoverable.

## Headless Actions And DRY Helpers

Headless front components should be thin action shells. The component file should mostly read SDK hooks, return the `Command` helper, and delegate reusable behavior to helpers.

Common headless action flow:

1. Read selected record IDs.
2. Load the selected records.
3. Build a payload for one logic-function call.
4. Execute the logic function.
5. Parse the result summary.
6. Show a snackbar.
7. Let `Command` unmount the component.

Do not duplicate this orchestration across sibling front components. When two components share command execution flow, extract it before copying:

- Pure helpers go in `src/utils/<name>.util.ts`.
- Front-component runtime helpers go in `src/front-components/utils/<name>.util.ts`.
- Payload builders, result parsers, selected-record validators, and summary formatters should be small testable functions with sibling specs.

Each extracted helper and type lives in its own file: one export per file. A local, non-exported type may stay with the util, but an exported type moves to its own file. See `app-structure.md`.

Prefer configuration-driven helpers when creating parallel actions for people, companies, tasks, or other objects. Each front component should provide only object-specific configuration, such as the front component universal identifier, logic function universal identifier, record query, payload builder, labels, and snackbar copy.

## Bulk Logic Function Calls

When a front component triggers a logic function for selected records, always prefer a bulk payload shape unless the user explicitly says the logic function is only for one record. The front component should call the logic function once with all selected records, not loop and execute the same logic function once per record.

Default payload shape:

```ts
{
  records: Array<{
    id: string;
    // object-specific fields used by the logic function
  }>;
}
```

Inside `records`, prefer `id` for the Diex record ID because the array name already establishes record context. Do not add flat `recordId` payloads unless the user explicitly asks for a single-record action.

Logic functions that return per-record outcomes should mirror the same naming:

```ts
{
  ok: boolean;
  enrichedCount: number;
  noMatchCount: number;
  failedCount: number;
  results: Array<{
    id: string;
    status: 'ENRICHED' | 'NO_MATCH' | 'FAILED';
    error?: string;
  }>;
}
```

If an existing logic function accepts only a flat record ID, prefer upgrading it to accept `records` and remove the old flat input unless the user explicitly asks to preserve it.

## Runtime Verification

A clean typecheck and sync is not runtime verification. After the standard validation in `app-structure.md`, open the relevant Diex surface and confirm:

- The widget mounts without a `FrontComponent error` in the widget body or toast.
- The component renders loading, empty, and error states correctly.
- The main user action works against a real record.
- The page still renders after a hard refresh.
