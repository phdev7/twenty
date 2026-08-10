import { type STANDARD_OBJECTS } from 'diex-shared/metadata';

import { type AllStandardObjectName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-name.type';

export type AllStandardObjectFieldName<T extends AllStandardObjectName> =
  keyof (typeof STANDARD_OBJECTS)[T]['fields'];
