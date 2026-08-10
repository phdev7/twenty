import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildDiexStandardObjectFlatMetadata } from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { AiActionStandardObjectDefinition } from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';

export const buildAiActionStandardFlatObjectMetadata = (
  args: Omit<CreateStandardObjectArgs<'aiAction'>, 'context' | 'objectName'>,
): FlatObjectMetadata =>
  buildDiexStandardObjectFlatMetadata({
    ...args,
    objectDefinition: AiActionStandardObjectDefinition,
  });
