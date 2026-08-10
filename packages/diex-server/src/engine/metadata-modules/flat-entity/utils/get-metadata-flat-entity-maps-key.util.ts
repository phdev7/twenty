import { capitalize } from 'diex-shared/utils';
import { type AllMetadataName } from 'diex-shared/metadata';

import { type MetadataToFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/types/metadata-to-flat-entity-maps-key';

export const getMetadataFlatEntityMapsKey = <T extends AllMetadataName>(
  metadataName: T,
): MetadataToFlatEntityMapsKey<T> =>
  `flat${capitalize(metadataName)}Maps` as MetadataToFlatEntityMapsKey<T>;
