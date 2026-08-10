import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildDiexStandardObjectFlatMetadata } from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { SuccessPlanStandardObjectDefinition } from 'src/modules/customer-success/standard-objects/success-plan.standard-object-definition';

export const buildSuccessPlanStandardFlatObjectMetadata = (
  args: Omit<CreateStandardObjectArgs<'successPlan'>, 'context' | 'objectName'>,
): FlatObjectMetadata =>
  buildDiexStandardObjectFlatMetadata({
    ...args,
    objectDefinition: SuccessPlanStandardObjectDefinition,
  });
