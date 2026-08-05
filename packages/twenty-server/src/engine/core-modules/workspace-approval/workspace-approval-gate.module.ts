import { Global, Module } from '@nestjs/common';

import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { WorkspaceApprovalGateService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-gate.service';

// Kept separate from WorkspaceApprovalModule, and importing nothing but the
// config module, so that WorkspaceAuthGuard can inject the gate from any module
// context without dragging in WorkspaceModule and creating an import cycle.
@Global()
@Module({
  imports: [TwentyConfigModule],
  providers: [WorkspaceApprovalGateService],
  exports: [WorkspaceApprovalGateService],
})
export class WorkspaceApprovalGateModule {}
