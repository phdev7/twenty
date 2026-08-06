import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildDiexStandardObjectFlatMetadata } from 'src/modules/diex/standard-objects/build-diex-standard-flat-metadata.util';
import { WorkspaceArchitectureArtifactStandardObjectDefinition } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';

export const buildWorkspaceArchitectureArtifactStandardFlatObjectMetadata = (
  args: Omit<
    CreateStandardObjectArgs<'workspaceArchitectureArtifact'>,
    'context' | 'objectName'
  >,
): FlatObjectMetadata =>
  buildDiexStandardObjectFlatMetadata({
    ...args,
    objectDefinition: WorkspaceArchitectureArtifactStandardObjectDefinition,
  });
