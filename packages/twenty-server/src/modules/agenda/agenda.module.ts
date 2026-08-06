import { Module } from '@nestjs/common';

import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { AgendaToolWorkspaceService } from 'src/modules/agenda/tools/services/agenda-tool.workspace-service';

@Module({
  imports: [TwentyORMModule],
  providers: [AgendaToolWorkspaceService],
  exports: [AgendaToolWorkspaceService],
})
export class AgendaModule {}
