import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { InboxPersonConversationService } from 'src/modules/inbox/services/inbox-person-conversation.service';
import { createOpenWhatsappConversationTool } from 'src/modules/inbox/tools/open-whatsapp-conversation.tool';

@Injectable()
export class InboxToolWorkspaceService {
  constructor(
    private readonly inboxPersonConversationService: InboxPersonConversationService,
  ) {}

  generateInboxTools(workspaceId: string): ToolSet {
    const tool = createOpenWhatsappConversationTool(
      this.inboxPersonConversationService,
      workspaceId,
    );

    return { [tool.name]: tool };
  }
}
