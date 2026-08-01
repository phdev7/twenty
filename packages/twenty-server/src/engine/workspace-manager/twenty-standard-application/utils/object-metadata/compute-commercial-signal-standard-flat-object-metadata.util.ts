import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildDiexStandardObjectFlatMetadata } from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { CommercialSignalStandardObjectDefinition } from 'src/modules/commercial-intelligence/standard-objects/commercial-signal.standard-object-definition';

export const buildCommercialSignalStandardFlatObjectMetadata = (
  args: Omit<
    CreateStandardObjectArgs<'commercialSignal'>,
    'context' | 'objectName'
  >,
): FlatObjectMetadata =>
  buildDiexStandardObjectFlatMetadata({
    ...args,
    objectDefinition: CommercialSignalStandardObjectDefinition,
  });
