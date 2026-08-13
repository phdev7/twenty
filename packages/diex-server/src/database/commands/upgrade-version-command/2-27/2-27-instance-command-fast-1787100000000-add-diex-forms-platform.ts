import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

const addEnumValue = async (
  queryRunner: QueryRunner,
  enumName: string,
  value: string,
): Promise<void> => {
  await queryRunner.query(
    `ALTER TYPE "core"."${enumName}" ADD VALUE IF NOT EXISTS '${value}'`,
  );
};

@RegisteredInstanceCommand('2.27.0', 1787100000000)
export class AddDiexFormsPlatformFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const value of [
      'MULTI_SELECT',
      'RADIO',
      'CHECKBOX',
      'CURRENCY',
      'DATE',
      'URL',
      'RATING',
    ]) {
      await addEnumValue(
        queryRunner,
        'diex_form_field_type_enum',
        value,
      );
    }

    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "core"."diex_form_layout_enum" AS ENUM ('STEP_BY_STEP', 'SINGLE_PAGE');
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "core"."diex_form_submission_status_enum" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$`,
    );

    await queryRunner.query(
      `ALTER TABLE "core"."workspace"
       ADD COLUMN IF NOT EXISTS "formsSubdomain" varchar(63)`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         ALTER TABLE "core"."workspace"
           ADD CONSTRAINT "CHK_workspace_formsSubdomain"
           CHECK (
             "formsSubdomain" IS NULL OR (
               "formsSubdomain" = LOWER("formsSubdomain")
               AND "formsSubdomain" <> 'www'
               AND "formsSubdomain" ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
             )
           ) NOT VALID;
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."diexForm"
       ALTER COLUMN "status" SET DEFAULT 'DRAFT',
       ADD COLUMN IF NOT EXISTS "layout" "core"."diex_form_layout_enum" NOT NULL DEFAULT 'STEP_BY_STEP',
       ADD COLUMN IF NOT EXISTS "submitButtonLabel" text NOT NULL DEFAULT 'Enviar',
       ADD COLUMN IF NOT EXISTS "successTitle" text NOT NULL DEFAULT 'Obrigado!',
       ADD COLUMN IF NOT EXISTS "successMessage" text NOT NULL DEFAULT 'Recebemos suas informações e entraremos em contato em breve.',
       ADD COLUMN IF NOT EXISTS "showLogo" boolean NOT NULL DEFAULT true,
       ADD COLUMN IF NOT EXISTS "logoUrl" text,
       ADD COLUMN IF NOT EXISTS "accentColor" varchar(7) NOT NULL DEFAULT '#6C5CE7',
       ADD COLUMN IF NOT EXISTS "privacyPolicyUrl" text,
       ADD COLUMN IF NOT EXISTS "consentText" text,
       ADD COLUMN IF NOT EXISTS "consentRequired" boolean NOT NULL DEFAULT false,
       ADD COLUMN IF NOT EXISTS "createOpportunity" boolean NOT NULL DEFAULT false,
       ADD COLUMN IF NOT EXISTS "opportunityStage" text NOT NULL DEFAULT 'NEW',
       ADD COLUMN IF NOT EXISTS "ownerId" uuid,
       ADD COLUMN IF NOT EXISTS "draftVersion" integer NOT NULL DEFAULT 1,
       ADD COLUMN IF NOT EXISTS "publishedVersion" integer NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS "publishedAt" timestamptz,
       ADD COLUMN IF NOT EXISTS "publishedSnapshot" jsonb,
       ADD COLUMN IF NOT EXISTS "settings" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."diexFormField"
       ADD COLUMN IF NOT EXISTS "placeholder" text,
       ADD COLUMN IF NOT EXISTS "helpText" text,
       ADD COLUMN IF NOT EXISTS "options" jsonb NOT NULL DEFAULT '[]'::jsonb,
       ADD COLUMN IF NOT EXISTS "validation" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );

    await queryRunner.query(
      `ALTER TABLE "core"."diexFormSubmission"
       ADD COLUMN IF NOT EXISTS "status" "core"."diex_form_submission_status_enum" NOT NULL DEFAULT 'RECEIVED',
       ADD COLUMN IF NOT EXISTS "idempotencyKey" varchar(120),
       ADD COLUMN IF NOT EXISTS "ipHash" varchar(64),
       ADD COLUMN IF NOT EXISTS "userAgentHash" varchar(64),
       ADD COLUMN IF NOT EXISTS "attribution" jsonb NOT NULL DEFAULT '{}'::jsonb,
       ADD COLUMN IF NOT EXISTS "consentAt" timestamptz,
       ADD COLUMN IF NOT EXISTS "processedAt" timestamptz,
       ADD COLUMN IF NOT EXISTS "processingError" text,
       ADD COLUMN IF NOT EXISTS "personId" uuid,
       ADD COLUMN IF NOT EXISTS "companyId" uuid,
       ADD COLUMN IF NOT EXISTS "opportunityId" uuid`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_DIEX_FORM_SUBMISSION_IDEMPOTENCY"
       ON "core"."diexFormSubmission" ("formId", "idempotencyKey")
       WHERE "idempotencyKey" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_DIEX_FORM_FIELD_FORM_NAME"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_DIEX_FORM_SUBMISSION_IDEMPOTENCY"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."diexFormSubmission"
       DROP COLUMN IF EXISTS "opportunityId",
       DROP COLUMN IF EXISTS "companyId",
       DROP COLUMN IF EXISTS "personId",
       DROP COLUMN IF EXISTS "processingError",
       DROP COLUMN IF EXISTS "processedAt",
       DROP COLUMN IF EXISTS "consentAt",
       DROP COLUMN IF EXISTS "attribution",
       DROP COLUMN IF EXISTS "userAgentHash",
       DROP COLUMN IF EXISTS "ipHash",
       DROP COLUMN IF EXISTS "idempotencyKey",
       DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."diexFormField"
       DROP COLUMN IF EXISTS "validation",
       DROP COLUMN IF EXISTS "options",
       DROP COLUMN IF EXISTS "helpText",
       DROP COLUMN IF EXISTS "placeholder"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_DIEX_FORM_WORKSPACE_SLUG"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."diexForm"
       ALTER COLUMN "status" SET DEFAULT 'PUBLISHED',
       DROP COLUMN IF EXISTS "settings",
       DROP COLUMN IF EXISTS "publishedSnapshot",
       DROP COLUMN IF EXISTS "publishedAt",
       DROP COLUMN IF EXISTS "publishedVersion",
       DROP COLUMN IF EXISTS "draftVersion",
       DROP COLUMN IF EXISTS "ownerId",
       DROP COLUMN IF EXISTS "opportunityStage",
       DROP COLUMN IF EXISTS "createOpportunity",
       DROP COLUMN IF EXISTS "consentRequired",
       DROP COLUMN IF EXISTS "consentText",
       DROP COLUMN IF EXISTS "privacyPolicyUrl",
       DROP COLUMN IF EXISTS "accentColor",
       DROP COLUMN IF EXISTS "logoUrl",
       DROP COLUMN IF EXISTS "showLogo",
       DROP COLUMN IF EXISTS "successMessage",
       DROP COLUMN IF EXISTS "successTitle",
       DROP COLUMN IF EXISTS "submitButtonLabel",
       DROP COLUMN IF EXISTS "layout"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_WORKSPACE_FORMS_SUBDOMAIN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace"
       DROP CONSTRAINT IF EXISTS "CHK_workspace_formsSubdomain"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" DROP COLUMN IF EXISTS "formsSubdomain"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "core"."diex_form_submission_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "core"."diex_form_layout_enum"`,
    );
  }
}
