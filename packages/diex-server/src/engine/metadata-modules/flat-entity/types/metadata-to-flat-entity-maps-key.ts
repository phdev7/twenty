import { type AllMetadataName } from 'diex-shared/metadata';

export type MetadataToFlatEntityMapsKey<T extends AllMetadataName> =
  T extends AllMetadataName ? `flat${Capitalize<T>}Maps` : never;
