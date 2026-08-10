import { type AppLocale } from 'diex-shared/translations';

export type TranslationCatalogsByLocale = Partial<
  Record<AppLocale, Record<string, string>>
>;
