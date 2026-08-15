import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { CustomerSuccessController } from 'src/modules/customer-success/controllers/customer-success.controller';
import { CustomerSuccessService } from 'src/modules/customer-success/services/customer-success.service';
import { CustomerSuccessToolWorkspaceService } from 'src/modules/customer-success/tools/services/customer-success-tool.workspace-service';
import { WorkspaceArchitectureModule } from 'src/modules/workspace-architecture/workspace-architecture.module';

@Module({
  imports: [
    AuthModule,
    DiexORMModule,
    WorkspaceCacheStorageModule,
    WorkspaceArchitectureModule,
    // CustomerSuccessController protege rotas com SettingsPermissionGuard, um
    // mixin que injeta PermissionsService no contexto deste módulo. Sem este
    // import a aplicação inteira falha no bootstrap.
    PermissionsModule,
  ],
  controllers: [CustomerSuccessController],
  providers: [CustomerSuccessService, CustomerSuccessToolWorkspaceService],
  exports: [CustomerSuccessService, CustomerSuccessToolWorkspaceService],
})
export class CustomerSuccessModule {}
