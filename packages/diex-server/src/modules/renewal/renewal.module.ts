import { Module } from '@nestjs/common';

import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { RenewalToolWorkspaceService } from 'src/modules/renewal/tools/services/renewal-tool.workspace-service';

@Module({
  imports: [DiexORMModule],
  providers: [RenewalToolWorkspaceService],
  exports: [RenewalToolWorkspaceService],
})
export class RenewalModule {}
