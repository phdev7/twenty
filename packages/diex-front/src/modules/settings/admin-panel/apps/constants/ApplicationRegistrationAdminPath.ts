import { SettingsPath } from 'diex-shared/types';
import { getSettingsPath } from 'diex-shared/utils';

export const APPLICATION_REGISTRATION_ADMIN_PATH = getSettingsPath(
  SettingsPath.AdminPanel,
  undefined,
  undefined,
  'apps',
);
