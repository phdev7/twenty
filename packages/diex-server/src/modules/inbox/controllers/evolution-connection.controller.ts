import { Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';

import { PermissionFlagType } from 'diex-shared/constants';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { type WhatsappConnectionResult } from 'src/modules/inbox/types/inbox-evolution.types';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';

// Deliberately no MCP/tool exposure here: the QR is a live credential and must
// only ever be rendered inside authenticated workspace surfaces.
@Controller('rest/inbox/evolution/connection')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class EvolutionConnectionController {
  private readonly logger = new Logger(EvolutionConnectionController.name);

  constructor(
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
  ) {}

  // Aberto a qualquer membro do workspace: o inbox e o onboarding precisam do
  // estado da conexão. Só devolve diagnóstico, nunca o QR, que é credencial viva
  // e sai apenas pelo POST abaixo, protegido por permissão.
  @Get()
  @UseGuards(NoPermissionGuard)
  async inspectConnection(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<WhatsappConnectionResult> {
    const result = await this.evolutionProvisioningService.inspectConnection(
      workspace.id,
    );
    let validatedAt: string | null = null;

    try {
      const evidence =
        await this.workspaceArchitectureService.recordWhatsappChannelHealth({
          workspaceId: workspace.id,
          state: result.state,
          instanceName: result.instanceName,
          message: result.message,
        });

      validatedAt = evidence.channel.validatedAt;
    } catch (error) {
      this.logger.warn(
        `WhatsApp health could not be refreshed for workspace ${workspace.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    // Zerado aqui de propósito: a garantia de não vazar o QR nesta rota aberta
    // não pode depender do que o serviço devolver no futuro.
    return { ...result, qrCodeDataUri: null, validatedAt };
  }

  @Post()
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  async getConnection(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<WhatsappConnectionResult> {
    const result = await this.evolutionProvisioningService.resolveConnection(
      workspace.id,
    );
    let validatedAt: string | null = null;

    try {
      const evidence =
        await this.workspaceArchitectureService.recordWhatsappChannelHealth({
          workspaceId: workspace.id,
          state: result.state,
          instanceName: result.instanceName,
          message: result.message,
        });

      validatedAt = evidence.channel.validatedAt;
    } catch (error) {
      this.logger.warn(
        `WhatsApp health could not be recorded for workspace ${workspace.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    return { ...result, validatedAt };
  }
}
