import { Command } from 'nest-commander';

import { FieldMetadataType } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type CreateFieldInput } from 'src/engine/metadata-modules/field-metadata/dtos/create-field.input';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import {
  AI_ACTION_ESTIMATED_COST_CREDITS_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_POLICY_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_RISK_LEVEL_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_RISK_LEVEL_OPTIONS,
  AI_ACTION_UNIVERSAL_IDENTIFIER,
  AI_ACTION_WRITE_SET_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';

const FIELD_DEFINITIONS = [
  {
    universalIdentifier: AI_ACTION_RISK_LEVEL_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'riskLevel',
    type: FieldMetadataType.SELECT,
    label: 'Risco da ação',
    description: '',
    icon: 'IconShieldCheck',
  },
  {
    universalIdentifier: AI_ACTION_WRITE_SET_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'writeSet',
    type: FieldMetadataType.RAW_JSON,
    label: 'Escopo de escrita',
    description: 'Registros e operações que a ação está autorizada a alterar.',
    icon: 'IconLockAccess',
  },
  {
    universalIdentifier: AI_ACTION_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'expiresAt',
    type: FieldMetadataType.DATE_TIME,
    label: 'Expira em',
    description: '',
    icon: 'IconClockCancel',
  },
  {
    universalIdentifier: AI_ACTION_POLICY_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'policyVersion',
    type: FieldMetadataType.TEXT,
    label: 'Versão da política',
    description: '',
    icon: 'IconVersions',
  },
  {
    universalIdentifier:
      AI_ACTION_ESTIMATED_COST_CREDITS_FIELD_UNIVERSAL_IDENTIFIER,
    name: 'estimatedCostCredits',
    type: FieldMetadataType.NUMBER,
    label: 'Custo estimado em créditos',
    description: '',
    icon: 'IconCoins',
  },
] as const;

@RegisteredWorkspaceCommand('2.26.0', 1786400000000)
@Command({
  name: 'upgrade:2-26:sync-diex-ai-action-policy',
  description:
    'Adds risk, scope, expiry and estimated cost fields to Diex AI actions.',
})
export class SyncDiexAiActionPolicyCommand extends ProvisionedWorkspaceCommandRunner {
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
      return;
    }

    const missingFields = FIELD_DEFINITIONS.filter(
      ({ universalIdentifier }) =>
        !flatFieldMetadataMaps.byUniversalIdentifier[universalIdentifier],
    );
    const riskField = flatFieldMetadataMaps.byUniversalIdentifier[
      AI_ACTION_RISK_LEVEL_FIELD_UNIVERSAL_IDENTIFIER
    ];
    const riskSelectField =
      riskField?.type === FieldMetadataType.SELECT
        ? (riskField as FlatFieldMetadata<FieldMetadataType.SELECT>)
        : null;
    const missingRiskOptions = AI_ACTION_RISK_LEVEL_OPTIONS.filter(
      ({ value }) => !riskSelectField?.options?.some((option) => option.value === value),
    );

    if (missingFields.length === 0 && missingRiskOptions.length === 0) {
      return;
    }
    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Syncing Diex AI action policy for workspace ${workspaceId}`,
      );

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
          ...(field.name === 'riskLevel'
            ? {
                options: AI_ACTION_RISK_LEVEL_OPTIONS,
                defaultValue: "'MEDIUM'",
              }
            : {}),
        }));

      await this.fieldMetadataService.createManyFields({
        createFieldInputs,
        workspaceId,
        ownerFlatApplication: diexStandardFlatApplication,
        isSystemBuild: true,
      });
    }

    if (riskSelectField && missingRiskOptions.length > 0) {
      const updatedRiskField: FlatFieldMetadata<FieldMetadataType.SELECT> = {
        ...riskSelectField,
        options: [
          ...(riskSelectField.options ?? []),
          ...missingRiskOptions.map((option, index) => ({
            ...option,
            position: riskSelectField.options?.length ?? index,
          })),
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
                flatEntityToUpdate: [updatedRiskField],
              },
            },
          },
        );

      if (result.status === 'fail') {
        throw new Error(
          `Failed to sync Diex AI action policy for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }
  }
}
