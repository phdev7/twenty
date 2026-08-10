import { type AllMetadataName } from 'diex-shared/metadata';

import { type AllFlatEntityTypesByMetadataName } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-types-by-metadata-name';

export type MetadataFlatEntity<T extends AllMetadataName> =
  AllFlatEntityTypesByMetadataName[T]['flatEntity'];
