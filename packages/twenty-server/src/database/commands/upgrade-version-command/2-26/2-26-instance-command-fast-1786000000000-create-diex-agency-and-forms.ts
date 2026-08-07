import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

const createEnumIfNotExists = async (
  queryRunner: QueryRunner,
  enumName: string,
  values: string[],
): Promise<void> => {
  const labels = values.map((value) => `'${value}'`).join(', ');

  await queryRunner.query(
    `DO $$ BEGIN
       CREATE TYPE "core"."${enumName}" AS ENUM (${labels});
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$`,
  );
};

@RegisteredInstanceCommand('2.26.0', 1786000000000)
export class CreateDiexAgencyAndFormsFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await createEnumIfNotExists(queryRunner, 'diex_metric_unit_type_enum', [
      'NUMBER',
      'CURRENCY',
      'PERCENTAGE',
      'RATIO',
    ]);
    await createEnumIfNotExists(
      queryRunner,
      'diex_target_comparison_type_enum',
      ['HIGHER_IS_BETTER', 'LOWER_IS_BETTER'],
    );
    await createEnumIfNotExists(queryRunner, 'diex_metric_source_type_enum', [
      'MANUAL',
      'META_ADS_SYNC',
      'API_IMPORT',
    ]);
    await createEnumIfNotExists(queryRunner, 'diex_meta_ads_status_enum', [
      'CONNECTED',
      'EXPIRED',
      'DISCONNECTED',
    ]);
    await createEnumIfNotExists(
      queryRunner,
      'diex_form_target_object_enum',
      ['PERSON', 'COMPANY', 'OPPORTUNITY'],
    );
    await createEnumIfNotExists(queryRunner, 'diex_form_status_enum', [
      'PUBLISHED',
      'DRAFT',
      'ARCHIVED',
    ]);
    await createEnumIfNotExists(queryRunner, 'diex_form_field_type_enum', [
      'TEXT',
      'EMAIL',
      'PHONE',
      'SELECT',
      'NUMBER',
      'TEXTAREA',
    ]);
    await createEnumIfNotExists(
      queryRunner,
      'diex_form_submission_source_enum',
      [
        'INTERNAL_FORM',
        'WEBHOOK_API',
        'WORDPRESS',
        'FRAMER',
        'YAYFORMS',
        'CAL_COM',
        'TYPEFORM',
        'TALLY',
      ],
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."diexAgency" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "ownerUserId" uuid NOT NULL,
        "workspaceSlotsLimit" integer NOT NULL DEFAULT 5,
        "status" character varying NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diexAgency_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_DIEX_AGENCY_SLUG" ON "core"."diexAgency" ("slug")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."diexAgencyMetricDefinition" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agencyId" uuid NOT NULL,
        "name" text NOT NULL,
        "code" text NOT NULL,
        "unitType" "core"."diex_metric_unit_type_enum" NOT NULL DEFAULT 'NUMBER',
        "currencyCode" character varying DEFAULT 'BRL',
        "targetComparison" "core"."diex_target_comparison_type_enum" NOT NULL DEFAULT 'HIGHER_IS_BETTER',
        "description" text,
        "isVisibleToClient" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diexAgencyMetricDefinition_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diexAgencyMetricDefinition_agencyId" FOREIGN KEY ("agencyId") REFERENCES "core"."diexAgency"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_METRIC_DEF_AGENCY_ID" ON "core"."diexAgencyMetricDefinition" ("agencyId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."diexAgencyMetricEntry" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "metricDefinitionId" uuid NOT NULL,
        "clientWorkspaceId" uuid NOT NULL,
        "periodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
        "periodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
        "value" numeric(14,2) NOT NULL DEFAULT 0,
        "source" "core"."diex_metric_source_type_enum" NOT NULL DEFAULT 'MANUAL',
        "notes" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diexAgencyMetricEntry_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diexAgencyMetricEntry_metricDefinitionId" FOREIGN KEY ("metricDefinitionId") REFERENCES "core"."diexAgencyMetricDefinition"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_diexAgencyMetricEntry_clientWorkspaceId" FOREIGN KEY ("clientWorkspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_METRIC_ENTRY_DEF_ID" ON "core"."diexAgencyMetricEntry" ("metricDefinitionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_METRIC_ENTRY_WORKSPACE_ID" ON "core"."diexAgencyMetricEntry" ("clientWorkspaceId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."diexMetaAdsAccount" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agencyId" uuid NOT NULL,
        "clientWorkspaceId" uuid,
        "adAccountId" text NOT NULL,
        "accountName" text NOT NULL,
        "accessToken" text NOT NULL,
        "status" "core"."diex_meta_ads_status_enum" NOT NULL DEFAULT 'CONNECTED',
        "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diexMetaAdsAccount_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diexMetaAdsAccount_agencyId" FOREIGN KEY ("agencyId") REFERENCES "core"."diexAgency"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_diexMetaAdsAccount_clientWorkspaceId" FOREIGN KEY ("clientWorkspaceId") REFERENCES "core"."workspace"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_META_ADS_AGENCY_ID" ON "core"."diexMetaAdsAccount" ("agencyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_META_ADS_WORKSPACE_ID" ON "core"."diexMetaAdsAccount" ("clientWorkspaceId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."diexForm" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId" uuid NOT NULL,
        "title" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "targetObject" "core"."diex_form_target_object_enum" NOT NULL DEFAULT 'PERSON',
        "status" "core"."diex_form_status_enum" NOT NULL DEFAULT 'PUBLISHED',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diexForm_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diexForm_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_FORM_WORKSPACE_ID" ON "core"."diexForm" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_FORM_SLUG" ON "core"."diexForm" ("slug")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."diexFormField" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "formId" uuid NOT NULL,
        "label" text NOT NULL,
        "name" text NOT NULL,
        "type" "core"."diex_form_field_type_enum" NOT NULL DEFAULT 'TEXT',
        "targetFieldName" text,
        "isRequired" boolean NOT NULL DEFAULT false,
        "position" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diexFormField_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diexFormField_formId" FOREIGN KEY ("formId") REFERENCES "core"."diexForm"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_FORM_FIELD_FORM_ID" ON "core"."diexFormField" ("formId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."diexFormSubmission" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "formId" uuid NOT NULL,
        "workspaceId" uuid NOT NULL,
        "submittedData" jsonb NOT NULL,
        "source" "core"."diex_form_submission_source_enum" NOT NULL DEFAULT 'INTERNAL_FORM',
        "mappedRecordId" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diexFormSubmission_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diexFormSubmission_formId" FOREIGN KEY ("formId") REFERENCES "core"."diexForm"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_FORM_SUBMISSION_FORM_ID" ON "core"."diexFormSubmission" ("formId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DIEX_FORM_SUBMISSION_WORKSPACE_ID" ON "core"."diexFormSubmission" ("workspaceId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ADD COLUMN IF NOT EXISTS "managedByAgencyId" uuid`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         ALTER TABLE "core"."workspace"
           ADD CONSTRAINT "FK_workspace_managedByAgencyId"
           FOREIGN KEY ("managedByAgencyId") REFERENCES "core"."diexAgency"("id") ON DELETE SET NULL;
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_WORKSPACE_MANAGED_BY_AGENCY_ID" ON "core"."workspace" ("managedByAgencyId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "core"."user" ADD COLUMN IF NOT EXISTS "isAgencyManager" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."user" ADD COLUMN IF NOT EXISTS "agencyId" uuid`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         ALTER TABLE "core"."user"
           ADD CONSTRAINT "FK_user_agencyId"
           FOREIGN KEY ("agencyId") REFERENCES "core"."diexAgency"("id") ON DELETE SET NULL;
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_USER_AGENCY_ID" ON "core"."user" ("agencyId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."user" DROP CONSTRAINT IF EXISTS "FK_user_agencyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."user" DROP COLUMN IF EXISTS "agencyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."user" DROP COLUMN IF EXISTS "isAgencyManager"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" DROP CONSTRAINT IF EXISTS "FK_workspace_managedByAgencyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" DROP COLUMN IF EXISTS "managedByAgencyId"`,
    );

    await queryRunner.query(
      'DROP TABLE IF EXISTS "core"."diexFormSubmission"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "core"."diexFormField"');
    await queryRunner.query('DROP TABLE IF EXISTS "core"."diexForm"');
    await queryRunner.query('DROP TABLE IF EXISTS "core"."diexMetaAdsAccount"');
    await queryRunner.query(
      'DROP TABLE IF EXISTS "core"."diexAgencyMetricEntry"',
    );
    await queryRunner.query(
      'DROP TABLE IF EXISTS "core"."diexAgencyMetricDefinition"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "core"."diexAgency"');

    await queryRunner.query(
      'DROP TYPE IF EXISTS "core"."diex_form_submission_source_enum"',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS "core"."diex_form_field_type_enum"',
    );
    await queryRunner.query('DROP TYPE IF EXISTS "core"."diex_form_status_enum"');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "core"."diex_form_target_object_enum"',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS "core"."diex_meta_ads_status_enum"',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS "core"."diex_metric_source_type_enum"',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS "core"."diex_target_comparison_type_enum"',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS "core"."diex_metric_unit_type_enum"',
    );
  }
}
