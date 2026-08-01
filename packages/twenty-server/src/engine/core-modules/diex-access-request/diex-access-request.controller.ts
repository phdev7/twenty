import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { type Request } from 'express';

import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { DiexAccessRequestService } from 'src/engine/core-modules/diex-access-request/services/diex-access-request.service';
import { type DiexPublicAccessRequestInput } from 'src/engine/core-modules/diex-access-request/types/diex-access-request.types';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { getRequestBaseUrl } from 'src/utils/get-request-base-url.util';

@Controller('diex/access-requests')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class DiexAccessRequestController {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    private readonly diexAccessRequestService: DiexAccessRequestService,
  ) {}

  private readPublicOrigin(request: Request): string {
    const origin = request.get('origin');

    if (origin) {
      return origin;
    }

    const referer = request.get('referer');

    if (referer) {
      try {
        return new URL(referer).origin;
      } catch {
        // Fall back to the API request origin below.
      }
    }

    return getRequestBaseUrl(request);
  }

  private async getPublicWorkspaceIdOrThrow(request: Request): Promise<string> {
    if (!this.twentyConfigService.get('ACCESS_REQUEST_INBOX_ENABLED')) {
      throw new NotFoundException();
    }

    const configuredWorkspaceId = this.twentyConfigService
      .get('ACCESS_REQUEST_INBOX_WORKSPACE_ID')
      .trim();

    if (!configuredWorkspaceId) {
      throw new NotFoundException();
    }

    const workspace =
      await this.workspaceDomainsService.getWorkspaceByOriginOrDefaultWorkspace(
        this.readPublicOrigin(request),
      );

    if (workspace?.id !== configuredWorkspaceId) {
      throw new NotFoundException();
    }

    return workspace.id;
  }

  @Get()
  async getAvailability(@Req() request: Request) {
    await this.getPublicWorkspaceIdOrThrow(request);

    return { enabled: true };
  }

  @Post()
  @HttpCode(200)
  async submit(
    @Req() request: Request,
    @Body() body: unknown,
  ) {
    const workspaceId = await this.getPublicWorkspaceIdOrThrow(request);
    const input =
      typeof body === 'object' && body !== null
        ? (body as DiexPublicAccessRequestInput)
        : {};

    return this.diexAccessRequestService.submitPublicRequest(
      workspaceId,
      input,
    );
  }
}
