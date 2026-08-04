import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { BackfillMessageListMembersJunctionTargetCommand } from 'src/database/commands/upgrade-version-command/2-25/2-25-workspace-command-1784567000000-backfill-message-list-members-junction-target.command';
import { ReparentDiexMetadataCommand } from 'src/database/commands/upgrade-version-command/2-25/2-25-workspace-command-1785000000000-reparent-diex-metadata.command';
import { SyncDiexBadgeFieldsCommand } from 'src/database/commands/upgrade-version-command/2-25/2-25-workspace-command-1785200000000-sync-diex-badge-fields.command';
import { AddWhatsappCommandMenuItemCommand } from 'src/database/commands/upgrade-version-command/2-25/2-25-workspace-command-1785300000000-add-whatsapp-command-menu-item.command';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { WorkspaceMetadataVersionModule } from 'src/engine/metadata-modules/workspace-metadata-version/workspace-metadata-version.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMetadataEntity]),
    WorkspaceCacheModule,
    WorkspaceMigrationRunnerModule,
    WorkspaceIteratorModule,
    WorkspaceMetadataVersionModule,
  ],
  providers: [
    BackfillMessageListMembersJunctionTargetCommand,
    ReparentDiexMetadataCommand,
    SyncDiexBadgeFieldsCommand,
    AddWhatsappCommandMenuItemCommand,
  ],
})
export class V2_25_UpgradeVersionCommandModule {}
