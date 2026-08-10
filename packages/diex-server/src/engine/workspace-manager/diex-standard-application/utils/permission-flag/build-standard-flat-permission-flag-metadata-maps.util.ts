import { v4 } from 'uuid';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { type FlatPermissionFlag } from 'src/engine/metadata-modules/flat-permission-flag/types/flat-permission-flag.type';
import { STANDARD_PERMISSION_FLAG_DEFINITIONS } from 'src/engine/metadata-modules/permission-flag/constants/standard-permission-flag-definitions.constant';
import { DIEX_STANDARD_APPLICATION } from 'src/engine/workspace-manager/diex-standard-application/constants/diex-standard-applications';

export const buildStandardFlatPermissionFlagMetadataMaps = ({
  now,
  workspaceId,
  diexStandardApplicationId,
}: {
  now: string;
  workspaceId: string;
  diexStandardApplicationId: string;
}): FlatEntityMaps<FlatPermissionFlag> => {
  let flatPermissionFlagMaps = createEmptyFlatEntityMaps();

  for (const permissionFlagDefinition of STANDARD_PERMISSION_FLAG_DEFINITIONS) {
    flatPermissionFlagMaps = addFlatEntityToFlatEntityMapsOrThrow({
      flatEntity: {
        id: v4(),
        ...permissionFlagDefinition,
        workspaceId,
        applicationId: diexStandardApplicationId,
        universalIdentifier: permissionFlagDefinition.universalIdentifier,
        applicationUniversalIdentifier:
          DIEX_STANDARD_APPLICATION.universalIdentifier,
        rolePermissionFlagIds: [],
        rolePermissionFlagUniversalIdentifiers: [],
        createdAt: now,
        updatedAt: now,
      },
      flatEntityMaps: flatPermissionFlagMaps,
    });
  }

  return flatPermissionFlagMaps;
};
