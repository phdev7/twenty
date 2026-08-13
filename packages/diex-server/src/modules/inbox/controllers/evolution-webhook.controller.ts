import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';

import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { EVOLUTION_WEBHOOK_SECRET_HEADER } from 'src/modules/inbox/constants/inbox-evolution.constants';
import { EvolutionIngestionService } from 'src/modules/inbox/services/evolution-ingestion.service';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { extractEvolutionInstanceName } from 'src/modules/inbox/utils/evolution-payload.util';

const getHeaderValue = (
  headers: Record<string, string | string[] | undefined>,
  headerName: string,
): string | undefined => {
  const value = headers[headerName.toLowerCase()];

  return Array.isArray(value) ? value[0] : value;
};

const readWebhookSecret = (
  headers: Record<string, string | string[] | undefined>,
): string | undefined => {
  const explicitSecret =
    getHeaderValue(headers, EVOLUTION_WEBHOOK_SECRET_HEADER) ??
    getHeaderValue(headers, 'x-evolution-webhook-secret');

  if (explicitSecret) {
    return explicitSecret.trim();
  }

  const authorization = getHeaderValue(headers, 'authorization');

  return authorization?.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : undefined;
};

// The Evolution instance is provisioned per workspace and calls back here with
// no session of its own, so the workspace is resolved from the secret it
// presents rather than from any authenticated context. No self-call HTTP: this
// is the one entry point where the request truly comes from outside, and it
// hands straight off to the workspace ORM.
@Controller('rest/inbox/evolution')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class EvolutionWebhookController {
  private readonly logger = new Logger(EvolutionWebhookController.name);

  constructor(
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
    private readonly evolutionIngestionService: EvolutionIngestionService,
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async receiveWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
  ): Promise<{ received: boolean }> {
    const webhookSecret = readWebhookSecret(headers);
    const instanceName = extractEvolutionInstanceName(body);

    if (!body || !webhookSecret || webhookSecret.length < 24 || !instanceName) {
      throw new Error('Evolution webhook authorization was rejected.');
    }

    const workspaceId =
      await this.evolutionProvisioningService.resolveWorkspaceIdForWebhook({
        webhookSecret,
        instanceName,
      });

    if (!workspaceId) {
      throw new Error('Evolution webhook routing was rejected.');
    }

    const result = await this.evolutionIngestionService.processWebhookPayload({
      workspaceId,
      payload: body,
    });

    if (result.inboundMessages > 0) {
      try {
        await this.workspaceArchitectureService.recordWhatsappChannelHealth({
          workspaceId,
          state: 'CONNECTED',
          instanceName,
          message: 'Canal validado por mensagem real recebida no webhook.',
          validatedByRealMessage: true,
        });
      } catch (error) {
        this.logger.error(
          `WhatsApp validation could not be recorded for workspace ${workspaceId}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
        throw error;
      }
    }

    return { received: true };
  }
}
