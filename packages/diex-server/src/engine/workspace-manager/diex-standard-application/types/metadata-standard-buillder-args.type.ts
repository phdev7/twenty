import { type AllMetadataName } from 'diex-shared/metadata';

import { type MetadataValidationRelatedUniversalFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/metadata-related-types.type';
import { type StandardObjectMetadataRelatedEntityIds } from 'src/engine/workspace-manager/diex-standard-application/utils/get-standard-object-metadata-related-entity-ids.util';
import { type ComputeDiexStandardApplicationAllFlatEntityMapsArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/diex-standard-application-all-flat-entity-maps.constant';

export type StandardBuilderArgs<T extends AllMetadataName> = {
  standardObjectMetadataRelatedEntityIds: StandardObjectMetadataRelatedEntityIds;
  dependencyFlatEntityMaps: MetadataValidationRelatedUniversalFlatEntityMaps<T>;
} & ComputeDiexStandardApplicationAllFlatEntityMapsArgs;
