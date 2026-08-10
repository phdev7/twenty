import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildInboxStandardObjectFlatMetadata } from 'src/modules/inbox/standard-objects/build-inbox-standard-flat-metadata.util';
import { InboxMentionStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-mention.standard-object-definition';

export const buildInboxMentionStandardFlatObjectMetadata = (
  args: Omit<
    CreateStandardObjectArgs<'inboxMention'>,
    'context' | 'objectName'
  >,
): FlatObjectMetadata =>
  buildInboxStandardObjectFlatMetadata({
    ...args,
    objectDefinition: InboxMentionStandardObjectDefinition,
  });
