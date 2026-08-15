import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.28.0', 1787100000001, { type: 'slow' })
export class BackfillDiexFormsSubdomainSlowInstanceCommand
  implements SlowInstanceCommand
{
  async runDataMigration(dataSource: DataSource): Promise<void> {
    await dataSource.query(
      `WITH normalized AS (
         SELECT
           "id",
           LOWER("subdomain") AS candidate,
           ROW_NUMBER() OVER (
             PARTITION BY LOWER("subdomain")
             ORDER BY "createdAt", "id"
           ) AS duplicate_rank
         FROM "core"."workspace"
         WHERE "formsSubdomain" IS NULL
       )
       UPDATE "core"."workspace" AS workspace
       SET "formsSubdomain" = CASE
         WHEN normalized.duplicate_rank = 1 AND normalized.candidate <> 'www'
           THEN normalized.candidate
         ELSE LEFT(normalized.candidate, 26) || '-' || REPLACE(workspace."id"::text, '-', '')
       END
       FROM normalized
       WHERE workspace."id" = normalized."id"`,
    );
    await dataSource.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_WORKSPACE_FORMS_SUBDOMAIN"
       ON "core"."workspace" (LOWER("formsSubdomain"))
       WHERE "formsSubdomain" IS NOT NULL`,
    );
    await dataSource.query(
      `ALTER TABLE "core"."workspace"
       VALIDATE CONSTRAINT "CHK_workspace_formsSubdomain"`,
    );
    await dataSource.query(
      `WITH duplicates AS (
         SELECT
           "id",
           ROW_NUMBER() OVER (
             PARTITION BY "workspaceId", "slug"
             ORDER BY "createdAt", "id"
           ) AS duplicate_rank
         FROM "core"."diexForm"
       )
       UPDATE "core"."diexForm" AS form
       SET "slug" = LEFT(form."slug", 43) || '-' || form."id"::text
       FROM duplicates
       WHERE form."id" = duplicates."id"
         AND duplicates.duplicate_rank > 1`,
    );
    await dataSource.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_DIEX_FORM_WORKSPACE_SLUG"
       ON "core"."diexForm" ("workspaceId", "slug")`,
    );
    await dataSource.query(
      `WITH duplicates AS (
         SELECT
           "id",
           ROW_NUMBER() OVER (
             PARTITION BY "formId", "name"
             ORDER BY "position", "createdAt", "id"
           ) AS duplicate_rank
         FROM "core"."diexFormField"
       )
       UPDATE "core"."diexFormField" AS field
       SET "name" = LEFT(field."name", 31) || '_' || REPLACE(field."id"::text, '-', '')
       FROM duplicates
       WHERE field."id" = duplicates."id"
         AND duplicates.duplicate_rank > 1`,
    );
    await dataSource.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_DIEX_FORM_FIELD_FORM_NAME"
       ON "core"."diexFormField" ("formId", "name")`,
    );
  }

  public async up(_queryRunner: QueryRunner): Promise<void> {
    return;
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    return;
  }
}
