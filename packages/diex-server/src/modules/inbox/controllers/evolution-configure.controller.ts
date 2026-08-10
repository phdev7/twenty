import { Controller, Post, UseGuards } from '@nestjs/common';

import { PermissionFlagType } from 'diex-shared/constants';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { type EvolutionWebhookRegistration } from 'src/modules/inbox/types/inbox-evolution.types';

@Controller('rest/inbox/evolution')
@UseGuards(
  JwtAuthGuard,
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.APPLICATIONS),
)
export class EvolutionConfigureController {
  constructor(
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
  ) {}

  @Post('configure')
  async configure(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<EvolutionWebhookRegistration> {
    const configuration =
      await this.evolutionProvisioningService.resolveProvisioning(workspace.id);

    return this.evolutionProvisioningService.registerWebhook({
      workspaceId: workspace.id,
      configuration,
    });
  }
}
