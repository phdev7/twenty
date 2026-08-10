import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillingModule } from 'src/engine/core-modules/billing/billing.module';
import { WorkspaceApprovalGateModule } from 'src/engine/core-modules/workspace-approval/workspace-approval-gate.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AiBillingService } from 'src/engine/metadata-modules/ai/ai-billing/services/ai-billing.service';
import { AiModelsModule } from 'src/engine/metadata-modules/ai/ai-models/ai-models.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceEventEmitterModule } from 'src/engine/workspace-event-emitter/workspace-event-emitter.module';

@Module({
  imports: [
    WorkspaceEventEmitterModule,
    AiModelsModule,
    BillingModule,
    WorkspaceCacheModule,
    WorkspaceApprovalGateModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
  ],
  providers: [AiBillingService],
  exports: [AiBillingService],
})
export class AiBillingModule {}
