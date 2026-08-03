import { Controller, Post, UseGuards } from '@nestjs/common';

import { PermissionFlagType } from 'twenty-shared/constants';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { type WhatsappConnectionResult } from 'src/modules/inbox/types/inbox-evolution.types';

// Deliberately no MCP/tool exposure here: the QR is a live credential and must
// only ever be rendered on the authenticated settings page.
@Controller('rest/inbox/evolution/connection')
@UseGuards(
  JwtAuthGuard,
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.APPLICATIONS),
)
export class EvolutionConnectionController {
  constructor(
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
  ) {}

  @Post()
  async getConnection(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<WhatsappConnectionResult> {
    return this.evolutionProvisioningService.resolveConnection(workspace.id);
  }
}
