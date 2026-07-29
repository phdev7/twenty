// The one place corner radius, brand color and interaction feedback are
// decided for every Diex surface. Twenty's own scale only offers 4px and 8px,
// which left each screen picking its own mix; these three steps are assigned by
// what an element *is*, so a button is never rounder than the card holding it.
export const radii = {
  control: '6px',
  surface: '10px',
  container: '12px',
  pill: '999px',
  circle: '50%',
} as const;

// Diex indigo, taken from the logomark gradient. It carries actions and the
// operator's own messages — never a whole panel, so large surfaces keep the
// neutral background the rest of the CRM uses.
const INDIGO = '93, 84, 232';

export const brand = {
  solid: `rgb(${INDIGO})`,
  solidHover: '#5049E0',
  solidActive: '#4038CD',
  // 5.2:1 against the solid fill, so button labels stay readable in both themes.
  onSolid: '#FFFFFF',
  // Lighter step used for icons, markers and selected indicators: it clears 3:1
  // against both the light and the dark surface, which fixed brand ink cannot
  // do in a themed app. Body text keeps the theme's own font colors.
  accent: '#6E66EC',
  tint: `rgba(${INDIGO}, 0.12)`,
  tintStrong: `rgba(${INDIGO}, 0.2)`,
  border: `rgba(${INDIGO}, 0.32)`,
  focusRing: `0 0 0 3px rgba(${INDIGO}, 0.32)`,
} as const;

export const motion = {
  control: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
} as const;
