import { type FieldMetadataType } from 'diex-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import {
  buildDiexStandardObjectFlatFieldMetadatas,
  buildDiexStandardSystemFlatFieldMetadatas,
} from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { CustomerRenewalStandardObjectDefinition } from 'src/modules/renewal/standard-objects/customer-renewal.standard-object-definition';

export const buildCustomerRenewalStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'customerRenewal', FieldMetadataType>,
    'context'
  >,
): Record<
  AllStandardObjectFieldName<'customerRenewal'>,
  FlatFieldMetadata
> => ({
  ...buildDiexStandardSystemFlatFieldMetadatas(args),
  ...buildDiexStandardObjectFlatFieldMetadatas({
    ...args,
    objectDefinition: CustomerRenewalStandardObjectDefinition,
  }),
});
