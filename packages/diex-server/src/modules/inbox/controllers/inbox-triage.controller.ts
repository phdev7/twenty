import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import {
  InboxTriageService,
  type InboxTriageResult,
} from 'src/modules/inbox/services/inbox-triage.service';

type InboxTriageBody = {
  conversationId?: unknown;
  registerSignal?: unknown;
  proposeReply?: unknown;
};

@Controller('rest/inbox/conversations')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class InboxTriageController {
  constructor(private readonly inboxTriageService: InboxTriageService) {}

  // Triar a conversa que chegou é rotina do atendente, aberta a qualquer membro
  // do workspace.
  @Post('triage')
  @UseGuards(NoPermissionGuard)
  async triage(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @Body() body: InboxTriageBody,
  ): Promise<InboxTriageResult> {
    const conversationId =
      typeof body?.conversationId === 'string' ? body.conversationId : '';

    return this.inboxTriageService.triage({
      workspaceId: workspace.id,
      conversationId,
      registerSignal: body?.registerSignal === true,
      proposeReply: body?.proposeReply === true,
      userWorkspaceId,
    });
  }
}
