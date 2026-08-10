import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { SyncDiexAiBrandCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1786100000000-sync-diex-ai-brand.command';
import { SyncDiexAiActionGovernanceCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1786200000000-sync-diex-ai-action-governance.command';
import { SyncDiexOnboardingEvidenceCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1786300000000-sync-diex-onboarding-evidence.command';
import { SyncDiexAiActionPolicyCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1786400000000-sync-diex-ai-action-policy.command';
import { SyncDiexAiPolicyCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1786600000000-sync-diex-ai-policy.command';
import { SyncDiexPartialPublicationStatusCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1786700000000-sync-diex-partial-publication-status.command';
import { SyncDiexImportBatchCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1786800000000-sync-diex-import-batch.command';
import { AgentEntity } from 'src/engine/metadata-modules/ai/ai-agent/entities/agent.entity';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { SkillEntity } from 'src/engine/metadata-modules/skill/entities/skill.entity';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentEntity, SkillEntity]),
    WorkspaceIteratorModule,
    WorkspaceMigrationRunnerModule,
    ApplicationModule,
    WorkspaceCacheModule,
    WorkspaceMigrationModule,
    // SyncDiexAiActionGovernanceCommand and SyncDiexAiActionPolicyCommand call
    // fieldMetadataService.createManyFields. Without this the whole application
    // fails to bootstrap, not just the two commands.
    FieldMetadataModule,
  ],
  providers: [
    SyncDiexAiBrandCommand,
    SyncDiexAiActionGovernanceCommand,
    SyncDiexOnboardingEvidenceCommand,
    SyncDiexAiActionPolicyCommand,
    SyncDiexAiPolicyCommand,
    SyncDiexPartialPublicationStatusCommand,
    SyncDiexImportBatchCommand,
  ],
})
export class V2_26_UpgradeVersionCommandModule {}
