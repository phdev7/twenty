import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeORMModule } from 'src/database/typeorm/typeorm.module';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { DiexConfigModule } from 'src/engine/core-modules/diex-config/diex-config.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { WorkspaceFeatureFlagsMapCacheModule } from 'src/engine/metadata-modules/workspace-feature-flags-map-cache/workspace-feature-flags-map-cache.module';
import { EntitySchemaColumnFactory } from 'src/engine/diex-orm/factories/entity-schema-column.factory';
import { EntitySchemaRelationFactory } from 'src/engine/diex-orm/factories/entity-schema-relation.factory';
import { EntitySchemaFactory } from 'src/engine/diex-orm/factories/entity-schema.factory';
import { GlobalWorkspaceDataSourceService } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-datasource.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WorkspaceORMEntityMetadatasCacheService } from 'src/engine/diex-orm/global-workspace-datasource/workspace-orm-entity-metadatas-cache.service';
import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceEventEmitterModule } from 'src/engine/workspace-event-emitter/workspace-event-emitter.module';

@Global()
@Module({
  imports: [
    TypeORMModule,
    TypeOrmModule.forFeature([
      WorkspaceEntity,
      ObjectMetadataEntity,
      FieldMetadataEntity,
      ApplicationEntity,
    ]),
    WorkspaceCacheStorageModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    WorkspaceFeatureFlagsMapCacheModule,
    DiexConfigModule,
    WorkspaceEventEmitterModule,
    WorkspaceCacheModule,
    DiexORMModule,
  ],
  providers: [
    GlobalWorkspaceDataSourceService,
    GlobalWorkspaceOrmManager,
    EntitySchemaFactory,
    EntitySchemaColumnFactory,
    EntitySchemaRelationFactory,
    WorkspaceORMEntityMetadatasCacheService,
  ],
  exports: [GlobalWorkspaceDataSourceService, GlobalWorkspaceOrmManager],
})
export class GlobalWorkspaceDataSourceModule {}
