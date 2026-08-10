import { Module } from '@nestjs/common';

import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { DiexBadgeToolWorkspaceService } from 'src/modules/diex/tools/services/diex-badge-tool.workspace-service';

@Module({
  imports: [DiexORMModule, WorkspaceManyOrAllFlatEntityMapsCacheModule],
  providers: [DiexBadgeToolWorkspaceService],
  exports: [DiexBadgeToolWorkspaceService],
})
export class DiexToolsModule {}
