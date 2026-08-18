import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.28.0', 1787300000001, { type: 'slow' })
export class UniqueDiexFormsHostSlowInstanceCommand
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
           AND "deletedAt" IS NULL
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
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_WORKSPACE_FORMS_HOST"
       ON "core"."workspace" (LOWER(COALESCE("formsSubdomain", "subdomain")))
       WHERE "deletedAt" IS NULL`,
    );
  }

  public async up(_queryRunner: QueryRunner): Promise<void> {
    return;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "core"."IDX_WORKSPACE_FORMS_HOST"`,
    );
  }
}
