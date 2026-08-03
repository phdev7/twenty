import { Module } from '@nestjs/common';

import { AccessRequestModule } from 'src/modules/access-request/access-request.module';
import { AiGovernanceModule } from 'src/modules/ai-governance/ai-governance.module';
import { CalendarModule } from 'src/modules/calendar/calendar.module';
import { CommercialIntelligenceModule } from 'src/modules/commercial-intelligence/commercial-intelligence.module';
import { ConnectedAccountModule } from 'src/modules/connected-account/connected-account.module';
import { CustomerSuccessModule } from 'src/modules/customer-success/customer-success.module';
import { InboxModule } from 'src/modules/inbox/inbox.module';
import { MessagingModule } from 'src/modules/messaging/messaging.module';
import { MeetingsModule } from 'src/modules/meetings/meetings.module';
import { MigrationModule } from 'src/modules/migration/migration.module';
import { OnboardingInviteSuggestionsModule } from 'src/modules/onboarding-invite-suggestions/onboarding-invite-suggestions.module';
import { RenewalModule } from 'src/modules/renewal/renewal.module';
import { WorkflowModule } from 'src/modules/workflow/workflow.module';
import { WorkspaceMemberModule } from 'src/modules/workspace-member/workspace-member.module';
import { WorkspaceContextModule } from 'src/modules/workspace-context/workspace-context.module';

@Module({
  imports: [
    AccessRequestModule,
    AiGovernanceModule,
    MessagingModule,
    MeetingsModule,
    MigrationModule,
    CalendarModule,
    CommercialIntelligenceModule,
    ConnectedAccountModule,
    CustomerSuccessModule,
    InboxModule,
    OnboardingInviteSuggestionsModule,
    RenewalModule,
    WorkflowModule,
    WorkspaceMemberModule,
    WorkspaceContextModule,
  ],
  providers: [],
  exports: [],
})
export class ModulesModule {}
