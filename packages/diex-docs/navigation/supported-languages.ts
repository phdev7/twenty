// Re-export from diex-shared (source of truth)
// Using relative path because these scripts run via tsx from workspace root
export { DOCUMENTATION_DEFAULT_LANGUAGE as DEFAULT_LANGUAGE } from '../../diex-shared/src/constants/DocumentationDefaultLanguage';
export {
  DOCUMENTATION_SUPPORTED_LANGUAGES as SUPPORTED_LANGUAGES,
  type DocumentationSupportedLanguage as SupportedLanguage,
} from '../../diex-shared/src/constants/DocumentationSupportedLanguages';
