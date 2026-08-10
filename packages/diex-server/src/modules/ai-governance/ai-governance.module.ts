import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { WorkspaceArchitectureModule } from 'src/modules/workspace-architecture/workspace-architecture.module';
import { InboxModule } from 'src/modules/inbox/inbox.module';
import { AiGovernanceController } from 'src/modules/ai-governance/controllers/ai-governance.controller';
import { AiGovernanceService } from 'src/modules/ai-governance/services/ai-governance.service';
import { AiGovernanceToolWorkspaceService } from 'src/modules/ai-governance/tools/services/ai-governance-tool.workspace-service';

@Module({
  imports: [
    AuthModule,
    DiexORMModule,
    WorkspaceCacheStorageModule,
    WorkspaceArchitectureModule,
    InboxModule,
    // AiGovernanceController guards a route with SettingsPermissionGuard, which
    // is a mixin injecting PermissionsService. The guard is instantiated in this
    // module's context, so the module needs the provider even though none of its
    // own services asks for it.
    PermissionsModule,
  ],
  controllers: [AiGovernanceController],
  providers: [AiGovernanceService, AiGovernanceToolWorkspaceService],
  exports: [AiGovernanceService, AiGovernanceToolWorkspaceService],
})
export class AiGovernanceModule {}
