import { type FieldMetadataType } from 'diex-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import {
  buildDiexStandardObjectFlatFieldMetadatas,
  buildDiexStandardSystemFlatFieldMetadatas,
} from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { SuccessMilestoneStandardObjectDefinition } from 'src/modules/customer-success/standard-objects/success-milestone.standard-object-definition';

export const buildSuccessMilestoneStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'successMilestone', FieldMetadataType>,
    'context'
  >,
): Record<
  AllStandardObjectFieldName<'successMilestone'>,
  FlatFieldMetadata
> => ({
  ...buildDiexStandardSystemFlatFieldMetadatas(args),
  ...buildDiexStandardObjectFlatFieldMetadatas({
    ...args,
    objectDefinition: SuccessMilestoneStandardObjectDefinition,
  }),
});
