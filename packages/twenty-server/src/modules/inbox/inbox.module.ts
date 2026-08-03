import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { EvolutionConfigureController } from 'src/modules/inbox/controllers/evolution-configure.controller';
import { EvolutionConnectionController } from 'src/modules/inbox/controllers/evolution-connection.controller';
import { EvolutionMediaController } from 'src/modules/inbox/controllers/evolution-media.controller';
import { EvolutionSendTextController } from 'src/modules/inbox/controllers/evolution-send-text.controller';
import { EvolutionWebhookController } from 'src/modules/inbox/controllers/evolution-webhook.controller';
import { InboxAutomationEvaluationController } from 'src/modules/inbox/controllers/inbox-automation-evaluation.controller';
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

@Module({
  imports: [
    KeyValuePairModule,
    PermissionsModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
  ],
  controllers: [
    EvolutionConfigureController,
    EvolutionConnectionController,
    EvolutionMediaController,
    EvolutionSendTextController,
    EvolutionWebhookController,
    InboxAutomationEvaluationController,
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
    InboxSlaBreachService,
    InboxTranscriptionService,
    InboxAudioTranscriptionJob,
    InboxAutomationEvaluationJob,
    InboxEvolutionSyncJob,
    InboxSlaBreachJob,
    InboxMaintenanceCronCommand,
    InboxMaintenanceCronJob,
  ],
  exports: [
    EvolutionIngestionService,
    InboxAutomationEngineService,
    InboxAutomationEvaluationService,
  ],
})
export class InboxModule {}
