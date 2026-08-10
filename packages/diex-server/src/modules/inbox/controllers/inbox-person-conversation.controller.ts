import { Controller, Param, Post, UseGuards } from '@nestjs/common';

import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import {
  InboxPersonConversationService,
  type ResolvedPersonConversation,
} from 'src/modules/inbox/services/inbox-person-conversation.service';

@Controller('rest/inbox/people')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class InboxPersonConversationController {
  constructor(
    private readonly inboxPersonConversationService: InboxPersonConversationService,
  ) {}

  // Opening a thread is the same privilege an operator already has inside the
  // inbox, so no extra flag is required. It is marked explicitly because the
  // service runs under a system auth context: object-level permissions do not
  // apply once inside, and the endpoint deliberately returns only an id.
  @UseGuards(NoPermissionGuard)
  @Post(':personId/whatsapp-conversation')
  async openWhatsappConversation(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('personId') personId: string,
  ): Promise<ResolvedPersonConversation> {
    return this.inboxPersonConversationService.resolveConversationForPerson({
      workspaceId: workspace.id,
      personId,
    });
  }
}
