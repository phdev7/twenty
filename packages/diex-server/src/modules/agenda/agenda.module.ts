import { Module } from '@nestjs/common';

import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { AgendaToolWorkspaceService } from 'src/modules/agenda/tools/services/agenda-tool.workspace-service';

@Module({
  imports: [DiexORMModule],
  providers: [AgendaToolWorkspaceService],
  exports: [AgendaToolWorkspaceService],
})
export class AgendaModule {}
