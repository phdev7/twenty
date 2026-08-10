/* @license Enterprise */

import { Controller, Post, Req, UseFilters, UseGuards } from '@nestjs/common';

import { Request } from 'express';

import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { CloudflareSecretMatchGuard } from 'src/engine/core-modules/cloudflare/guards/cloudflare-secret.guard';
import { DnsCloudflareService } from 'src/engine/core-modules/cloudflare/services/dns-cloudflare.service';
import { DnsManagerExceptionFilter } from 'src/engine/core-modules/dns-manager/exceptions/dns-manager-exception-filter';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller()
@UseFilters(AuthRestApiExceptionFilter, DnsManagerExceptionFilter)
export class DnsCloudflareController {
  constructor(
    protected readonly dnsCloudflareService: DnsCloudflareService,
    private readonly diexConfigService: DiexConfigService,
  ) {}

  @Post(['cloudflare/custom-hostname-webhooks', 'webhooks/cloudflare'])
  @UseGuards(CloudflareSecretMatchGuard, PublicEndpointGuard, NoPermissionGuard)
  async customHostnameWebhooks(@Req() req: Request) {
    const hostname = req.body?.data?.data?.hostname;

    const zoneIds = [
      this.diexConfigService.get('CLOUDFLARE_PUBLIC_DOMAIN_ZONE_ID'),
      this.diexConfigService.get('CLOUDFLARE_ZONE_ID'),
    ];

    // since notification are not scoped to a zone, we need to check if the zone is in the list of zones
    if (!hostname || !zoneIds.includes(req.body?.data?.metadata?.zone.id)) {
      return;
    }

    try {
      await this.dnsCloudflareService.checkHostname(hostname);
    } catch {
      return;
    }
  }
}
