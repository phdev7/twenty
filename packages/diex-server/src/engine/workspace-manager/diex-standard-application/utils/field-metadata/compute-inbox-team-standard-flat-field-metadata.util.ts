import { type FieldMetadataType } from 'diex-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import {
  buildInboxStandardObjectFlatFieldMetadatas,
  buildInboxStandardSystemFlatFieldMetadatas,
} from 'src/modules/inbox/standard-objects/build-inbox-standard-flat-metadata.util';
import { InboxTeamStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-team.standard-object-definition';

export const buildInboxTeamStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'inboxTeam', FieldMetadataType>,
    'context'
  >,
): Record<AllStandardObjectFieldName<'inboxTeam'>, FlatFieldMetadata> => ({
  ...buildInboxStandardSystemFlatFieldMetadatas(args),
  ...buildInboxStandardObjectFlatFieldMetadatas({
    ...args,
    objectDefinition: InboxTeamStandardObjectDefinition,
  }),
});
