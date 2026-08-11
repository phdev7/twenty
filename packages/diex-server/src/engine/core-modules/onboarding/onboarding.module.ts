import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { BillingModule } from 'src/engine/core-modules/billing/billing.module';
import { CacheLockModule } from 'src/engine/core-modules/cache-lock/cache-lock.module';
import { OnboardingController } from 'src/engine/core-modules/onboarding/onboarding.controller';
import { OnboardingResolver } from 'src/engine/core-modules/onboarding/onboarding.resolver';
import { OnboardingService } from 'src/engine/core-modules/onboarding/onboarding.service';
import { UserVarsModule } from 'src/engine/core-modules/user/user-vars/user-vars.module';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AiBillingModule } from 'src/engine/metadata-modules/ai/ai-billing/ai-billing.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { OnboardingInviteSuggestionsModule } from 'src/modules/onboarding-invite-suggestions/onboarding-invite-suggestions.module';
import { WorkspaceArchitectureModule } from 'src/modules/workspace-architecture/workspace-architecture.module';

@Module({
  imports: [
    TokenModule,
    BillingModule,
    CacheLockModule,
    AiBillingModule,
    WorkspaceCacheStorageModule,
    UserVarsModule,
    OnboardingInviteSuggestionsModule,
    WorkspaceArchitectureModule,
    // OnboardingController protege rotas com SettingsPermissionGuard, que é um
    // mixin injetando PermissionsService e é instanciado no contexto deste
    // módulo. Sem este import a aplicação inteira falha no bootstrap, não só a
    // rota protegida.
    PermissionsModule,
    TypeOrmModule.forFeature([WorkspaceEntity, UserWorkspaceEntity]),
  ],
  exports: [OnboardingService],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingResolver],
})
export class OnboardingModule {}
