import { type FieldMetadataType } from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import {
  buildInboxStandardObjectFlatFieldMetadatas,
  buildInboxStandardSystemFlatFieldMetadatas,
} from 'src/modules/inbox/standard-objects/build-inbox-standard-flat-metadata.util';
import { InboxSavedReplyStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-saved-reply.standard-object-definition';

export const buildInboxSavedReplyStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'inboxSavedReply', FieldMetadataType>,
    'context'
  >,
): Record<
  AllStandardObjectFieldName<'inboxSavedReply'>,
  FlatFieldMetadata
> => ({
  ...buildInboxStandardSystemFlatFieldMetadatas(args),
  ...buildInboxStandardObjectFlatFieldMetadatas({
    ...args,
    objectDefinition: InboxSavedReplyStandardObjectDefinition,
  }),
});
