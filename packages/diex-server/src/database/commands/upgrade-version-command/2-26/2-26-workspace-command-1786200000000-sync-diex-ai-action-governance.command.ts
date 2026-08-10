import { Command } from 'nest-commander';

import { FieldMetadataType } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type CreateFieldInput } from 'src/engine/metadata-modules/field-metadata/dtos/create-field.input';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import {
  AI_ACTION_ATTEMPT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_CONTEXT_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_EXECUTION_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  AiActionStatus,
} from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';

const FIELD_DEFINITIONS = [
  {
    universalIdentifier: AI_ACTION_CONTEXT_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'contextVersion',
    type: FieldMetadataType.TEXT,
    label: 'Versão do contexto da IA',
    description:
      'Identifica o manifesto operacional compilado usado para propor a ação.',
    icon: 'IconVersions',
  },
  {
    universalIdentifier:
      AI_ACTION_EXECUTION_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'executionStartedAt',
    type: FieldMetadataType.DATE_TIME,
    label: 'Execução iniciada em',
    description: '',
    icon: 'IconPlayerPlay',
  },
  {
    universalIdentifier: AI_ACTION_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'failureReason',
    type: FieldMetadataType.RICH_TEXT,
    label: 'Motivo da falha',
    description: '',
    icon: 'IconAlertTriangle',
  },
  {
    universalIdentifier: AI_ACTION_ATTEMPT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'attemptCount',
    type: FieldMetadataType.NUMBER,
    label: 'Tentativas de execução',
    description: '',
    icon: 'IconRepeat',
  },
] as const;

@RegisteredWorkspaceCommand('2.26.0', 1786200000000)
@Command({
  name: 'upgrade:2-26:sync-diex-ai-action-governance',
  description:
    'Adds AI action context and durable execution fields to existing Diex workspaces.',
})
export class SyncDiexAiActionGovernanceCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);
    const aiActionObject =
      flatObjectMetadataMaps.byUniversalIdentifier[AI_ACTION_UNIVERSAL_IDENTIFIER];

    if (!isDefined(aiActionObject)) {
      this.logger.log(
        `aiAction object not found for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    const missingFields = FIELD_DEFINITIONS.filter(
      ({ universalIdentifier }) =>
        !flatFieldMetadataMaps.byUniversalIdentifier[universalIdentifier],
    );

    const statusField = flatFieldMetadataMaps.byUniversalIdentifier[
      AI_ACTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER
    ];
    const statusSelectField =
      statusField?.type === FieldMetadataType.SELECT
        ? (statusField as FlatFieldMetadata<FieldMetadataType.SELECT>)
        : null;
    const hasExecutingOption = Boolean(
      statusSelectField?.options?.some(
        ({ value }) => value === AiActionStatus.EXECUTING,
      ),
    );

    if (missingFields.length === 0 && hasExecutingOption) {
      this.logger.log(
        `Diex AI action governance already synced for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Syncing Diex AI action governance for workspace ${workspaceId}`,
    );

    if (isDryRun) {
      return;
    }

    const { diexStandardFlatApplication } =
      await this.applicationService.findWorkspaceDiexStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    if (missingFields.length > 0) {
      const createFieldInputs: Omit<CreateFieldInput, 'workspaceId'>[] =
        missingFields.map((field) => ({
          objectMetadataId: aiActionObject.id,
          name: field.name,
          type: field.type,
          label: field.label,
          description: field.description,
          icon: field.icon,
          isNullable: true,
          isSystem: true,
          isActive: true,
          universalIdentifier: field.universalIdentifier,
        }));

      await this.fieldMetadataService.createManyFields({
        createFieldInputs,
        workspaceId,
        ownerFlatApplication: diexStandardFlatApplication,
        isSystemBuild: true,
      });
    }

    if (statusSelectField && !hasExecutingOption) {
      const updatedStatusField: FlatFieldMetadata<FieldMetadataType.SELECT> = {
        ...statusSelectField,
        options: [
          ...(statusSelectField.options ?? []),
          {
            id: 'd1e05120-0000-4000-8000-000000000007',
            value: AiActionStatus.EXECUTING,
            label: 'Em execução',
            position: statusSelectField.options?.length ?? 0,
            color: 'yellow' as const,
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
                flatEntityToUpdate: [updatedStatusField],
              },
            },
          },
        );

      if (result.status === 'fail') {
        throw new Error(
          `Failed to sync Diex AI action status for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    this.logger.log(
      `Synced Diex AI action governance for workspace ${workspaceId}`,
    );
  }
}
