<p align="center">
  <img src="https://raw.githubusercontent.com/diexhq/diex/main/packages/diex-ui/logo.png" width="136" height="136" alt="diex-ui logo" />
</p>

# diex-ui

Diex's open-source React UI component library: components, icons, and design tokens built on a zero-runtime, CSS-variable styling layer.

# Installation

```bash
npm install diex-ui
```

`react`, `react-dom`, and `monaco-editor` are peer dependencies (install them in your app). `monaco-editor` is only required if you use the code editor components.

# Usage

Import the base styles once, pick a theme stylesheet, and wrap your app in `ThemeProvider`:

```tsx
import { ThemeProvider } from 'diex-ui/theme-constants';
import { Button } from 'diex-ui/input';

import 'diex-ui/style.css';
import 'diex-ui/theme-light.css';

export const App = () => (
  <ThemeProvider colorScheme="light">
    <Button title="Click me" />
  </ThemeProvider>
);
```

Components are available from the root entry point or from a specific subpath for better tree-shaking:

```tsx
import { Button } from 'diex-ui';
import { Button } from 'diex-ui/input';
```

# Entry points

| Subpath | Contents |
| --- | --- |
| `diex-ui` | All components, icons, theme tokens, and utilities |
| `diex-ui/accessibility` | Accessibility helpers |
| `diex-ui/assets` | Logos and static assets |
| `diex-ui/data-display` | Avatars, chips, tags, and other display components |
| `diex-ui/feedback` | Progress bars, loaders, and status feedback |
| `diex-ui/icon` | Icon components and the icon provider |
| `diex-ui/input` | Buttons, toggles, and form inputs |
| `diex-ui/json-visualizer` | JSON tree viewer |
| `diex-ui/layout` | Layout primitives |
| `diex-ui/navigation` | Menus, links, and navigation components |
| `diex-ui/surfaces` | Cards, tooltips, and surface components |
| `diex-ui/testing` | Storybook and test decorators |
| `diex-ui/theme` | Theme types and helpers |
| `diex-ui/theme-constants` | Design tokens, `ThemeProvider`, and `useTheme` |
| `diex-ui/typography` | Text and typography components |
| `diex-ui/utilities` | Hooks and shared utilities |

# Theming

- `diex-ui/style.css` ships the base reset and component styles. Import it once.
- `diex-ui/theme-light.css` and `diex-ui/theme-dark.css` define the design-token CSS variables for each color scheme.
- `ThemeProvider` exposes the active theme through `useTheme()` and applies the `light` / `dark` class. Pass `applyToRoot={false}` with `overrides` to scope a theme to a subtree instead of the document root.

# Development

```bash
npx nx build diex-ui                 # Build the library (dual ESM/CJS + types)
npx nx storybook:serve:dev diex-ui   # Run Storybook
npx nx test diex-ui                  # Run unit tests
```

# License

diex-ui is released under the [AGPL-3.0](https://github.com/diexhq/diex/blob/main/packages/diex-ui/LICENSE) license.
