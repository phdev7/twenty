import { DIEX_CURRENT_VERSION } from 'src/engine/core-modules/upgrade/constants/diex-current-version.constant';
import { DIEX_NEXT_VERSIONS } from 'src/engine/core-modules/upgrade/constants/diex-next-versions.constant';
import { DIEX_PREVIOUS_VERSIONS } from 'src/engine/core-modules/upgrade/constants/diex-previous-versions.constant';

export const DIEX_ALL_VERSIONS = [
  ...DIEX_PREVIOUS_VERSIONS,
  DIEX_CURRENT_VERSION,
  ...DIEX_NEXT_VERSIONS,
] as const;

export type DiexAllVersion = (typeof DIEX_ALL_VERSIONS)[number];
