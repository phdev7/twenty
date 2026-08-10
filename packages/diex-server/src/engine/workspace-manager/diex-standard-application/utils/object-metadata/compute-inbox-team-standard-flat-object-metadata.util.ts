import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildInboxStandardObjectFlatMetadata } from 'src/modules/inbox/standard-objects/build-inbox-standard-flat-metadata.util';
import { InboxTeamStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-team.standard-object-definition';

export const buildInboxTeamStandardFlatObjectMetadata = (
  args: Omit<CreateStandardObjectArgs<'inboxTeam'>, 'context' | 'objectName'>,
): FlatObjectMetadata =>
  buildInboxStandardObjectFlatMetadata({
    ...args,
    objectDefinition: InboxTeamStandardObjectDefinition,
  });
