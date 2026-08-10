import { Command } from 'nest-commander';

import { DIEX_STANDARD_OBJECT_EXTENSION_FIELDS } from 'diex-shared/metadata';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeDiexStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/diex-standard-application/utils/diex-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const BADGE_FIELD_UNIVERSAL_IDENTIFIERS = [
  DIEX_STANDARD_OBJECT_EXTENSION_FIELDS.person.diexBadges.universalIdentifier,
  DIEX_STANDARD_OBJECT_EXTENSION_FIELDS.company.diexBadges.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.25.0', 1785200000000)
@Command({
  name: 'upgrade:2-25:sync-diex-badge-fields',
  description: 'Create the diexBadges field on person and company in existing workspaces',
})
export class SyncDiexBadgeFieldsCommand extends ProvisionedWorkspaceCommandRunner {
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
  }: RunOnWorkspaceArgs): Promise<void> {
    const { flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);

    const { diexStandardFlatApplication } =
      await this.applicationService.findWorkspaceDiexStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const now = new Date().toISOString();

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeDiexStandardApplicationAllFlatEntityMaps({
        now,
        workspaceId,
        diexStandardApplicationId: diexStandardFlatApplication.id,
      });

    // Only the badge fields missing from this workspace are created, so the
    // command is safe to re-run and leaves operator-edited options alone.
    const flatEntityToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatFieldMetadata>({
        standardFlatEntityMaps: standardAllFlatEntityMaps.flatFieldMetadataMaps,
        existingFlatEntityMaps: flatFieldMetadataMaps,
        universalIdentifiers: BADGE_FIELD_UNIVERSAL_IDENTIFIERS,
      });

    if (flatEntityToCreate.length === 0) {
      this.logger.log(
        `Badge fields already present for workspace ${workspaceId}`,
      );

      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          applicationUniversalIdentifier:
            diexStandardFlatApplication.universalIdentifier,
          workspaceId,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Failed to create diexBadges fields for workspace ${workspaceId}: ${JSON.stringify(
          result,
          null,
          2,
        )}`,
      );
    }

    this.logger.log(
      `Created ${flatEntityToCreate.length} badge field(s) for workspace ${workspaceId}`,
    );
  }
}
