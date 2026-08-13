import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

// Workspaces que já tinham um número de WhatsApp escolheram esse canal antes de
// a coluna existir. O backfill fica fora do comando fast que adiciona a coluna:
// juntar os dois na mesma transação segura um ACCESS EXCLUSIVE em core.workspace
// durante toda a escrita e trava as leituras enquanto o deploy roda.
@RegisteredInstanceCommand('2.27.0', 1787050000000, { type: 'slow' })
export class BackfillDiexOnboardingPrimaryChannelSlowInstanceCommand
  implements SlowInstanceCommand
{
  async runDataMigration(dataSource: DataSource): Promise<void> {
    await dataSource.query(
      `UPDATE "core"."workspace"
       SET "onboardingPrimaryChannel" = 'WHATSAPP'
       WHERE "onboardingPrimaryChannel" IS NULL
         AND NULLIF(BTRIM("onboardingWhatsapp"), '') IS NOT NULL`,
    );
  }

  public async up(_queryRunner: QueryRunner): Promise<void> {
    return;
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    return;
  }
}
