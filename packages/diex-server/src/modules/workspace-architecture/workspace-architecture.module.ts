import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillingModule } from 'src/engine/core-modules/billing/billing.module';
import { CacheLockModule } from 'src/engine/core-modules/cache-lock/cache-lock.module';
import { RecordCrudModule } from 'src/engine/core-modules/record-crud/record-crud.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { AiModelsModule } from 'src/engine/metadata-modules/ai/ai-models/ai-models.module';
import { AiBillingModule } from 'src/engine/metadata-modules/ai/ai-billing/ai-billing.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { WorkspaceDeclarativeAdapterRegistry } from 'src/modules/workspace-architecture/services/workspace-declarative-adapter.registry';
import { WorkspaceCommercialReadinessService } from 'src/modules/workspace-architecture/services/workspace-commercial-readiness.service';
import { WorkspaceFineTuningService } from 'src/modules/workspace-architecture/services/workspace-fine-tuning.service';
import { WorkspaceArchitectureToolWorkspaceService } from 'src/modules/workspace-architecture/tools/services/workspace-architecture-tool.workspace-service';

@Module({
  imports: [
    DiexORMModule,
    CacheLockModule,
    ObjectMetadataModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    AiModelsModule,
    AiBillingModule,
    BillingModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
    FieldMetadataModule,
    RecordCrudModule,
  ],
  providers: [
    WorkspaceArchitectureService,
    WorkspaceDeclarativeAdapterRegistry,
    WorkspaceCommercialReadinessService,
    WorkspaceArchitectureToolWorkspaceService,
    WorkspaceFineTuningService,
  ],
  exports: [
    WorkspaceArchitectureService,
    WorkspaceDeclarativeAdapterRegistry,
    WorkspaceCommercialReadinessService,
    WorkspaceArchitectureToolWorkspaceService,
    WorkspaceFineTuningService,
  ],
})
export class WorkspaceArchitectureModule {}
