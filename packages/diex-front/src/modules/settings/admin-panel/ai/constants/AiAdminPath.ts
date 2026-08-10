import { SettingsPath } from 'diex-shared/types';
import { getSettingsPath } from 'diex-shared/utils';

export const AI_ADMIN_PATH = getSettingsPath(
  SettingsPath.AdminPanel,
  undefined,
  undefined,
  'ai',
);
