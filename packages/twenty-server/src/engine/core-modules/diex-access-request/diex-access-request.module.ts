import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { CacheLockModule } from 'src/engine/core-modules/cache-lock/cache-lock.module';
import { SubdomainManagerModule } from 'src/engine/core-modules/domain/subdomain-manager/subdomain-manager.module';
import { WorkspaceDomainsModule } from 'src/engine/core-modules/domain/workspace-domains/workspace-domains.module';
import { DiexAccessRequestController } from 'src/engine/core-modules/diex-access-request/diex-access-request.controller';
import { DiexAccessRequestResolver } from 'src/engine/core-modules/diex-access-request/diex-access-request.resolver';
import { DiexAccessRequestService } from 'src/engine/core-modules/diex-access-request/services/diex-access-request.service';
import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { UserModule } from 'src/engine/core-modules/user/user.module';
import { WorkspaceInvitationModule } from 'src/engine/core-modules/workspace-invitation/workspace-invitation.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';

@Module({
  imports: [
    AuthModule,
    CacheLockModule,
    UserModule,
    WorkspaceInvitationModule,
    SubdomainManagerModule,
    WorkspaceDomainsModule,
    TwentyConfigModule,
    PermissionsModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
  ],
  controllers: [DiexAccessRequestController],
  providers: [DiexAccessRequestService, DiexAccessRequestResolver],
})
export class DiexAccessRequestModule {}
