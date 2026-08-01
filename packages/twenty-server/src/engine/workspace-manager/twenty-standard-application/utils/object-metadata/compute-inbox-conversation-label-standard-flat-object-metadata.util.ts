import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildInboxStandardObjectFlatMetadata } from 'src/modules/inbox/standard-objects/build-inbox-standard-flat-metadata.util';
import { InboxConversationLabelStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-conversation-label.standard-object-definition';

export const buildInboxConversationLabelStandardFlatObjectMetadata = (
  args: Omit<
    CreateStandardObjectArgs<'inboxConversationLabel'>,
    'context' | 'objectName'
  >,
): FlatObjectMetadata =>
  buildInboxStandardObjectFlatMetadata({
    ...args,
    objectDefinition: InboxConversationLabelStandardObjectDefinition,
  });
