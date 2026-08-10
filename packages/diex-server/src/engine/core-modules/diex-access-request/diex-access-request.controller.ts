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
import { InjectRepository } from '@nestjs/typeorm';

import { type Request } from 'express';
import { isValidUuid } from 'diex-shared/utils';
import { type Repository } from 'typeorm';

import { DiexAccessRequestService } from 'src/engine/core-modules/diex-access-request/services/diex-access-request.service';
import { type DiexPublicAccessRequestInput } from 'src/engine/core-modules/diex-access-request/types/diex-access-request.types';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { getRequestBaseUrl } from 'src/utils/get-request-base-url.util';

@Controller('diex/access-requests')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class DiexAccessRequestController {
  constructor(
    private readonly diexConfigService: DiexConfigService,
    private readonly diexAccessRequestService: DiexAccessRequestService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  private parseOrigin(value: string): string | null {
    try {
      const parsed = new URL(value);

      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return null;
      }

      return parsed.origin;
    } catch {
      return null;
    }
  }

  private readConfiguredPublicOrigin(): string | null {
    const configuredOrigin = this.diexConfigService
      .get('ACCESS_REQUEST_INBOX_PUBLIC_ORIGIN')
      .trim();
    const parsedOrigin = this.parseOrigin(configuredOrigin);

    // An origin is deliberately stricter than a URL: no path, query, hash,
    // credentials or trailing slash can be silently discarded here.
    return parsedOrigin === configuredOrigin ? configuredOrigin : null;
  }

  private async getPublicWorkspaceIdOrThrow(request: Request): Promise<string> {
    if (!this.diexConfigService.get('ACCESS_REQUEST_INBOX_ENABLED')) {
      throw new NotFoundException();
    }

    const configuredWorkspaceId = this.diexConfigService
      .get('ACCESS_REQUEST_INBOX_WORKSPACE_ID')
      .trim();
    const configuredPublicOrigin = this.readConfiguredPublicOrigin();
    const receivedPublicOrigin = this.parseOrigin(getRequestBaseUrl(request));
    const originHeader = request.get('origin');
    const refererHeader = request.get('referer');

    if (
      !isValidUuid(configuredWorkspaceId) ||
      !configuredPublicOrigin ||
      receivedPublicOrigin !== configuredPublicOrigin ||
      (originHeader !== undefined &&
        this.parseOrigin(originHeader) !== configuredPublicOrigin) ||
      (refererHeader !== undefined &&
        this.parseOrigin(refererHeader) !== configuredPublicOrigin)
    ) {
      throw new NotFoundException();
    }

    const workspaceExists = await this.workspaceRepository.existsBy({
      id: configuredWorkspaceId,
    });

    if (!workspaceExists) {
      throw new NotFoundException();
    }

    return configuredWorkspaceId;
  }

  @Get()
  async getAvailability(@Req() request: Request) {
    await this.getPublicWorkspaceIdOrThrow(request);

    return { enabled: true };
  }

  @Post()
  @HttpCode(200)
  async submit(@Req() request: Request, @Body() body: unknown) {
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
