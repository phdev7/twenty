import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatCommandMenuItem } from 'src/engine/metadata-modules/flat-command-menu-item/types/flat-command-menu-item.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_COMMAND_MENU_ITEMS } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-command-menu-item.constant';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const WHATSAPP_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIERS = [
  STANDARD_COMMAND_MENU_ITEMS.openWhatsappConversationForPerson
    .universalIdentifier,
];

@RegisteredWorkspaceCommand('2.25.0', 1785300000000)
@Command({
  name: 'upgrade:2-25:add-whatsapp-command-menu-item',
  description:
    'Add the person WhatsApp command menu item to existing workspaces',
})
export class AddWhatsappCommandMenuItemCommand extends ProvisionedWorkspaceCommandRunner {
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

    const { flatCommandMenuItemMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatCommandMenuItemMaps',
      ]);

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    // Only what is missing is created, so the command stays safe to re-run and
    // does not overwrite an item an operator has already renamed or unpinned.
    const flatEntityToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatCommandMenuItem>({
        standardFlatEntityMaps:
          standardAllFlatEntityMaps.flatCommandMenuItemMaps,
        existingFlatEntityMaps: flatCommandMenuItemMaps,
        universalIdentifiers: WHATSAPP_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIERS,
      });

    if (flatEntityToCreate.length === 0) {
      this.logger.log(
        `WhatsApp command menu item already present for workspace ${workspaceId}`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would create the WhatsApp command menu item for workspace ${workspaceId}`,
      );

      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          workspaceId,
          allFlatEntityOperationByMetadataName: {
            commandMenuItem: {
              flatEntityToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Failed to create the WhatsApp command menu item for workspace ${workspaceId}: ${JSON.stringify(
          result,
          null,
          2,
        )}`,
      );
    }

    this.logger.log(
      `Created the WhatsApp command menu item for workspace ${workspaceId}`,
    );
  }
}
