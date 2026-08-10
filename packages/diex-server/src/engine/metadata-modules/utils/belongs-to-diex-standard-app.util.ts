import { DIEX_STANDARD_APPLICATION } from 'src/engine/workspace-manager/diex-standard-application/constants/diex-standard-applications';
import { type UniversalSyncableFlatEntity } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-entity-from.type';

export const belongsToDiexStandardApp = <
  T extends UniversalSyncableFlatEntity,
>({
  applicationUniversalIdentifier,
}: T) =>
  applicationUniversalIdentifier ===
  DIEX_STANDARD_APPLICATION.universalIdentifier;
