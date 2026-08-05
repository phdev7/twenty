import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AiAgentExecutionModule } from 'src/engine/metadata-modules/ai/ai-agent-execution/ai-agent-execution.module';
import { AgentEntity } from 'src/engine/metadata-modules/ai/ai-agent/entities/agent.entity';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { EvolutionConfigureController } from 'src/modules/inbox/controllers/evolution-configure.controller';
import { EvolutionConnectionController } from 'src/modules/inbox/controllers/evolution-connection.controller';
import { EvolutionMediaController } from 'src/modules/inbox/controllers/evolution-media.controller';
import { EvolutionSendTextController } from 'src/modules/inbox/controllers/evolution-send-text.controller';
import { InboxPersonConversationController } from 'src/modules/inbox/controllers/inbox-person-conversation.controller';
import { InboxPersonConversationService } from 'src/modules/inbox/services/inbox-person-conversation.service';
import { InboxToolWorkspaceService } from 'src/modules/inbox/tools/services/inbox-tool.workspace-service';
import { EvolutionSyncController } from 'src/modules/inbox/controllers/evolution-sync.controller';
import { EvolutionWebhookController } from 'src/modules/inbox/controllers/evolution-webhook.controller';
import { InboxAutomationEvaluationController } from 'src/modules/inbox/controllers/inbox-automation-evaluation.controller';
import { InboxTriageController } from 'src/modules/inbox/controllers/inbox-triage.controller';
import { InboxAudioTranscriptionJob } from 'src/modules/inbox/jobs/inbox-audio-transcription.job';
import { InboxAutomationEvaluationJob } from 'src/modules/inbox/jobs/inbox-automation-evaluation.job';
import { InboxEvolutionSyncJob } from 'src/modules/inbox/jobs/inbox-evolution-sync.job';
import { InboxSlaBreachJob } from 'src/modules/inbox/jobs/inbox-sla-breach.job';
import { InboxMaintenanceCronCommand } from 'src/modules/inbox/crons/commands/inbox-maintenance.cron.command';
import { InboxMaintenanceCronJob } from 'src/modules/inbox/crons/jobs/inbox-maintenance.cron.job';
import { InboxAutomationEngineService } from 'src/modules/inbox/services/inbox-automation-engine.service';
import { InboxAutomationEvaluationService } from 'src/modules/inbox/services/inbox-automation-evaluation.service';
import { EvolutionHttpService } from 'src/modules/inbox/services/evolution-http.service';
import { EvolutionIngestionService } from 'src/modules/inbox/services/evolution-ingestion.service';
import { EvolutionMediaService } from 'src/modules/inbox/services/evolution-media.service';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { EvolutionSendTextService } from 'src/modules/inbox/services/evolution-send-text.service';
import { EvolutionSyncService } from 'src/modules/inbox/services/evolution-sync.service';
import { InboxAudioTranscriptionRunnerService } from 'src/modules/inbox/services/inbox-audio-transcription-runner.service';
import { InboxSlaBreachService } from 'src/modules/inbox/services/inbox-sla-breach.service';
import { InboxTranscriptionService } from 'src/modules/inbox/services/inbox-transcription.service';
import { InboxTriageService } from 'src/modules/inbox/services/inbox-triage.service';

@Module({
  imports: [
    AuthModule,
    KeyValuePairModule,
    forwardRef(() => AiAgentExecutionModule),
    PermissionsModule,
    TypeOrmModule.forFeature([WorkspaceEntity, AgentEntity]),
    WorkspaceCacheStorageModule,
  ],
  controllers: [
    EvolutionConfigureController,
    EvolutionConnectionController,
    EvolutionMediaController,
    EvolutionSendTextController,
    EvolutionSyncController,
    EvolutionWebhookController,
    InboxAutomationEvaluationController,
    InboxPersonConversationController,
    InboxTriageController,
  ],
  providers: [
    EvolutionHttpService,
    EvolutionIngestionService,
    EvolutionMediaService,
    EvolutionProvisioningService,
    EvolutionSendTextService,
    EvolutionSyncService,
    InboxAudioTranscriptionRunnerService,
    InboxAutomationEngineService,
    InboxAutomationEvaluationService,
    InboxPersonConversationService,
    InboxSlaBreachService,
    InboxToolWorkspaceService,
    InboxTranscriptionService,
    InboxTriageService,
    InboxAudioTranscriptionJob,
    InboxAutomationEvaluationJob,
    InboxEvolutionSyncJob,
    InboxSlaBreachJob,
    InboxMaintenanceCronCommand,
    InboxMaintenanceCronJob,
    provideWorkspaceScopedRepository(AgentEntity),
  ],
  exports: [
    EvolutionIngestionService,
    InboxAutomationEngineService,
    InboxAutomationEvaluationService,
    InboxMaintenanceCronCommand,
    InboxPersonConversationService,
    InboxToolWorkspaceService,
  ],
})
export class InboxModule {}
