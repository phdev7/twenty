import { type CSSProperties } from 'react';

import { brand, radii } from 'src/ui/diex-tokens';
import { safeThemeCssVariables as themeCssVariables } from 'src/ui/safe-theme-css-variables';

const border = `1px solid ${themeCssVariables.border.color.light}`;

export const accessRequestsStyles: Record<string, CSSProperties> = {
  root: {
    boxSizing: 'border-box',
    color: themeCssVariables.font.color.primary,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: themeCssVariables.font.family,
    gap: themeCssVariables.spacing[4],
    height: 'clamp(680px, calc(100dvh - 148px), 940px)',
    overflowY: 'auto',
    padding: themeCssVariables.spacing[4],
    width: '100%',
  },
  // Sections of the page root never shrink. The root is a fixed-height scrolling
  // flex column, so its children are shrinkable by default and a section that
  // also opted out of its min-content floor collapsed to zero and painted its
  // content over the rest of the page.
  header: {
    alignItems: 'center',
    background: themeCssVariables.background.secondary,
    border,
    borderRadius: radii.container,
    display: 'grid',
    flexShrink: 0,
    gap: themeCssVariables.spacing[4],
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    padding: `${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[5]}`,
  },
  headerTitle: {
    fontSize: themeCssVariables.font.size.xl,
    fontWeight: themeCssVariables.font.weight.semiBold,
    margin: 0,
  },
  headerSubtitle: {
    color: themeCssVariables.font.color.secondary,
    fontSize: themeCssVariables.font.size.sm,
    margin: `${themeCssVariables.spacing[1]} 0 0`,
    maxWidth: '72ch',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: themeCssVariables.spacing[3],
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: themeCssVariables.spacing[3],
    padding: themeCssVariables.spacing[5],
  },
  cardHead: {
    alignItems: 'baseline',
    display: 'flex',
    flexWrap: 'wrap',
    gap: themeCssVariables.spacing[2],
    justifyContent: 'space-between',
  },
  company: {
    fontSize: themeCssVariables.font.size.sm,
    fontWeight: themeCssVariables.font.weight.semiBold,
    margin: 0,
  },
  meta: {
    color: themeCssVariables.font.color.tertiary,
    fontSize: themeCssVariables.font.size.xs,
  },
  detailGrid: {
    display: 'grid',
    gap: themeCssVariables.spacing[2],
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  },
  detailLabel: {
    color: themeCssVariables.font.color.tertiary,
    fontSize: themeCssVariables.font.size.xxs,
  },
  detailValue: {
    fontSize: themeCssVariables.font.size.sm,
    overflowWrap: 'anywhere',
  },
  goal: {
    background: themeCssVariables.background.secondary,
    borderRadius: radii.control,
    color: themeCssVariables.font.color.secondary,
    fontSize: themeCssVariables.font.size.sm,
    margin: 0,
    padding: `${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]}`,
  },
  actions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: themeCssVariables.spacing[2],
  },
  subdomainField: {
    alignItems: 'center',
    display: 'flex',
    gap: themeCssVariables.spacing[2],
  },
  input: {
    background: themeCssVariables.background.primary,
    border: `1px solid ${themeCssVariables.border.color.light}`,
    borderRadius: radii.control,
    color: themeCssVariables.font.color.primary,
    fontFamily: themeCssVariables.font.family,
    fontSize: themeCssVariables.font.size.sm,
    padding: `${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]}`,
    width: '180px',
  },
  suffix: {
    color: themeCssVariables.font.color.tertiary,
    fontSize: themeCssVariables.font.size.xs,
  },
  outcome: {
    background: themeCssVariables.background.transparent.blue,
    border: `1px solid ${themeCssVariables.border.color.blue}`,
    borderRadius: radii.control,
    color: brand.accent,
    fontSize: themeCssVariables.font.size.sm,
    padding: `${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]}`,
  },
  warning: {
    background: themeCssVariables.background.transparent.danger,
    border: `1px solid ${themeCssVariables.border.color.danger}`,
    borderRadius: radii.control,
    color: themeCssVariables.font.color.danger,
    fontSize: themeCssVariables.font.size.sm,
    padding: `${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]}`,
  },
  error: {
    background: themeCssVariables.background.transparent.danger,
    border: `1px solid ${themeCssVariables.border.color.danger}`,
    borderRadius: radii.control,
    color: themeCssVariables.font.color.danger,
    flexShrink: 0,
    fontSize: themeCssVariables.font.size.sm,
    padding: `${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]}`,
  },
  empty: {
    color: themeCssVariables.font.color.tertiary,
    fontSize: themeCssVariables.font.size.sm,
    padding: themeCssVariables.spacing[5],
    textAlign: 'center',
  },
};
