import { InjectDataSource } from '@nestjs/typeorm';

import { Command, Option } from 'nest-commander';
import { DataSource } from 'typeorm';
import { DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { type ProvisionedWorkspaceCommandOptions } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';

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
    @InjectDataSource()
    private readonly dataSource: DataSource,
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
    const applicationRepository =
      this.dataSource.getRepository(ApplicationEntity);
    const objectMetadataRepository =
      this.dataSource.getRepository(ObjectMetadataEntity);
    const fieldMetadataRepository =
      this.dataSource.getRepository(FieldMetadataEntity);

    const application = await applicationRepository.findOne({
      where: {
        workspaceId,
        universalIdentifier: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
      },
    });

    if (!application) {
      this.logger.log(
        `No residual Diex application found on workspace ${workspaceId} (${index + 1}/${total})`,
      );

      return;
    }

    const [objects, fields] = await Promise.all([
      objectMetadataRepository.find({
        where: {
          workspaceId,
          applicationId: application.id,
        },
        select: ['id', 'universalIdentifier'],
      }),
      fieldMetadataRepository.find({
        where: {
          workspaceId,
          applicationId: application.id,
        },
        select: ['id', 'universalIdentifier'],
      }),
    ]);

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
      DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
      workspaceId,
    );

    this.logger.log(
      `Removed residual Diex application ${application.id} from workspace ${workspaceId}`,
    );
  }
}
