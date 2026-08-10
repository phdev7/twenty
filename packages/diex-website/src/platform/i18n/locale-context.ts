'use client';

import { createContext } from 'react';
import {
  DOCUMENTATION_DEFAULT_LANGUAGE,
  type DocumentationSupportedLanguage,
} from 'diex-shared/constants';

export const LocaleContext = createContext<DocumentationSupportedLanguage>(
  DOCUMENTATION_DEFAULT_LANGUAGE,
);
