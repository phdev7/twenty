import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.26.0', 1785900000000)
export class AddDiexOnboardingProfileToWorkspaceFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."workspace"
        ADD COLUMN IF NOT EXISTS "onboardingWhatsapp" varchar(40),
        ADD COLUMN IF NOT EXISTS "onboardingCompanyDescription" text,
        ADD COLUMN IF NOT EXISTS "onboardingIdealCustomerProfile" text,
        ADD COLUMN IF NOT EXISTS "onboardingToneOfVoice" text,
        ADD COLUMN IF NOT EXISTS "onboardingPrimaryGoal" text,
        ADD COLUMN IF NOT EXISTS "onboardingCompanySize" varchar(80),
        ADD COLUMN IF NOT EXISTS "onboardingCurrentProcess" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."workspace"
        DROP COLUMN IF EXISTS "onboardingCurrentProcess",
        DROP COLUMN IF EXISTS "onboardingCompanySize",
        DROP COLUMN IF EXISTS "onboardingPrimaryGoal",
        DROP COLUMN IF EXISTS "onboardingToneOfVoice",
        DROP COLUMN IF EXISTS "onboardingIdealCustomerProfile",
        DROP COLUMN IF EXISTS "onboardingCompanyDescription",
        DROP COLUMN IF EXISTS "onboardingWhatsapp"`,
    );
  }
}
