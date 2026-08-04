import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { AiGovernanceController } from 'src/modules/ai-governance/controllers/ai-governance.controller';
import { AiGovernanceService } from 'src/modules/ai-governance/services/ai-governance.service';
import { AiGovernanceToolWorkspaceService } from 'src/modules/ai-governance/tools/services/ai-governance-tool.workspace-service';

@Module({
  imports: [AuthModule, TwentyORMModule],
  controllers: [AiGovernanceController],
  providers: [AiGovernanceService, AiGovernanceToolWorkspaceService],
  exports: [AiGovernanceService, AiGovernanceToolWorkspaceService],
})
export class AiGovernanceModule {}
