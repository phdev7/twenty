import { Command, Option } from 'nest-commander';
import {
  LEGACY_METADATA_APPLICATION_UNIVERSAL_IDENTIFIER,
  DIEX_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
} from 'diex-shared/application';
import {
  DIEX_STANDARD_OBJECT_EXTENSION_FIELDS,
  DIEX_STANDARD_OBJECTS,
  INBOX_STANDARD_OBJECTS,
  type AllMetadataName,
} from 'diex-shared/metadata';
import { isDefined } from 'diex-shared/utils';
import { type QueryRunner } from 'typeorm';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import {
  type RunOnWorkspaceArgs,
  type WorkspaceCommandOptions,
} from 'src/database/commands/command-runners/workspace.command-runner';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import { getMetadataRelatedMetadataNames } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-related-metadata-names.util';
import { getMetadataSerializedRelationNames } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-serialized-relation-names.util';
import { computeFlatIndexNameOrThrow } from 'src/engine/metadata-modules/index-metadata/utils/compute-flat-index-name.util';
import { WorkspaceMetadataVersionService } from 'src/engine/metadata-modules/workspace-metadata-version/services/workspace-metadata-version.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { type WorkspaceCacheKeyName } from 'src/engine/workspace-cache/types/workspace-cache-key.type';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// This command is intentionally not decorated with @RegisteredWorkspaceCommand.
// Re-parenting production data is a supervised, manual operation. Registering it
// in the automatic upgrade sequence would make a deploy execute the rename.
const DIEX_OBJECT_NAMES = [
  'successPlan',
  'successMilestone',
  'customerRenewal',
  'customerRenewalEvent',
  'commercialSignal',
  'offer',
  'aiAction',
  'diexWorkspaceContext',
  'diexAccessRequest',
  'inboxConversation',
  'inboxMessage',
  'inboxConversationEvent',
  'inboxLabel',
  'inboxConversationLabel',
  'inboxTeam',
  'inboxTeamMember',
  'inboxMacro',
  'inboxSavedReply',
  'inboxMention',
  'inboxAutomation',
] as const;

const DIEX_OBJECT_UNIVERSAL_IDENTIFIERS = [
  ...Object.values(DIEX_STANDARD_OBJECTS),
  ...Object.values(INBOX_STANDARD_OBJECTS),
].map(({ universalIdentifier }) => universalIdentifier);

const DIEX_OBJECT_NAME_BY_UNIVERSAL_IDENTIFIER = new Map<string, string>(
  [
    ...Object.entries(DIEX_STANDARD_OBJECTS),
    ...Object.entries(INBOX_STANDARD_OBJECTS),
  ].map(([name, { universalIdentifier }]) => [universalIdentifier, name]),
);

const DIEX_EXTENSION_FIELD_UNIVERSAL_IDENTIFIERS = Object.values(
  DIEX_STANDARD_OBJECT_EXTENSION_FIELDS,
).flatMap((fields) =>
  Object.values(fields).map(({ universalIdentifier }) => universalIdentifier),
);

const DIEX_EXTENSION_FIELD_OBJECT_NAME_BY_UNIVERSAL_IDENTIFIER = new Map<
  string,
  string
>(
  Object.entries(DIEX_STANDARD_OBJECT_EXTENSION_FIELDS).flatMap(
    ([objectName, fields]) =>
      Object.values(fields).map(({ universalIdentifier }) => [
        universalIdentifier,
        objectName,
      ]),
  ),
);

