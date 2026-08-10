import { DIEX_CURRENT_VERSION } from 'src/engine/core-modules/upgrade/constants/diex-current-version.constant';
import { DIEX_PREVIOUS_VERSIONS } from 'src/engine/core-modules/upgrade/constants/diex-previous-versions.constant';

export const DIEX_CROSS_UPGRADE_SUPPORTED_VERSIONS = [
  ...DIEX_PREVIOUS_VERSIONS,
  DIEX_CURRENT_VERSION,
] as const;

export type DiexCrossUpgradeSupportedVersion =
  (typeof DIEX_CROSS_UPGRADE_SUPPORTED_VERSIONS)[number];
