import { Module } from '@nestjs/common';

import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { DiexBadgeToolWorkspaceService } from 'src/modules/diex/tools/services/diex-badge-tool.workspace-service';

@Module({
  imports: [TwentyORMModule, WorkspaceManyOrAllFlatEntityMapsCacheModule],
  providers: [DiexBadgeToolWorkspaceService],
  exports: [DiexBadgeToolWorkspaceService],
})
export class DiexToolsModule {}
