import { Command } from 'nest-commander';

import { FieldMetadataType } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import {
  WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS,
  WORKSPACE_ARCHITECTURE_ARTIFACT_UNIVERSAL_IDENTIFIER,
  WorkspaceArchitectureArtifactType,
} from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';

const IMPORT_BATCH_OPTION = {
  id: 'd1e18110-0000-4000-8000-000000000011',
  value: WorkspaceArchitectureArtifactType.IMPORT_BATCH,
  label: 'IMPORT BATCH',
  position: 10,
  color: 'turquoise' as const,
};

@RegisteredWorkspaceCommand('2.26.0', 1786800000000)
@Command({
  name: 'upgrade:2-26:sync-diex-import-batch',
  description:
    'Adds the staged Diex import batch artifact type to existing workspaces.',
})
export class SyncDiexImportBatchCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);
    const artifactObject =
      flatObjectMetadataMaps.byUniversalIdentifier[
        WORKSPACE_ARCHITECTURE_ARTIFACT_UNIVERSAL_IDENTIFIER
      ];
    const artifactTypeField =
      flatFieldMetadataMaps.byUniversalIdentifier[
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.artifactType
      ];

    if (!isDefined(artifactObject) || !isDefined(artifactTypeField)) {
      this.logger.log(
        `workspaceArchitectureArtifact metadata not found for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (artifactTypeField.type !== FieldMetadataType.SELECT) {
      throw new Error(
        `workspaceArchitectureArtifact.artifactType is not a select field in workspace ${workspaceId}.`,
      );
    }

    const selectField = artifactTypeField as FlatFieldMetadata<FieldMetadataType.SELECT>;

    if (
      selectField.options?.some(
        ({ value }) => value === IMPORT_BATCH_OPTION.value,
      )
    ) {
      return;
    }

    if (options.dryRun ?? false) {
      this.logger.log(
        `[DRY RUN] Adding import batch artifact type to workspace ${workspaceId}`,
      );

      return;
    }

    const { diexStandardFlatApplication } =
      await this.applicationService.findWorkspaceDiexStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const updatedField: FlatFieldMetadata<FieldMetadataType.SELECT> = {
      ...selectField,
      options: [
        ...(selectField.options ?? []),
        {
          ...IMPORT_BATCH_OPTION,
          position: selectField.options?.length ?? IMPORT_BATCH_OPTION.position,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          applicationUniversalIdentifier:
            diexStandardFlatApplication.universalIdentifier,
          workspaceId,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: [],
              flatEntityToDelete: [],
              flatEntityToUpdate: [updatedField],
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Failed to sync Diex import batch for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }
  }
}
