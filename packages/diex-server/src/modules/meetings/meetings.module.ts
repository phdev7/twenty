import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { DiexORMModule } from 'src/engine/diex-orm/diex-orm.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { MeetingsController } from 'src/modules/meetings/controllers/meetings.controller';
import { MeetingTranscriptService } from 'src/modules/meetings/services/meeting-transcript.service';
import { MeetingsToolWorkspaceService } from 'src/modules/meetings/tools/services/meetings-tool.workspace-service';

@Module({
  imports: [AuthModule, DiexORMModule, WorkspaceCacheStorageModule],
  controllers: [MeetingsController],
  providers: [MeetingTranscriptService, MeetingsToolWorkspaceService],
  exports: [MeetingTranscriptService, MeetingsToolWorkspaceService],
})
export class MeetingsModule {}
