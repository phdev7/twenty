import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { MigrationController } from 'src/modules/migration/controllers/migration.controller';
import { MigrationService } from 'src/modules/migration/services/migration.service';

@Module({
  imports: [KeyValuePairModule, TwentyORMModule],
  controllers: [MigrationController],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
