import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { MeetingTranscriptService } from 'src/modules/meetings/services/meeting-transcript.service';
import { createRegisterMeetingTranscriptTool } from 'src/modules/meetings/tools/register-meeting-transcript.tool';

@Injectable()
export class MeetingsToolWorkspaceService {
  constructor(
    private readonly meetingTranscriptService: MeetingTranscriptService,
  ) {}

  generateMeetingTools(workspaceId: string): ToolSet {
    const tool = createRegisterMeetingTranscriptTool(
      this.meetingTranscriptService,
      workspaceId,
    );

    return { [tool.name]: tool };
  }
}
