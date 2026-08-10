import { Global, Module } from '@nestjs/common';

import { DiexConfigModule } from 'src/engine/core-modules/diex-config/diex-config.module';
import { WorkspaceApprovalGateService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-gate.service';

// Kept separate from WorkspaceApprovalModule, and importing nothing but the
// config module, so that WorkspaceAuthGuard can inject the gate from any module
// context without dragging in WorkspaceModule and creating an import cycle.
@Global()
@Module({
  imports: [DiexConfigModule],
  providers: [WorkspaceApprovalGateService],
  exports: [WorkspaceApprovalGateService],
})
export class WorkspaceApprovalGateModule {}
