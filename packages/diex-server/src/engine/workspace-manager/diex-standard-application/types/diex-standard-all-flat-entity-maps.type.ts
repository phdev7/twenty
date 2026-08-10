import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { type MetadataToFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/types/metadata-to-flat-entity-maps-key';
import { type DIEX_STANDARD_ALL_METADATA_NAME } from 'src/engine/workspace-manager/diex-standard-application/constants/diex-standard-all-metadata-name.constant';

export type DiexStandardAllFlatEntityMaps = Pick<
  AllFlatEntityMaps,
  MetadataToFlatEntityMapsKey<
    (typeof DIEX_STANDARD_ALL_METADATA_NAME)[number]
  >
>;
