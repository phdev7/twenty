import { Module } from '@nestjs/common';

import { CacheLockModule } from 'src/engine/core-modules/cache-lock/cache-lock.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { AiModelsModule } from 'src/engine/metadata-modules/ai/ai-models/ai-models.module';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { WorkspaceFineTuningService } from 'src/modules/workspace-architecture/services/workspace-fine-tuning.service';
import { WorkspaceArchitectureToolWorkspaceService } from 'src/modules/workspace-architecture/tools/services/workspace-architecture-tool.workspace-service';

@Module({
  imports: [
    TwentyORMModule,
    CacheLockModule,
    ObjectMetadataModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    AiModelsModule,
  ],
  providers: [
    WorkspaceArchitectureService,
    WorkspaceArchitectureToolWorkspaceService,
    WorkspaceFineTuningService,
  ],
  exports: [
    WorkspaceArchitectureService,
    WorkspaceArchitectureToolWorkspaceService,
    WorkspaceFineTuningService,
  ],
})
export class WorkspaceArchitectureModule {}
