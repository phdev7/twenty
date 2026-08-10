import { Module } from '@nestjs/common';

import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { CommercialIntelligenceToolWorkspaceService } from 'src/modules/commercial-intelligence/tools/services/commercial-intelligence-tool.workspace-service';

@Module({
  imports: [DiexORMModule],
  providers: [CommercialIntelligenceToolWorkspaceService],
  exports: [CommercialIntelligenceToolWorkspaceService],
})
export class CommercialIntelligenceModule {}
