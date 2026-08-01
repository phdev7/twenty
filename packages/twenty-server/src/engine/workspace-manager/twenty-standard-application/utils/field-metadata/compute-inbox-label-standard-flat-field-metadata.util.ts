import { type FieldMetadataType } from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import {
  buildInboxStandardObjectFlatFieldMetadatas,
  buildInboxStandardSystemFlatFieldMetadatas,
} from 'src/modules/inbox/standard-objects/build-inbox-standard-flat-metadata.util';
import { InboxLabelStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-label.standard-object-definition';

export const buildInboxLabelStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'inboxLabel', FieldMetadataType>,
    'context'
  >,
): Record<AllStandardObjectFieldName<'inboxLabel'>, FlatFieldMetadata> => ({
  ...buildInboxStandardSystemFlatFieldMetadatas(args),
  ...buildInboxStandardObjectFlatFieldMetadatas({
    ...args,
    objectDefinition: InboxLabelStandardObjectDefinition,
  }),
});
