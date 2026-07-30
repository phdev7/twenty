import { type CSSProperties } from 'react';

import { brand, radii } from 'src/ui/diex-tokens';
import { safeThemeCssVariables as themeCssVariables } from 'src/ui/safe-theme-css-variables';

const border = `1px solid ${themeCssVariables.border.color.light}`;

export const onboardingStyles: Record<string, CSSProperties> = {
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
    maxWidth: '68ch',
  },
  progressLine: {
    alignItems: 'center',
    color: themeCssVariables.font.color.tertiary,
    display: 'flex',
    fontSize: themeCssVariables.font.size.xs,
    gap: themeCssVariables.spacing[2],
    marginTop: themeCssVariables.spacing[3],
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: themeCssVariables.spacing[4],
  },
  step: {
    display: 'grid',
    gap: themeCssVariables.spacing[4],
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    padding: themeCssVariables.spacing[5],
  },
  stepMarker: {
    alignItems: 'center',
    borderRadius: radii.pill,
    display: 'flex',
    flexShrink: 0,
    fontSize: themeCssVariables.font.size.xs,
    fontWeight: themeCssVariables.font.weight.semiBold,
    height: '28px',
    justifyContent: 'center',
    width: '28px',
  },
  stepMarkerPending: {
    background: themeCssVariables.background.transparent.blue,
    border: `1px solid ${themeCssVariables.border.color.blue}`,
    color: brand.accent,
  },
  stepMarkerDone: {
    background: themeCssVariables.tag.background.green,
    border: '1px solid transparent',
    color: themeCssVariables.color.green,
  },
  stepBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: themeCssVariables.spacing[3],
  },
  stepHeadline: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: themeCssVariables.spacing[2],
    justifyContent: 'space-between',
  },
  stepTitle: {
    fontSize: themeCssVariables.font.size.sm,
    fontWeight: themeCssVariables.font.weight.semiBold,
    margin: 0,
  },
  stepText: {
    color: themeCssVariables.font.color.secondary,
    fontSize: themeCssVariables.font.size.sm,
    margin: 0,
    maxWidth: '72ch',
  },
  stepActions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: themeCssVariables.spacing[2],
  },
  qrPanel: {
    alignItems: 'center',
    background: themeCssVariables.background.primary,
    border,
    borderRadius: radii.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: themeCssVariables.spacing[3],
    padding: themeCssVariables.spacing[4],
    width: 'fit-content',
  },
  // The QR is rendered on a fixed white plate: WhatsApp fails to read it when
  // the dark theme tints the quiet zone around the code.
  qrImage: {
    background: '#ffffff',
    borderRadius: radii.control,
    display: 'block',
    height: '212px',
    padding: themeCssVariables.spacing[2],
    width: '212px',
  },
  qrCaption: {
    color: themeCssVariables.font.color.tertiary,
    fontSize: themeCssVariables.font.size.xs,
    margin: 0,
    maxWidth: '30ch',
    textAlign: 'center',
  },
  fieldGrid: {
    display: 'grid',
    gap: themeCssVariables.spacing[2],
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  field: {
    alignItems: 'baseline',
    border,
    borderRadius: radii.control,
    display: 'flex',
    gap: themeCssVariables.spacing[2],
    justifyContent: 'space-between',
    padding: `${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]}`,
  },
  fieldLabel: {
    fontSize: themeCssVariables.font.size.xs,
    fontWeight: themeCssVariables.font.weight.medium,
  },
  hint: {
    color: themeCssVariables.font.color.tertiary,
    fontSize: themeCssVariables.font.size.xs,
    margin: 0,
  },
  metrics: {
    display: 'grid',
    gap: themeCssVariables.spacing[3],
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  },
  metric: {
    border,
    borderRadius: radii.control,
    padding: `${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]}`,
  },
  metricValue: {
    fontSize: themeCssVariables.font.size.xl,
    fontWeight: themeCssVariables.font.weight.semiBold,
    lineHeight: 1.2,
  },
  metricLabel: {
    color: themeCssVariables.font.color.tertiary,
    fontSize: themeCssVariables.font.size.xs,
    marginTop: themeCssVariables.spacing[1],
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
};
