import { Module } from '@nestjs/common';

import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { MeetingsController } from 'src/modules/meetings/controllers/meetings.controller';
import { MeetingTranscriptService } from 'src/modules/meetings/services/meeting-transcript.service';
import { MeetingsToolWorkspaceService } from 'src/modules/meetings/tools/services/meetings-tool.workspace-service';

@Module({
  imports: [TwentyORMModule],
  controllers: [MeetingsController],
  providers: [MeetingTranscriptService, MeetingsToolWorkspaceService],
  exports: [MeetingTranscriptService, MeetingsToolWorkspaceService],
})
export class MeetingsModule {}
