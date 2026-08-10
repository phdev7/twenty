import { Module } from '@nestjs/common';

import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { DiexConfigModule } from 'src/engine/core-modules/diex-config/diex-config.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { GlobalWorkspaceDataSourceModule } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-datasource.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';

import { DiexStandardApplicationService } from './services/diex-standard-application.service';

@Module({
  providers: [DiexStandardApplicationService],
  imports: [
    ApplicationModule,
    DiexConfigModule,
    WorkspaceCacheModule,
    WorkspaceMigrationModule,
    GlobalWorkspaceDataSourceModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
  ],
  exports: [DiexStandardApplicationService],
})
export class DiexStandardApplicationModule {}
