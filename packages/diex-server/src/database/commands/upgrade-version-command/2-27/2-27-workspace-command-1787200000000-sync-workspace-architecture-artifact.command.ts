import { Command } from 'nest-commander';
import { isDefined } from 'diex-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatObjectPermission } from 'src/engine/metadata-modules/flat-object-permission/types/flat-object-permission.type';
import { type FlatSearchFieldMetadata } from 'src/engine/metadata-modules/flat-search-field-metadata/types/flat-search-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/diex-standard-application/constants/standard-role.constant';
import { computeDiexStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/diex-standard-application/utils/diex-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { WORKSPACE_ARCHITECTURE_ARTIFACT_UNIVERSAL_IDENTIFIER } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';

type ObjectOwnedFlatEntity = SyncableFlatEntity & {
  objectMetadataUniversalIdentifier: string | null;
};

const getObjectOwnedUniversalIdentifiers = <T extends ObjectOwnedFlatEntity>(
  flatEntityMaps: FlatEntityMaps<T>,
): string[] =>
  Object.values(flatEntityMaps.byUniversalIdentifier)
    .filter(isDefined)
    .filter(
      ({ objectMetadataUniversalIdentifier }) =>
        objectMetadataUniversalIdentifier ===
        WORKSPACE_ARCHITECTURE_ARTIFACT_UNIVERSAL_IDENTIFIER,
    )
    .map(({ universalIdentifier }) => universalIdentifier);

@RegisteredWorkspaceCommand('2.27.0', 1787200000000)
@Command({
  name: 'upgrade:2-27:sync-workspace-architecture-artifact',
  description:
    'Create the WorkspaceArchitectureArtifact standard metadata in existing workspaces',
})
export class SyncWorkspaceArchitectureArtifactCommand extends ProvisionedWorkspaceCommandRunner {
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
    const isDryRun = options.dryRun ?? false;
    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatIndexMaps,
      flatSearchFieldMetadataMaps,
      flatObjectPermissionMaps,
      flatRoleMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatIndexMaps',
      'flatSearchFieldMetadataMaps',
      'flatObjectPermissionMaps',
      'flatRoleMaps',
    ]);

    const { diexStandardFlatApplication } =
      await this.applicationService.findWorkspaceDiexStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeDiexStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        diexStandardApplicationId: diexStandardFlatApplication.id,
      });
    const defaultFunctionRole =
      flatRoleMaps.byUniversalIdentifier[
        STANDARD_ROLE.defaultFunction.universalIdentifier
      ];
    const canCreateDefaultFunctionObjectPermission =
      defaultFunctionRole?.applicationUniversalIdentifier ===
      diexStandardFlatApplication.universalIdentifier;

    if (!canCreateDefaultFunctionObjectPermission) {
      this.logger.warn(
        `Skipping WorkspaceArchitectureArtifact default-function permission for workspace ${workspaceId}: role belongs to another application`,
      );
    }

    const allFlatEntityOperationByMetadataName = {
      objectMetadata: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatObjectMetadata>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatObjectMetadataMaps,
            existingFlatEntityMaps: flatObjectMetadataMaps,
            universalIdentifiers: [
              WORKSPACE_ARCHITECTURE_ARTIFACT_UNIVERSAL_IDENTIFIER,
            ],
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      fieldMetadata: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatFieldMetadata>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatFieldMetadataMaps,
            existingFlatEntityMaps: flatFieldMetadataMaps,
            universalIdentifiers: getObjectOwnedUniversalIdentifiers(
              standardAllFlatEntityMaps.flatFieldMetadataMaps,
            ),
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      index: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatIndexMetadata>({
            standardFlatEntityMaps: standardAllFlatEntityMaps.flatIndexMaps,
            existingFlatEntityMaps: flatIndexMaps,
            universalIdentifiers: getObjectOwnedUniversalIdentifiers(
              standardAllFlatEntityMaps.flatIndexMaps,
            ),
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      searchFieldMetadata: {
        flatEntityToCreate:
          getStandardFlatEntitiesToCreateOrThrow<FlatSearchFieldMetadata>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatSearchFieldMetadataMaps,
            existingFlatEntityMaps: flatSearchFieldMetadataMaps,
            universalIdentifiers: getObjectOwnedUniversalIdentifiers(
              standardAllFlatEntityMaps.flatSearchFieldMetadataMaps,
            ),
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      objectPermission: {
        flatEntityToCreate: canCreateDefaultFunctionObjectPermission
          ? getStandardFlatEntitiesToCreateOrThrow<FlatObjectPermission>({
              standardFlatEntityMaps:
                standardAllFlatEntityMaps.flatObjectPermissionMaps,
              existingFlatEntityMaps: flatObjectPermissionMaps,
              universalIdentifiers: getObjectOwnedUniversalIdentifiers(
                standardAllFlatEntityMaps.flatObjectPermissionMaps,
              ),
            })
          : [],
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
    };
    const totalOperationCount = Object.values(
      allFlatEntityOperationByMetadataName,
    ).reduce(
      (total, { flatEntityToCreate }) => total + flatEntityToCreate.length,
      0,
    );

    if (totalOperationCount === 0) {
      this.logger.log(
        `WorkspaceArchitectureArtifact metadata already exists for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Creating ${totalOperationCount} WorkspaceArchitectureArtifact metadata item(s) for workspace ${workspaceId}`,
    );

    if (isDryRun) {
      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          applicationUniversalIdentifier:
            diexStandardFlatApplication.universalIdentifier,
          workspaceId,
          allFlatEntityOperationByMetadataName,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Failed to create WorkspaceArchitectureArtifact metadata for workspace ${workspaceId}: ${JSON.stringify(
          result,
          null,
          2,
        )}`,
      );
    }

    this.logger.log(
      `Created ${totalOperationCount} WorkspaceArchitectureArtifact metadata item(s) for workspace ${workspaceId}`,
    );
  }
}
