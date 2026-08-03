import { Module } from '@nestjs/common';

import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { CommercialIntelligenceToolWorkspaceService } from 'src/modules/commercial-intelligence/tools/services/commercial-intelligence-tool.workspace-service';

@Module({
  imports: [TwentyORMModule],
  providers: [CommercialIntelligenceToolWorkspaceService],
  exports: [CommercialIntelligenceToolWorkspaceService],
})
export class CommercialIntelligenceModule {}
