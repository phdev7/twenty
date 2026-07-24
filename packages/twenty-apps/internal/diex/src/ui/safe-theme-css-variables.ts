import { themeCssVariables as importedThemeCssVariables } from 'twenty-ui/theme-constants';

type ThemeFallback = Record<PropertyKey, unknown>;

let themeFallback: ThemeFallback;

themeFallback = new Proxy({} as ThemeFallback, {
  get: (_target, property) =>
    property === Symbol.toPrimitive ? () => '' : themeFallback,
});

export const safeThemeCssVariables =
  importedThemeCssVariables ??
  (themeFallback as unknown as typeof importedThemeCssVariables);
