import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { EVOLUTION_MEDIA_MAX_BASE64_BYTES } from 'src/modules/inbox/constants/inbox-evolution.constants';
import { EvolutionMediaService } from 'src/modules/inbox/services/evolution-media.service';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';

type EvolutionMediaResult = {
  inboxMessageId: string;
  mimeType: string;
  fileName: string | null;
  dataUri: string;
};

// Media is fetched from the provider when an operator asks to see it and is
// never written to disk. The provider already holds the durable copy.
@Controller('rest/inbox/messages')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class EvolutionMediaController {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly evolutionMediaService: EvolutionMediaService,
  ) {}

  @UseGuards(NoPermissionGuard)
  @Get(':messageId/evolution-media')
  async getMedia(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('messageId') messageId: string,
  ): Promise<EvolutionMediaResult> {
    const authContext = buildSystemAuthContext(workspace.id);
    const message =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const messageRepository =
            await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
              workspace.id,
              InboxMessageWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            );

          return messageRepository.findOne({ where: { id: messageId } });
        },
        authContext,
      );

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada nesta workspace.');
    }

    const media = await this.evolutionMediaService.fetchMediaBase64({
      workspaceId: workspace.id,
      providerMessageKey: message.providerMessageKey,
    });

    if (!media) {
      throw new Error(
        'O provedor não devolveu mídia para esta mensagem. Veja pelo WhatsApp do número comercial.',
      );
    }

    if (media.base64.length > EVOLUTION_MEDIA_MAX_BASE64_BYTES) {
      throw new Error(
        'Mídia grande demais para abrir aqui. Veja pelo WhatsApp do número comercial.',
      );
    }

    return {
      inboxMessageId: message.id,
      mimeType: media.mimeType,
      fileName: media.fileName,
      dataUri: `data:${media.mimeType};base64,${media.base64}`,
    };
  }
}
