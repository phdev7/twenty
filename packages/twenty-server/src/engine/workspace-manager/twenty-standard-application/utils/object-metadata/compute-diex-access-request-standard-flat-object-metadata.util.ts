import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildDiexStandardObjectFlatMetadata } from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { DiexAccessRequestStandardObjectDefinition } from 'src/modules/access-request/standard-objects/diex-access-request.standard-object-definition';

export const buildDiexAccessRequestStandardFlatObjectMetadata = (
  args: Omit<
    CreateStandardObjectArgs<'diexAccessRequest'>,
    'context' | 'objectName'
  >,
): FlatObjectMetadata =>
  buildDiexStandardObjectFlatMetadata({
    ...args,
    objectDefinition: DiexAccessRequestStandardObjectDefinition,
  });