// The 29 entries are an audit list as well as the only possible column rename
// inputs. Under the current engine these columns are normally already unprefixed;
// the runtime preflight handles older workspaces without guessing.
const DIEX_STANDARD_EXTENSION_COLUMN_RENAMES = [
  { tableName: 'company', columnName: 'diexAnnualRevenueRange' },
  { tableName: 'company', columnName: 'diexEmployeeRange' },
  { tableName: 'company', columnName: 'diexLifecycle' },
  { tableName: 'company', columnName: 'diexNiche' },
  { tableName: 'company', columnName: 'diexSegment' },
  { tableName: 'company', columnName: 'icpFit' },
  { tableName: 'company', columnName: 'legacyDiexId' },
  { tableName: 'note', columnName: 'legacyDiexId' },
  { tableName: 'opportunity', columnName: 'budgetConfirmed' },
  { tableName: 'opportunity', columnName: 'commercialScore' },
  { tableName: 'opportunity', columnName: 'dealRisk' },
  { tableName: 'opportunity', columnName: 'decisionAccessConfirmed' },
  { tableName: 'opportunity', columnName: 'diexOfferId' },
  { tableName: 'opportunity', columnName: 'legacyDiexId' },
  { tableName: 'opportunity', columnName: 'needConfirmed' },
  { tableName: 'opportunity', columnName: 'nextCommercialAction' },
  { tableName: 'opportunity', columnName: 'nextCommercialActionAt' },
  { tableName: 'opportunity', columnName: 'timingConfirmed' },
  { tableName: 'person', columnName: 'buyingIntent' },
  { tableName: 'person', columnName: 'buyingRole' },
  { tableName: 'person', columnName: 'doNotContact' },
  { tableName: 'person', columnName: 'legacyDiexId' },
  { tableName: 'person', columnName: 'whatsappConsentAt' },
  { tableName: 'person', columnName: 'whatsappConsentStatus' },
  { tableName: 'person', columnName: 'whatsappNormalizedPhone' },
  { tableName: 'task', columnName: 'diexInboxConversationId' },
  { tableName: 'task', columnName: 'diexSuccessPlanId' },
  { tableName: 'task', columnName: 'legacyDiexId' },
  { tableName: 'task', columnName: 'taskCategory' },
] as const;

const CORE_METADATA_TABLES = [
  'objectMetadata',
  'fieldMetadata',
  'indexMetadata',
] as const;

type Direction = 'up' | 'down';

type ReparentCommandOptions = WorkspaceCommandOptions & {
  direction?: Direction;
};

type ApplicationRow = {
  id: string;
  universalIdentifier: string;
};

type ObjectMetadataRow = {
  id: string;
  universalIdentifier: string;
  nameSingular: string;
  applicationId: string;
};

type FieldMetadataRow = {
  id: string;
  universalIdentifier: string;
  objectMetadataId: string;
  objectNameSingular: string;
  applicationId: string;
};

type IndexMetadataRow = {
  id: string;
  name: string;
  objectMetadataId: string;
  applicationId: string;
};

type PhysicalRename = {
  sourceName: string;
  targetName: string;
  kind: 'table' | 'column' | 'index';
  tableName?: string;
};

type IndexRename = PhysicalRename & {
  indexMetadataId: string;
};

type MetadataPlan = {
  direction: Direction;
  sourceApplicationId: string;
  targetApplicationId: string;
  objectMetadataRows: ObjectMetadataRow[];
  fieldMetadataRows: FieldMetadataRow[];
  indexMetadataRows: IndexMetadataRow[];
  tableRenames: PhysicalRename[];
  columnRenames: PhysicalRename[];
  indexRenames: IndexRename[];
  isCustomTables: Set<string>;
};

const quoteIdentifier = (identifier: string): string =>
  `"${identifier.replace(/"/g, '""')}"`;

const getDirectionApplicationUniversalIdentifiers = (
  direction: Direction,
): { source: string; target: string } =>
  direction === 'up'
    ? {
        source: LEGACY_METADATA_APPLICATION_UNIVERSAL_IDENTIFIER,
        target: DIEX_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
      }
    : {
        source: DIEX_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        target: LEGACY_METADATA_APPLICATION_UNIVERSAL_IDENTIFIER,
      };

const getExpectedRenameState = ({
  sourceExists,
  targetExists,
  sourceName,
  targetName,
  kind,
}: {
  sourceExists: boolean;
  targetExists: boolean;
  sourceName: string;
  targetName: string;
  kind: PhysicalRename['kind'];
}): 'rename' | 'already' => {
  if (sourceExists && targetExists) {
    throw new Error(
      `Diex re-parentagem inconsistente: ${kind} "${sourceName}" e "${targetName}" existem simultaneamente`,
    );
  }

  if (!sourceExists && !targetExists) {
    throw new Error(
      `Diex re-parentagem inconsistente: ${kind} "${sourceName}" e "${targetName}" não existem`,
    );
  }

  return sourceExists ? 'rename' : 'already';
};

