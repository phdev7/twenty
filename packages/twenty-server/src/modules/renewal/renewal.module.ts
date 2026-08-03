import { Module } from '@nestjs/common';

import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { RenewalToolWorkspaceService } from 'src/modules/renewal/tools/services/renewal-tool.workspace-service';

@Module({
  imports: [TwentyORMModule],
  providers: [RenewalToolWorkspaceService],
  exports: [RenewalToolWorkspaceService],
})
export class RenewalModule {}
