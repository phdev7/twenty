import { type FieldMetadataType } from 'diex-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import {
  buildInboxStandardObjectFlatFieldMetadatas,
  buildInboxStandardSystemFlatFieldMetadatas,
} from 'src/modules/inbox/standard-objects/build-inbox-standard-flat-metadata.util';
import { InboxAutomationStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-automation.standard-object-definition';

export const buildInboxAutomationStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'inboxAutomation', FieldMetadataType>,
    'context'
  >,
): Record<
  AllStandardObjectFieldName<'inboxAutomation'>,
  FlatFieldMetadata
> => ({
  ...buildInboxStandardSystemFlatFieldMetadatas(args),
  ...buildInboxStandardObjectFlatFieldMetadatas({
    ...args,
    objectDefinition: InboxAutomationStandardObjectDefinition,
  }),
});
