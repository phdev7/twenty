import { type FieldMetadataType } from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import {
  buildDiexStandardObjectFlatFieldMetadatas,
  buildDiexStandardSystemFlatFieldMetadatas,
} from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { DiexAccessRequestStandardObjectDefinition } from 'src/modules/access-request/standard-objects/diex-access-request.standard-object-definition';

export const buildDiexAccessRequestStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'diexAccessRequest', FieldMetadataType>,
    'context'
  >,
): Record<
  AllStandardObjectFieldName<'diexAccessRequest'>,
  FlatFieldMetadata
> => ({
  ...buildDiexStandardSystemFlatFieldMetadatas(args),
  ...buildDiexStandardObjectFlatFieldMetadatas({
    ...args,
    objectDefinition: DiexAccessRequestStandardObjectDefinition,
  }),
});
