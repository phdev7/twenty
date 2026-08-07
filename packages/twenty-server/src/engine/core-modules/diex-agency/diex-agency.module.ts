import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/engine/core-modules/auth/auth.module';

import { DiexAgencyEntity } from 'src/engine/core-modules/diex-agency/diex-agency.entity';
import { DiexAgencyMetricDefinitionEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-definition.entity';
import { DiexAgencyMetricEntryEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-entry.entity';
import { DiexMetaAdsAccountEntity } from 'src/engine/core-modules/diex-agency/entities/diex-meta-ads-account.entity';
import { DiexAgencyResolver } from 'src/engine/core-modules/diex-agency/diex-agency.resolver';
import { DiexAgencyTrafficResolver } from 'src/engine/core-modules/diex-agency/diex-agency-traffic.resolver';
import { DiexAgencyAiResolver } from 'src/engine/core-modules/diex-agency/diex-agency-ai.resolver';
import { DiexAgencyService } from 'src/engine/core-modules/diex-agency/services/diex-agency.service';
import { DiexAgencyTrafficService } from 'src/engine/core-modules/diex-agency/services/diex-agency-traffic.service';
import { DiexAiContextScopeService } from 'src/engine/core-modules/diex-agency/services/diex-ai-context-scope.service';
import { DiexAgencyAiCopilotService } from 'src/engine/core-modules/diex-agency/services/diex-agency-ai-copilot.service';
import { DiexAgencyCascadeSuspensionGuard } from 'src/engine/core-modules/diex-agency/guards/diex-agency-cascade-suspension.guard';
import { DiexAgencySubscriber } from 'src/engine/core-modules/diex-agency/subscribers/diex-agency.subscriber';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      DiexAgencyEntity,
      DiexAgencyMetricDefinitionEntity,
      DiexAgencyMetricEntryEntity,
      DiexMetaAdsAccountEntity,
      UserEntity,
      UserWorkspaceEntity,
      WorkspaceEntity,
    ]),
  ],
  providers: [
    DiexAgencyService,
    DiexAgencyResolver,
    DiexAgencyTrafficService,
    DiexAgencyTrafficResolver,
    DiexAiContextScopeService,
    DiexAgencyAiCopilotService,
    DiexAgencyAiResolver,
    {
      provide: APP_GUARD,
      useClass: DiexAgencyCascadeSuspensionGuard,
    },
    DiexAgencySubscriber,
  ],
  exports: [
    DiexAgencyService,
    DiexAgencyTrafficService,
    DiexAiContextScopeService,
    DiexAgencyAiCopilotService,
  ],
})
export class DiexAgencyModule {}
