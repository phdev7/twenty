import { v4 } from 'uuid';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { type FlatRolePermissionFlag } from 'src/engine/metadata-modules/flat-role-permission-flag/types/flat-role-permission-flag.type';
import {
  STANDARD_ROLE,
  STANDARD_ROLE_PERMISSION_FLAG_UNIVERSAL_IDENTIFIERS,
  getStandardRolePermissionFlagUniversalIdentifier,
} from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';
import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';

export const buildStandardFlatRolePermissionFlagMetadataMaps = ({
  now,
  workspaceId,
  twentyStandardApplicationId,
}: {
  now: string;
  workspaceId: string;
  twentyStandardApplicationId: string;
}): FlatEntityMaps<FlatRolePermissionFlag> => {
  const roleUniversalIdentifier =
    STANDARD_ROLE.defaultFunction.universalIdentifier;
  const rolePermissionFlagMetadatas =
    STANDARD_ROLE_PERMISSION_FLAG_UNIVERSAL_IDENTIFIERS.map(
      (permissionFlagUniversalIdentifier) => ({
        id: v4(),
        universalIdentifier: getStandardRolePermissionFlagUniversalIdentifier({
          roleUniversalIdentifier,
          permissionFlagUniversalIdentifier,
        }),
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION.universalIdentifier,
        roleUniversalIdentifier,
        permissionFlagUniversalIdentifier,
        createdAt: now,
        updatedAt: now,
      }),
    );

  let flatRolePermissionFlagMaps = createEmptyFlatEntityMaps();

  for (const rolePermissionFlagMetadata of rolePermissionFlagMetadatas) {
    flatRolePermissionFlagMaps = addFlatEntityToFlatEntityMapsOrThrow({
      flatEntity: {
        ...rolePermissionFlagMetadata,
        workspaceId,
        applicationId: twentyStandardApplicationId,
      },
      flatEntityMaps: flatRolePermissionFlagMaps,
    });
  }

  return flatRolePermissionFlagMaps;
};
