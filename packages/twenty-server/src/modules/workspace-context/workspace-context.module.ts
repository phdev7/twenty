import { Module } from '@nestjs/common';

import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { WorkspaceContextToolWorkspaceService } from 'src/modules/workspace-context/tools/services/workspace-context-tool.workspace-service';

@Module({
  imports: [TwentyORMModule],
  providers: [WorkspaceContextToolWorkspaceService],
  exports: [WorkspaceContextToolWorkspaceService],
})
export class WorkspaceContextModule {}
