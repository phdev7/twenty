import { Command, Option } from 'nest-commander';
import { LEGACY_METADATA_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { type ProvisionedWorkspaceCommandOptions } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type DiexResidualUninstallOptions = ProvisionedWorkspaceCommandOptions & {
  confirm?: boolean;
};

type DiexResidualUninstallArgs = Omit<RunOnWorkspaceArgs, 'options'> & {
  options: DiexResidualUninstallOptions;
};

/**
 * Removes only the residual Diex application row after the native migration.
 *
 * This command is intentionally manual and confirmation-gated. It refuses to
 * delete anything when a workspace still has object or field metadata owned by
 * the legacy application, because deleting the application would cascade
 * those metadata rows and their records. Ticket 04 must finish first.
 */
@Command({
  name: 'upgrade:diex:uninstall-residual',
  description:
    'Supervised removal of a residual Diex application registration after metadata reparenting',
})
export class UpgradeDiexUninstallResidualCommand extends ProvisionedWorkspaceCommandRunner<DiexResidualUninstallOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--confirm',
    description:
      'Confirm deletion after reviewing a dry run. Without this flag the command is read-only.',
    required: false,
  })
  parseConfirm(): boolean {
    return true;
  }

  override async run(
    passedParams: string[],
    options: DiexResidualUninstallOptions,
  ): Promise<void> {
    if (!options.dryRun && !options.confirm) {
      throw new Error(
        'Refusing residual Diex uninstall without --confirm; run with --dry-run first',
      );
    }

    await super.run(passedParams, options);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
    index,
    total,
  }: DiexResidualUninstallArgs): Promise<void> {
    const application = await this.applicationService.findByUniversalIdentifier(
      {
        workspaceId,
        universalIdentifier: LEGACY_METADATA_APPLICATION_UNIVERSAL_IDENTIFIER,
      },
    );

    if (!application) {
      this.logger.log(
        `No residual Diex application found on workspace ${workspaceId} (${index + 1}/${total})`,
      );

      return;
    }

    const { objects, fields } =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const objectMetadataRepository =
            await this.globalWorkspaceOrmManager.getRepository<ObjectMetadataEntity>(
              workspaceId,
              ObjectMetadataEntity,
            );
          const fieldMetadataRepository =
            await this.globalWorkspaceOrmManager.getRepository<FieldMetadataEntity>(
              workspaceId,
              FieldMetadataEntity,
            );

          return {
            objects: await objectMetadataRepository.find({
              where: { applicationId: application.id },
              select: ['id', 'universalIdentifier'],
            }),
            fields: await fieldMetadataRepository.find({
              where: { applicationId: application.id },
              select: ['id', 'universalIdentifier'],
            }),
          };
        },
        buildSystemAuthContext(workspaceId),
      );

    if (objects.length > 0 || fields.length > 0) {
      throw new Error(
        `Refusing residual Diex uninstall on workspace ${workspaceId}: ` +
          `${objects.length} object(s) and ${fields.length} field(s) still reference application ${application.id}. ` +
          'Run the supervised metadata reparent command first.',
      );
    }

    this.logger.log(
      `${options.dryRun ? '[DRY RUN] ' : ''}Diex preflight passed on workspace ${workspaceId} (${index + 1}/${total})`,
    );

    if (options.dryRun) {
      return;
    }

    await this.applicationService.delete(
      LEGACY_METADATA_APPLICATION_UNIVERSAL_IDENTIFIER,
      workspaceId,
    );

    this.logger.log(
      `Removed residual Diex application ${application.id} from workspace ${workspaceId}`,
    );
  }
}
