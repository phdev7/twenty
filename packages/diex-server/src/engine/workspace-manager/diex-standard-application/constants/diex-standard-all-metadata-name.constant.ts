import { type AllMetadataName } from 'diex-shared/metadata';

export const DIEX_STANDARD_ALL_METADATA_NAME = [
  'index',
  'searchFieldMetadata',
  'objectMetadata',
  'fieldMetadata',
  'viewField',
  'viewFieldGroup',
  'viewFilter',
  'viewGroup',
  'view',
  'navigationMenuItem',
  'permissionFlag',
  'role',
  'rolePermissionFlag',
  'objectPermission',
  'agent',
  'skill',
  'pageLayout',
  'pageLayoutTab',
  'pageLayoutWidget',
  'commandMenuItem',
] as const satisfies AllMetadataName[];
