import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EvolutionSendTextService } from 'src/modules/inbox/services/evolution-send-text.service';
import { type SendEvolutionTextResult } from 'src/modules/inbox/types/inbox-evolution.types';

type SendTextBody = {
  text?: unknown;
  previewOnly?: unknown;
  confirmSend?: unknown;
  confirmationToken?: unknown;
};

@Controller('rest/inbox/conversations')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class EvolutionSendTextController {
  constructor(
    private readonly evolutionSendTextService: EvolutionSendTextService,
  ) {}

  @Post(':conversationId/evolution-messages')
  async sendText(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: SendTextBody,
  ): Promise<SendEvolutionTextResult> {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';

    return this.evolutionSendTextService.sendText({
      workspaceId: workspace.id,
      workspaceMemberId,
      conversationId,
      text,
      previewOnly: body?.previewOnly !== false,
      confirmSend: body?.confirmSend === true,
      confirmationToken:
        typeof body?.confirmationToken === 'string'
          ? body.confirmationToken
          : undefined,
    });
  }
}
