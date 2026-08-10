import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeDiexStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/diex-standard-application/utils/diex-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const BADGE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS = [
  '20202020-af02-4a02-8a02-ae0a1ea11af9', // allPeople.diexBadges
  '20202020-af02-4a02-8a02-ae0a1ea1221d', // personRecordPageFields.diexBadges
  '20202020-af01-4a01-8a01-c0aba11cf009', // allCompanies.diexBadges
  '20202020-af01-4a01-8a01-c0aba11c121b', // companyRecordPageFields.diexBadges
];

@RegisteredWorkspaceCommand('2.25.0', 1785400000000)
@Command({
  name: 'upgrade:2-25:sync-diex-badge-view-fields',
  description: 'Create the diexBadges view fields on person and company in existing workspaces',
})
export class SyncDiexBadgeViewFieldsCommand extends ProvisionedWorkspaceCommandRunner {
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
    const { flatViewFieldMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatViewFieldMaps',
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

    const flatEntityToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatViewField>({
        standardFlatEntityMaps: standardAllFlatEntityMaps.flatViewFieldMaps,
        existingFlatEntityMaps: flatViewFieldMaps,
        universalIdentifiers: BADGE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS,
      });

    if (flatEntityToCreate.length === 0) {
      this.logger.log(
        `Badge view fields already present for workspace ${workspaceId}`,
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
            viewField: {
              flatEntityToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Failed to create diexBadges view fields for workspace ${workspaceId}: ${JSON.stringify(
          result,
          null,
          2,
        )}`,
      );
    }

    this.logger.log(
      `Created ${flatEntityToCreate.length} badge view field(s) for workspace ${workspaceId}`,
    );
  }
}
