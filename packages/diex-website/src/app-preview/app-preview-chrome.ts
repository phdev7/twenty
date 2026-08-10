import { THEME_COMMON } from 'diex-ui/theme';

// Product layout facts the mockup mirrors that aren't part of diex-ui's
// theme. The spacing base and nav-item height derive from diex-ui's spacing
// unit; the drawer width and record-table row height are diex-front layout
// constants (NavigationDrawerConstraints / RecordTableRowHeight).
export const APP_PREVIEW_CHROME = {
  spacingBasePx: THEME_COMMON.spacingMultiplicator,
  navigationItemHeightPx: THEME_COMMON.spacingMultiplicator * 7,
  navigationDrawerWidthPx: 220,
  recordTableRowHeightPx: 32,
};
