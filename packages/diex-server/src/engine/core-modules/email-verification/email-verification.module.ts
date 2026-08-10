import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppTokenEntity } from 'src/engine/core-modules/app-token/app-token.entity';
import { EmailVerificationTokenService } from 'src/engine/core-modules/auth/token/services/email-verification-token.service';
import { DomainServerConfigModule } from 'src/engine/core-modules/domain/domain-server-config/domain-server-config.module';
import { WorkspaceDomainsModule } from 'src/engine/core-modules/domain/workspace-domains/workspace-domains.module';
import { EmailVerificationResolver } from 'src/engine/core-modules/email-verification/email-verification.resolver';
import { EmailVerificationService } from 'src/engine/core-modules/email-verification/services/email-verification.service';
import { EmailModule } from 'src/engine/core-modules/email/email.module';
import { DiexConfigModule } from 'src/engine/core-modules/diex-config/diex-config.module';
import { UserWorkspaceModule } from 'src/engine/core-modules/user-workspace/user-workspace.module';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppTokenEntity, UserEntity]),
    EmailModule,
    DiexConfigModule,
    UserWorkspaceModule,
    WorkspaceDomainsModule,
    DomainServerConfigModule,
  ],
  providers: [
    EmailVerificationService,
    EmailVerificationResolver,
    EmailVerificationTokenService,
  ],
  exports: [EmailVerificationService, EmailVerificationTokenService],
})
export class EmailVerificationModule {}
