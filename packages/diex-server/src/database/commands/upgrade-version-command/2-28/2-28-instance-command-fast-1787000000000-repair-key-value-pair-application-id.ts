import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

// Segunda passagem do reparo que já existe na 2.24.0. A instância de produção
// chegou à 0.6.70 sem `core.keyValuePair.applicationId`, o que prova que nem o
// comando de introdução (2.23.0) nem o reparo (2.24.0) foram alcançados pelo
// cursor forward-only. Enquanto a versão corrente era 2.27.0 o adaptador de
// upgrade escondia a coluna e a aplicação funcionava; ao subir para 2.28.0 ele
// deixou de esconder e toda leitura da entidade passou a falhar, derrubando
// /client-config inteiro.
//
// Repetir o DDL numa versão que o cursor ainda não passou é o único jeito de
// alcançar essas instâncias. É idempotente e no-op onde a coluna já existe.
@RegisteredInstanceCommand('2.28.0', 1787000000000)
export class RepairKeyValuePairApplicationId2_28FastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "core"."keyValuePair_type_enum" ADD VALUE IF NOT EXISTS 'APPLICATION_VARIABLE'`,
    );
    await queryRunner.query(
      'ALTER TABLE "core"."keyValuePair" ADD COLUMN IF NOT EXISTS "applicationId" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."keyValuePair" DROP CONSTRAINT IF EXISTS "FK_e31d245e30cd82307e5416450fc"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."keyValuePair" ADD CONSTRAINT "FK_e31d245e30cd82307e5416450fc" FOREIGN KEY ("applicationId") REFERENCES "core"."application"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_KEY_VALUE_PAIR_APPLICATION_ID" ON "core"."keyValuePair" ("applicationId")',
    );

    await queryRunner.query(
      'DROP INDEX IF EXISTS "core"."IDX_KEY_VALUE_PAIR_KEY_WORKSPACE_ID_NULL_USER_ID_UNIQUE"',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_KEY_VALUE_PAIR_KEY_WORKSPACE_ID_NULL_USER_ID_UNIQUE" ON "core"."keyValuePair" ("key", "workspaceId") WHERE "userId" IS NULL AND "applicationId" IS NULL',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "core"."IDX_KEY_VALUE_PAIR_KEY_NULL_USER_ID_NULL_WORKSPACE_ID_UNIQUE"',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_KEY_VALUE_PAIR_KEY_NULL_USER_ID_NULL_WORKSPACE_ID_UNIQUE" ON "core"."keyValuePair" ("key") WHERE "userId" IS NULL AND "workspaceId" IS NULL AND "applicationId" IS NULL',
    );

    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_KEY_VALUE_PAIR_KEY_APPLICATION_ID_WORKSPACE_UNIQUE" ON "core"."keyValuePair" ("key", "applicationId") WHERE "applicationId" IS NOT NULL AND "workspaceId" IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_KEY_VALUE_PAIR_KEY_APPLICATION_ID_GLOBAL_UNIQUE" ON "core"."keyValuePair" ("key", "applicationId") WHERE "applicationId" IS NOT NULL AND "workspaceId" IS NULL',
    );
  }

  // No-op pelo mesmo motivo do reparo da 2.24.0: o ciclo de vida da coluna
  // pertence ao comando de introdução, então reverter aqui não pode derrubá-la.
  public async down(): Promise<void> {}
}