@Command({
  name: 'upgrade:diex:reparent-metadata',
  description:
    'Supervised Diex metadata re-parenting with adaptive table, column, and deterministic index renames',
})
export class ReparentDiexMetadataCommand extends ProvisionedWorkspaceCommandRunner<ReparentCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMetadataVersionService: WorkspaceMetadataVersionService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--direction [direction]',
    description: 'Migration direction (up or down). Defaults to up.',
    required: false,
  })
  parseDirection(value?: string): Direction {
    if (value === undefined) {
      return 'up';
    }

    if (value !== 'up' && value !== 'down') {
      throw new Error('Direction must be either "up" or "down"');
    }

    return value;
  }

  override async runOnWorkspace({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      this.logger.log(`No data source for workspace ${workspaceId}, skipping`);

      return;
    }

    const direction =
      (options as ReparentCommandOptions).direction ?? ('up' as const);
    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatIndexMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatIndexMaps',
    ]);

    const queryRunner = dataSource.coreDataSource.createQueryRunner();
    let transactionStarted = false;

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      transactionStarted = true;

      const plan = await this.buildPlan({
        queryRunner,
        workspaceId,
        direction,
        flatObjectMetadatas: Object.values(
          flatObjectMetadataMaps.byUniversalIdentifier,
        ).filter(isDefined),
        flatFieldMetadatas: Object.values(
          flatFieldMetadataMaps.byUniversalIdentifier,
        ).filter(isDefined),
        flatIndexMetadatas: Object.values(
          flatIndexMaps.byUniversalIdentifier,
        ).filter(isDefined),
      });

      this.logPlan({
        workspaceId,
        direction,
        plan,
        dryRun: options.dryRun ?? false,
      });

      if (options.dryRun) {
        await queryRunner.rollbackTransaction();
        transactionStarted = false;

        return;
      }

      await this.applyPlan({ queryRunner, workspaceId, plan });
      await queryRunner.commitTransaction();
      transactionStarted = false;
    } catch (error) {
      if (transactionStarted) {
        await queryRunner.rollbackTransaction();
      }

      throw error;
    } finally {
      await queryRunner.release();
    }

    await this.invalidateMetadataCaches(workspaceId);
    await this.workspaceMetadataVersionService.incrementMetadataVersion(
      workspaceId,
    );

    this.logger.log(
      `Diex re-parentagem ${direction} concluída para o workspace ${workspaceId}`,
    );
  }

  private async buildPlan({
    queryRunner,
    workspaceId,
    direction,
    flatObjectMetadatas,
    flatFieldMetadatas,
    flatIndexMetadatas,
  }: {
    queryRunner: QueryRunner;
    workspaceId: string;
    direction: Direction;
    flatObjectMetadatas: FlatObjectMetadata[];
    flatFieldMetadatas: FlatFieldMetadata[];
    flatIndexMetadatas: FlatIndexMetadata[];
  }): Promise<MetadataPlan> {
    const applicationUniversalIdentifiers =
      getDirectionApplicationUniversalIdentifiers(direction);
    const applications = await this.loadApplications({
      queryRunner,
      workspaceId,
      universalIdentifiers: [
        applicationUniversalIdentifiers.source,
        applicationUniversalIdentifiers.target,
      ],
    });
    const sourceApplicationId = this.getApplicationIdOrThrow(
      applications,
      applicationUniversalIdentifiers.source,
      workspaceId,
    );
    const targetApplicationId = this.getApplicationIdOrThrow(
      applications,
      applicationUniversalIdentifiers.target,
      workspaceId,
    );

    const objectMetadataRows = await this.loadObjectMetadataRows({
      queryRunner,
      workspaceId,
    });
    this.assertApplicationState({
      rows: objectMetadataRows,
      sourceApplicationId,
      targetApplicationId,
      label: 'objetos',
    });

    if (objectMetadataRows.length !== DIEX_OBJECT_NAMES.length) {
      throw new Error(
        `Diex re-parentagem esperava ${DIEX_OBJECT_NAMES.length} objetos e encontrou ${objectMetadataRows.length} no workspace ${workspaceId}`,
      );
    }
    this.assertExpectedObjectNames({ objectMetadataRows, workspaceId });

    const objectMetadataIds = objectMetadataRows.map(({ id }) => id);
    const fieldMetadataRows = await this.loadFieldMetadataRows({
      queryRunner,
      workspaceId,
      objectMetadataIds,
    });
    this.assertApplicationState({
      rows: fieldMetadataRows,
      sourceApplicationId,
      targetApplicationId,
      label: 'campos',
    });
    this.assertExpectedFieldCoverage({
      fieldMetadataRows,
      objectMetadataIds,
      workspaceId,
    });
    this.assertExpectedFieldOwnership({ fieldMetadataRows, workspaceId });

    const indexMetadataRows = await this.loadIndexMetadataRows({
      queryRunner,
      workspaceId,
      objectMetadataIds,
    });
    this.assertApplicationState({
      rows: indexMetadataRows,
      sourceApplicationId,
      targetApplicationId,
      label: 'índices',
    });

    const schemaName = getWorkspaceSchemaName(workspaceId);
    const tableRenames = await this.planTableRenames({
      queryRunner,
      schemaName,
      direction,
    });
    const columnRenames = await this.planColumnRenames({
      queryRunner,
      schemaName,
      direction,
    });
    const indexRenames = await this.planIndexRenames({
      queryRunner,
      schemaName,
      direction,
      flatObjectMetadatas,
      flatFieldMetadatas,
      flatIndexMetadatas,
      objectMetadataIds: new Set(objectMetadataIds),
    });
    const isCustomTables = await this.loadIsCustomColumns({ queryRunner });

    return {
      direction,
      sourceApplicationId,
      targetApplicationId,
      objectMetadataRows,
      fieldMetadataRows,
      indexMetadataRows,
      tableRenames,
      columnRenames,
      indexRenames,
      isCustomTables,
    };
  }

  private async applyPlan({
    queryRunner,
    workspaceId,
    plan,
  }: {
    queryRunner: QueryRunner;
    workspaceId: string;
    plan: MetadataPlan;
  }): Promise<void> {
    const schemaName = getWorkspaceSchemaName(workspaceId);

    for (const rename of plan.tableRenames) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(rename.sourceName)} RENAME TO ${quoteIdentifier(rename.targetName)}`,
      );
    }

    for (const rename of plan.indexRenames) {
      if (rename.sourceName === rename.targetName) {
        continue;
      }

      await queryRunner.query(
        `ALTER INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(rename.sourceName)} RENAME TO ${quoteIdentifier(rename.targetName)}`,
      );
    }

    for (const rename of plan.columnRenames) {
      if (!isDefined(rename.tableName)) {
        throw new Error(
          `Diex re-parentagem não encontrou a tabela da coluna ${rename.sourceName}`,
        );
      }

      await queryRunner.query(
        `ALTER TABLE IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(rename.tableName)} RENAME COLUMN ${quoteIdentifier(rename.sourceName)} TO ${quoteIdentifier(rename.targetName)}`,
      );
    }

    await this.reparentMetadata({
      queryRunner,
      workspaceId,
      plan,
    });
  }

  private async reparentMetadata({
    queryRunner,
    workspaceId,
    plan,
  }: {
    queryRunner: QueryRunner;
    workspaceId: string;
    plan: MetadataPlan;
  }): Promise<void> {
    const objectMetadataIds = plan.objectMetadataRows.map(({ id }) => id);
    const fieldMetadataIds = plan.fieldMetadataRows.map(({ id }) => id);
    const indexMetadataIds = plan.indexMetadataRows.map(({ id }) => id);
    const isCustom = plan.direction === 'down';

    await this.updateMetadataApplicationId({
      queryRunner,
      tableName: 'objectMetadata',
      workspaceId,
      metadataIds: objectMetadataIds,
      targetApplicationId: plan.targetApplicationId,
      sourceApplicationId: plan.sourceApplicationId,
      isCustom: plan.isCustomTables.has('objectMetadata')
        ? isCustom
        : undefined,
    });
    await this.updateMetadataApplicationId({
      queryRunner,
      tableName: 'fieldMetadata',
      workspaceId,
      metadataIds: fieldMetadataIds,
      targetApplicationId: plan.targetApplicationId,
      sourceApplicationId: plan.sourceApplicationId,
      isCustom: plan.isCustomTables.has('fieldMetadata')
        ? isCustom
        : undefined,
    });
    await this.updateMetadataApplicationId({
      queryRunner,
      tableName: 'indexMetadata',
      workspaceId,
      metadataIds: indexMetadataIds,
      targetApplicationId: plan.targetApplicationId,
      sourceApplicationId: plan.sourceApplicationId,
      isCustom: plan.isCustomTables.has('indexMetadata')
        ? isCustom
        : undefined,
    });

    for (const rename of plan.indexRenames) {
      await queryRunner.query(
        `UPDATE "core"."indexMetadata"
            SET "name" = $1
          WHERE "id" = $2
            AND "workspaceId" = $3`,
        [rename.targetName, rename.indexMetadataId, workspaceId],
      );
    }
  }

  private async updateMetadataApplicationId({
    queryRunner,
    tableName,
    workspaceId,
    metadataIds,
    targetApplicationId,
    sourceApplicationId,
    isCustom,
  }: {
    queryRunner: QueryRunner;
    tableName: (typeof CORE_METADATA_TABLES)[number];
    workspaceId: string;
    metadataIds: string[];
    targetApplicationId: string;
    sourceApplicationId: string;
    isCustom: boolean | undefined;
  }): Promise<void> {
    if (metadataIds.length === 0) {
      return;
    }

    const isCustomUpdate =
      isCustom === undefined ? '' : ', "isCustom" = $5';

    await queryRunner.query(
      `UPDATE "core".${quoteIdentifier(tableName)}
          SET "applicationId" = $1${isCustomUpdate}
        WHERE "workspaceId" = $2
          AND "id" = ANY($3::uuid[])
          AND "applicationId" = ANY($4::uuid[])`,
      isCustom === undefined
        ? [
            targetApplicationId,
            workspaceId,
            metadataIds,
            [sourceApplicationId, targetApplicationId],
          ]
        : [
            targetApplicationId,
            workspaceId,
            metadataIds,
            [sourceApplicationId, targetApplicationId],
            isCustom,
          ],
    );
  }

  private async planTableRenames({
    queryRunner,
    schemaName,
    direction,
  }: {
    queryRunner: QueryRunner;
    schemaName: string;
    direction: Direction;
  }): Promise<PhysicalRename[]> {
    const tableNames = DIEX_OBJECT_NAMES.flatMap((name) => [
      `_${name}`,
      name,
    ]);
    const rows: { table_name: string }[] = await queryRunner.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = $1
          AND table_name = ANY($2::text[])`,
      [schemaName, tableNames],
    );
    const existingTableNames = new Set(rows.map(({ table_name }) => table_name));

    return DIEX_OBJECT_NAMES.flatMap((name) => {
      const [sourceName, targetName] =
        direction === 'up' ? [`_${name}`, name] : [name, `_${name}`];
      const state = getExpectedRenameState({
        sourceExists: existingTableNames.has(sourceName),
        targetExists: existingTableNames.has(targetName),
        sourceName,
        targetName,
        kind: 'table',
      });

      return state === 'rename'
        ? [{ sourceName, targetName, kind: 'table' as const }]
        : [];
    });
  }

  private async planColumnRenames({
    queryRunner,
    schemaName,
    direction,
  }: {
    queryRunner: QueryRunner;
    schemaName: string;
    direction: Direction;
  }): Promise<PhysicalRename[]> {
    const tableNames = [
      ...new Set(
        DIEX_STANDARD_EXTENSION_COLUMN_RENAMES.map(({ tableName }) => tableName),
      ),
    ];
    const columnNames = DIEX_STANDARD_EXTENSION_COLUMN_RENAMES.flatMap(
      ({ columnName }) => [columnName, `_${columnName}`],
    );
    const rows: { table_name: string; column_name: string }[] =
      await queryRunner.query(
        `SELECT table_name, column_name
           FROM information_schema.columns
          WHERE table_schema = $1
            AND table_name = ANY($2::text[])
            AND column_name = ANY($3::text[])`,
        [schemaName, tableNames, columnNames],
      );
    const existingColumns = new Set(
      rows.map(({ table_name, column_name }) => `${table_name}.${column_name}`),
    );

    return DIEX_STANDARD_EXTENSION_COLUMN_RENAMES.flatMap(
      ({ tableName, columnName }) => {
        const [sourceName, targetName] =
          direction === 'up'
            ? [`_${columnName}`, columnName]
            : [columnName, `_${columnName}`];
        const state = getExpectedRenameState({
          sourceExists: existingColumns.has(`${tableName}.${sourceName}`),
          targetExists: existingColumns.has(`${tableName}.${targetName}`),
          sourceName: `${tableName}.${sourceName}`,
          targetName: `${tableName}.${targetName}`,
          kind: 'column',
        });

        return state === 'rename'
          ? [{
              sourceName,
              targetName,
              kind: 'column' as const,
              tableName,
            }]
          : [];
      },
    );
  }

  private async planIndexRenames({
    queryRunner,
    schemaName,
    direction,
    flatObjectMetadatas,
    flatFieldMetadatas,
    flatIndexMetadatas,
    objectMetadataIds,
  }: {
    queryRunner: QueryRunner;
    schemaName: string;
    direction: Direction;
    flatObjectMetadatas: FlatObjectMetadata[];
    flatFieldMetadatas: FlatFieldMetadata[];
    flatIndexMetadatas: FlatIndexMetadata[];
    objectMetadataIds: Set<string>;
  }): Promise<IndexRename[]> {
    const tableNames = DIEX_OBJECT_NAMES.flatMap((name) => [
      `_${name}`,
      name,
    ]);
    const rows: { indexname: string }[] = await queryRunner.query(
      `SELECT indexname
         FROM pg_indexes
        WHERE schemaname = $1
          AND tablename = ANY($2::text[])`,
      [schemaName, tableNames],
    );
    const existingIndexNames = new Set(rows.map(({ indexname }) => indexname));
    const objectMetadataById = new Map(
      flatObjectMetadatas.map((objectMetadata) => [
        objectMetadata.id,
        objectMetadata,
      ]),
    );
    const fieldMetadatasByObjectMetadataId = new Map<
      string,
      FlatFieldMetadata[]
    >();

    for (const fieldMetadata of flatFieldMetadatas) {
      const objectFields = fieldMetadatasByObjectMetadataId.get(
        fieldMetadata.objectMetadataId,
      );

      if (isDefined(objectFields)) {
        objectFields.push(fieldMetadata);
      } else {
        fieldMetadatasByObjectMetadataId.set(fieldMetadata.objectMetadataId, [
          fieldMetadata,
        ]);
      }
    }

    const indexRenames: IndexRename[] = [];
    const targetNames = new Map<string, string>();

    for (const flatIndexMetadata of flatIndexMetadatas) {
      if (!objectMetadataIds.has(flatIndexMetadata.objectMetadataId)) {
        continue;
      }

      const flatObjectMetadata = objectMetadataById.get(
        flatIndexMetadata.objectMetadataId,
      );
      const objectFlatFieldMetadatas =
        fieldMetadatasByObjectMetadataId.get(
          flatIndexMetadata.objectMetadataId,
        );

      if (!isDefined(flatObjectMetadata) || !isDefined(objectFlatFieldMetadatas)) {
        throw new Error(
          `Diex re-parentagem não conseguiu resolver os campos do índice ${flatIndexMetadata.universalIdentifier}`,
        );
      }

      const legacyName = computeFlatIndexNameOrThrow({
        flatObjectMetadata: {
          ...flatObjectMetadata,
          applicationUniversalIdentifier:
            LEGACY_METADATA_APPLICATION_UNIVERSAL_IDENTIFIER,
        },
        objectFlatFieldMetadatas,
        indexFields: flatIndexMetadata.universalFlatIndexFieldMetadatas,
        isUnique: flatIndexMetadata.isUnique,
        indexWhereClause: flatIndexMetadata.indexWhereClause,
      });
      const standardName = computeFlatIndexNameOrThrow({
        flatObjectMetadata: {
          ...flatObjectMetadata,
          applicationUniversalIdentifier:
            DIEX_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        },
        objectFlatFieldMetadatas,
        indexFields: flatIndexMetadata.universalFlatIndexFieldMetadatas,
        isUnique: flatIndexMetadata.isUnique,
        indexWhereClause: flatIndexMetadata.indexWhereClause,
      });
      const [sourceGeneratedName, targetName] =
        direction === 'up'
          ? [legacyName, standardName]
          : [standardName, legacyName];
      const sourceCandidates = [
        sourceGeneratedName,
        flatIndexMetadata.name,
      ].filter((name) => name !== targetName);
      const sourcePhysicalNames = [
        ...new Set(
          sourceCandidates.filter((name) => existingIndexNames.has(name)),
        ),
      ];
      const targetExists = existingIndexNames.has(targetName);

      if (
        sourcePhysicalNames.length > 1 ||
        (sourcePhysicalNames.length > 0 && targetExists)
      ) {
        throw new Error(
          `Diex re-parentagem inconsistente: índice ${sourceGeneratedName} e ${targetName} coexistem ou têm múltiplas origens para ${flatIndexMetadata.universalIdentifier}`,
        );
      }

      if (sourcePhysicalNames.length === 0 && !targetExists) {
        throw new Error(
          `Diex re-parentagem inconsistente: índice ${sourceGeneratedName} e ${targetName} não existem para ${flatIndexMetadata.universalIdentifier}`,
        );
      }

      const previousTarget = targetNames.get(targetName);

      if (isDefined(previousTarget) && previousTarget !== flatIndexMetadata.id) {
        throw new Error(
          `Diex re-parentagem inconsistente: dois índices apontam para o nome físico ${targetName}`,
        );
      }

      targetNames.set(targetName, flatIndexMetadata.id);

      if (sourcePhysicalNames.length === 1) {
        indexRenames.push({
          sourceName: sourcePhysicalNames[0],
          targetName,
          kind: 'index',
          indexMetadataId: flatIndexMetadata.id,
        });
      } else if (flatIndexMetadata.name !== targetName) {
        // The physical index is already at targetName, but its metadata name is
        // stale after a partial run. Keep this as a metadata-only operation.
        indexRenames.push({
          sourceName: targetName,
          targetName,
          kind: 'index',
          indexMetadataId: flatIndexMetadata.id,
        });
      }
    }

    return indexRenames;
  }

  private async loadApplications({
    queryRunner,
    workspaceId,
    universalIdentifiers,
  }: {
    queryRunner: QueryRunner;
    workspaceId: string;
    universalIdentifiers: string[];
  }): Promise<ApplicationRow[]> {
    return queryRunner.query(
      `SELECT "id", "universalIdentifier"
         FROM "core"."application"
        WHERE "workspaceId" = $1
          AND "universalIdentifier" = ANY($2::uuid[])`,
      [workspaceId, universalIdentifiers],
    );
  }

  private async loadObjectMetadataRows({
    queryRunner,
    workspaceId,
  }: {
    queryRunner: QueryRunner;
    workspaceId: string;
  }): Promise<ObjectMetadataRow[]> {
    return queryRunner.query(
      `SELECT "id", "universalIdentifier", "nameSingular", "applicationId"
         FROM "core"."objectMetadata"
        WHERE "workspaceId" = $1
          AND "universalIdentifier" = ANY($2::uuid[])`,
      [workspaceId, DIEX_OBJECT_UNIVERSAL_IDENTIFIERS],
    );
  }

  private async loadFieldMetadataRows({
    queryRunner,
    workspaceId,
    objectMetadataIds,
  }: {
    queryRunner: QueryRunner;
    workspaceId: string;
    objectMetadataIds: string[];
  }): Promise<FieldMetadataRow[]> {
    return queryRunner.query(
      `SELECT field."id",
              field."universalIdentifier",
              field."objectMetadataId",
              object."nameSingular" AS "objectNameSingular",
              field."applicationId"
         FROM "core"."fieldMetadata" field
         JOIN "core"."objectMetadata" object
           ON object."id" = field."objectMetadataId"
          AND object."workspaceId" = $1
        WHERE field."workspaceId" = $1
          AND (
            field."objectMetadataId" = ANY($2::uuid[])
            OR field."universalIdentifier" = ANY($3::uuid[])
          )`,
      [
        workspaceId,
        objectMetadataIds,
        DIEX_EXTENSION_FIELD_UNIVERSAL_IDENTIFIERS,
      ],
    );
  }

  private async loadIndexMetadataRows({
    queryRunner,
    workspaceId,
    objectMetadataIds,
  }: {
    queryRunner: QueryRunner;
    workspaceId: string;
    objectMetadataIds: string[];
  }): Promise<IndexMetadataRow[]> {
    return queryRunner.query(
      `SELECT "id", "name", "objectMetadataId", "applicationId"
         FROM "core"."indexMetadata"
        WHERE "workspaceId" = $1
          AND "objectMetadataId" = ANY($2::uuid[])`,
      [workspaceId, objectMetadataIds],
    );
  }

  private async loadIsCustomColumns({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<Set<string>> {
    const rows: { table_name: string }[] = await queryRunner.query(
      `SELECT table_name
         FROM information_schema.columns
        WHERE table_schema = 'core'
          AND table_name = ANY($1::text[])
          AND column_name = 'isCustom'`,
      [CORE_METADATA_TABLES],
    );

    return new Set(rows.map(({ table_name }) => table_name));
  }

  private getApplicationIdOrThrow(
    applications: ApplicationRow[],
    universalIdentifier: string,
    workspaceId: string,
  ): string {
    const application = applications.find(
      ({ universalIdentifier: rowUniversalIdentifier }) =>
        rowUniversalIdentifier === universalIdentifier,
    );

    if (!isDefined(application)) {
      throw new Error(
        `Diex re-parentagem não encontrou a aplicação ${universalIdentifier} no workspace ${workspaceId}`,
      );
    }

    return application.id;
  }

  private assertApplicationState({
    rows,
    sourceApplicationId,
    targetApplicationId,
    label,
  }: {
    rows: Array<{ applicationId: string }>;
    sourceApplicationId: string;
    targetApplicationId: string;
    label: string;
  }): void {
    if (rows.length === 0) {
      throw new Error(
        `Diex re-parentagem não encontrou ${label} para os objetos Diex`,
      );
    }

    const allowedApplicationIds = new Set([
      sourceApplicationId,
      targetApplicationId,
    ]);
    const inconsistentRows = rows.filter(
      ({ applicationId }) => !allowedApplicationIds.has(applicationId),
    );

    if (inconsistentRows.length > 0) {
      throw new Error(
        `Diex re-parentagem encontrou ${label} pertencentes a aplicação inesperada: ${inconsistentRows.length} registro(s)`,
      );
    }
  }

  private assertExpectedFieldCoverage({
    fieldMetadataRows,
    objectMetadataIds,
    workspaceId,
  }: {
    fieldMetadataRows: FieldMetadataRow[];
    objectMetadataIds: string[];
    workspaceId: string;
  }): void {
    const fieldUniversalIdentifiers = new Set(
      fieldMetadataRows.map(({ universalIdentifier }) => universalIdentifier),
    );
    const missingExtensionFields =
      DIEX_EXTENSION_FIELD_UNIVERSAL_IDENTIFIERS.filter(
        (universalIdentifier) =>
          !fieldUniversalIdentifiers.has(universalIdentifier),
      );

    if (missingExtensionFields.length > 0) {
      throw new Error(
        `Diex re-parentagem encontrou campos Diex ausentes no workspace ${workspaceId}: ${missingExtensionFields.join(', ')}`,
      );
    }

    const fieldObjectMetadataIds = new Set(
      fieldMetadataRows.map(({ objectMetadataId }) => objectMetadataId),
    );
    const objectsWithoutFields = objectMetadataIds.filter(
      (objectMetadataId) => !fieldObjectMetadataIds.has(objectMetadataId),
    );

    if (objectsWithoutFields.length > 0) {
      throw new Error(
        `Diex re-parentagem encontrou objetos sem campos no workspace ${workspaceId}: ${objectsWithoutFields.join(', ')}`,
      );
    }
  }

  private assertExpectedObjectNames({
    objectMetadataRows,
    workspaceId,
  }: {
    objectMetadataRows: ObjectMetadataRow[];
    workspaceId: string;
  }): void {
    const mismatches = objectMetadataRows.filter(
      ({ universalIdentifier, nameSingular }) =>
        DIEX_OBJECT_NAME_BY_UNIVERSAL_IDENTIFIER.get(universalIdentifier) !==
        nameSingular,
    );

    if (mismatches.length > 0) {
      throw new Error(
        `Diex re-parentagem encontrou nomes de objetos incompatíveis no workspace ${workspaceId}: ${mismatches
          .map(
            ({ universalIdentifier, nameSingular }) =>
              `${universalIdentifier}=${nameSingular}`,
          )
          .join(', ')}`,
      );
    }
  }

  private assertExpectedFieldOwnership({
    fieldMetadataRows,
    workspaceId,
  }: {
    fieldMetadataRows: FieldMetadataRow[];
    workspaceId: string;
  }): void {
    const mismatches = fieldMetadataRows.filter(({ universalIdentifier, objectNameSingular }) => {
      const expectedObjectName =
        DIEX_EXTENSION_FIELD_OBJECT_NAME_BY_UNIVERSAL_IDENTIFIER.get(
          universalIdentifier,
        );

      return (
        isDefined(expectedObjectName) &&
        expectedObjectName !== objectNameSingular
      );
    });

    if (mismatches.length > 0) {
      throw new Error(
        `Diex re-parentagem encontrou campos no objeto errado no workspace ${workspaceId}: ${mismatches
          .map(
            ({ universalIdentifier, objectNameSingular }) =>
              `${universalIdentifier}=${objectNameSingular}`,
          )
          .join(', ')}`,
      );
    }
  }

  private logPlan({
    workspaceId,
    direction,
    plan,
    dryRun,
  }: {
    workspaceId: string;
    direction: Direction;
    plan: MetadataPlan;
    dryRun: boolean;
  }): void {
    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${direction} tabelas=${plan.tableRenames.length}, colunas=${plan.columnRenames.length}, índices=${plan.indexRenames.length}, objetos=${plan.objectMetadataRows.length}, campos=${plan.fieldMetadataRows.length}, índices metadata=${plan.indexMetadataRows.length}`,
    );
  }

  private async invalidateMetadataCaches(workspaceId: string): Promise<void> {
    const metadataNames: AllMetadataName[] = [
      'objectMetadata',
      'fieldMetadata',
      'index',
      ...getMetadataRelatedMetadataNames('objectMetadata'),
      ...getMetadataRelatedMetadataNames('fieldMetadata'),
      ...getMetadataRelatedMetadataNames('index'),
      ...getMetadataSerializedRelationNames('objectMetadata'),
      ...getMetadataSerializedRelationNames('fieldMetadata'),
      ...getMetadataSerializedRelationNames('index'),
    ];
    const cacheKeys = [
      ...new Set(
        metadataNames.map((metadataName) =>
          getMetadataFlatEntityMapsKey(metadataName),
        ),
      ),
      'ORMEntityMetadatas',
      'graphQLResolverNameMap',
    ] as WorkspaceCacheKeyName[];

    await this.workspaceCacheService.invalidateAndRecompute(
      workspaceId,
      cacheKeys,
    );
  }
}
