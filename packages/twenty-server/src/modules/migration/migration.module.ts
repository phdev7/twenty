import { Module } from '@nestjs/common';

import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { MigrationController } from 'src/modules/migration/controllers/migration.controller';
import { MigrationService } from 'src/modules/migration/services/migration.service';

@Module({
  imports: [
    TokenModule,
    KeyValuePairModule,
    TwentyORMModule,
    WorkspaceCacheStorageModule,
  ],
  controllers: [MigrationController],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
