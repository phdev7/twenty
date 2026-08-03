import { v4 } from 'uuid';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { type FlatObjectPermission } from 'src/engine/metadata-modules/flat-object-permission/types/flat-object-permission.type';
import {
  STANDARD_ROLE,
  STANDARD_ROLE_OBJECT_PERMISSION_DEFINITIONS,
  getStandardRoleObjectPermissionUniversalIdentifier,
} from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';
import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';

export const buildStandardFlatObjectPermissionMetadataMaps = ({
  now,
  workspaceId,
  twentyStandardApplicationId,
}: {
  now: string;
  workspaceId: string;
  twentyStandardApplicationId: string;
}): FlatEntityMaps<FlatObjectPermission> => {
  const roleUniversalIdentifier =
    STANDARD_ROLE.defaultFunction.universalIdentifier;
  const objectPermissionMetadatas =
    STANDARD_ROLE_OBJECT_PERMISSION_DEFINITIONS.map((objectPermission) => ({
      id: v4(),
      universalIdentifier: getStandardRoleObjectPermissionUniversalIdentifier({
        roleUniversalIdentifier,
        objectUniversalIdentifier: objectPermission.objectUniversalIdentifier,
      }),
      applicationUniversalIdentifier:
        TWENTY_STANDARD_APPLICATION.universalIdentifier,
      roleUniversalIdentifier,
      objectMetadataUniversalIdentifier:
        objectPermission.objectUniversalIdentifier,
      canReadObjectRecords: objectPermission.canReadObjectRecords,
      canUpdateObjectRecords: objectPermission.canUpdateObjectRecords,
      canSoftDeleteObjectRecords: objectPermission.canSoftDeleteObjectRecords,
      canDestroyObjectRecords: objectPermission.canDestroyObjectRecords,
      createdAt: now,
      updatedAt: now,
    }));

  let flatObjectPermissionMaps = createEmptyFlatEntityMaps();

  for (const objectPermissionMetadata of objectPermissionMetadatas) {
    flatObjectPermissionMaps = addFlatEntityToFlatEntityMapsOrThrow({
      flatEntity: {
        ...objectPermissionMetadata,
        workspaceId,
        applicationId: twentyStandardApplicationId,
      },
      flatEntityMaps: flatObjectPermissionMaps,
    });
  }

  return flatObjectPermissionMaps;
};
