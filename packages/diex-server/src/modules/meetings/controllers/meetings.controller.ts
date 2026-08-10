import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { MeetingTranscriptService } from 'src/modules/meetings/services/meeting-transcript.service';

@Controller('rest/diex/meetings')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class MeetingsController {
  constructor(
    private readonly meetingTranscriptService: MeetingTranscriptService,
  ) {}

  @Post('transcripts')
  async register(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() body: Record<string, unknown>,
  ) {
    return this.meetingTranscriptService.register({
      workspaceId: workspace.id,
      transcript:
        typeof body?.transcript === 'string' ? body.transcript : undefined,
      title: typeof body?.title === 'string' ? body.title : undefined,
      meetingAt:
        typeof body?.meetingAt === 'string' ? body.meetingAt : undefined,
      companyId:
        typeof body?.companyId === 'string' ? body.companyId : undefined,
      personId: typeof body?.personId === 'string' ? body.personId : undefined,
      opportunityId:
        typeof body?.opportunityId === 'string'
          ? body.opportunityId
          : undefined,
      companySearch:
        typeof body?.companySearch === 'string'
          ? body.companySearch
          : undefined,
      participants:
        typeof body?.participants === 'string' ? body.participants : undefined,
    });
  }
}
