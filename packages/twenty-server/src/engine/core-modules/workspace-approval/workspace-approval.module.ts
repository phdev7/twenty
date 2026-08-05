import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WORKSPACE_APPROVAL_TOOL_SERVICE_TOKEN } from 'src/engine/core-modules/tool-provider/constants/workspace-approval-tool-service.token';
import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceApprovalGateModule } from 'src/engine/core-modules/workspace-approval/workspace-approval-gate.module';
import { WorkspaceApprovalToolService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-tool.service';
import { WorkspaceApprovalService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval.service';
import { WorkspaceApprovalResolver } from 'src/engine/core-modules/workspace-approval/workspace-approval.resolver';
import { WorkspaceModule } from 'src/engine/core-modules/workspace/workspace.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

// Global so the approval guard (REST, MCP), the GraphQL middleware and
// ToolProviderModule can all reach the service without importing this module:
// it pulls in WorkspaceModule, which transitively reaches ToolProviderModule.
@Global()
@Module({
  imports: [
    TwentyConfigModule,
    WorkspaceApprovalGateModule,
    WorkspaceModule,
    TypeOrmModule.forFeature([
      WorkspaceEntity,
      UserEntity,
      UserWorkspaceEntity,
    ]),
  ],
  providers: [
    WorkspaceApprovalService,
    WorkspaceApprovalToolService,
    WorkspaceApprovalResolver,
    {
      provide: WORKSPACE_APPROVAL_TOOL_SERVICE_TOKEN,
      useExisting: WorkspaceApprovalToolService,
    },
  ],
  exports: [
    WorkspaceApprovalService,
    WorkspaceApprovalToolService,
    WORKSPACE_APPROVAL_TOOL_SERVICE_TOKEN,
  ],
})
export class WorkspaceApprovalModule {}
