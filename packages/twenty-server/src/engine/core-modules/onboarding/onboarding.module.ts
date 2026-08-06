import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillingModule } from 'src/engine/core-modules/billing/billing.module';
import { OnboardingController } from 'src/engine/core-modules/onboarding/onboarding.controller';
import { OnboardingResolver } from 'src/engine/core-modules/onboarding/onboarding.resolver';
import { OnboardingService } from 'src/engine/core-modules/onboarding/onboarding.service';
import { UserVarsModule } from 'src/engine/core-modules/user/user-vars/user-vars.module';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AiBillingModule } from 'src/engine/metadata-modules/ai/ai-billing/ai-billing.module';
import { OnboardingInviteSuggestionsModule } from 'src/modules/onboarding-invite-suggestions/onboarding-invite-suggestions.module';

@Module({
  imports: [
    BillingModule,
    AiBillingModule,
    UserVarsModule,
    OnboardingInviteSuggestionsModule,
    TypeOrmModule.forFeature([WorkspaceEntity, UserWorkspaceEntity]),
  ],
  exports: [OnboardingService],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingResolver],
})
export class OnboardingModule {}
