import { type FieldMetadataType } from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import {
  buildDiexStandardObjectFlatFieldMetadatas,
  buildDiexStandardSystemFlatFieldMetadatas,
} from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { DiexWorkspaceContextStandardObjectDefinition } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.standard-object-definition';

export const buildDiexWorkspaceContextStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'diexWorkspaceContext', FieldMetadataType>,
    'context'
  >,
): Record<
  AllStandardObjectFieldName<'diexWorkspaceContext'>,
  FlatFieldMetadata
> => ({
  ...buildDiexStandardSystemFlatFieldMetadatas(args),
  ...buildDiexStandardObjectFlatFieldMetadatas({
    ...args,
    objectDefinition: DiexWorkspaceContextStandardObjectDefinition,
  }),
});
