import { Controller, Post, UseGuards } from '@nestjs/common';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EvolutionSyncService } from 'src/modules/inbox/services/evolution-sync.service';
import { type SyncEvolutionMessagesResult } from 'src/modules/inbox/types/inbox-evolution.types';

@Controller('rest/inbox/evolution/sync')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class EvolutionSyncController {
  constructor(private readonly evolutionSyncService: EvolutionSyncService) {}

  // Reconcilia o inbox do próprio workspace autenticado, sem receber alvo do
  // cliente. É manutenção de rotina do operador, aberta a qualquer membro.
  @Post()
  @UseGuards(NoPermissionGuard)
  async sync(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SyncEvolutionMessagesResult> {
    return this.evolutionSyncService.syncWorkspace(workspace.id);
  }
}
