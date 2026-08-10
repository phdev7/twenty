import { Module } from '@nestjs/common';

import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { WorkspaceContextToolWorkspaceService } from 'src/modules/workspace-context/tools/services/workspace-context-tool.workspace-service';

@Module({
  imports: [DiexORMModule],
  providers: [WorkspaceContextToolWorkspaceService],
  exports: [WorkspaceContextToolWorkspaceService],
})
export class WorkspaceContextModule {}
