import { randomBytes } from 'node:crypto';

import {
  Body,
  Controller,
  Get,
  Headers,
  HostParam,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { type Request, type Response } from 'express';

import { DiexFormsPublicRendererService } from 'src/engine/core-modules/diex-forms/services/diex-forms-public-renderer.service';
import { DiexFormsService } from 'src/engine/core-modules/diex-forms/services/diex-forms.service';
import { FileUrlService } from 'src/engine/core-modules/file/file-url/file-url.service';
import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller({ host: ':workspaceSlug.diexforms.com' })
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class DiexFormsDomainController {
  constructor(
    private readonly formsService: DiexFormsService,
    private readonly rendererService: DiexFormsPublicRendererService,
    private readonly throttlerService: ThrottlerService,
    private readonly fileUrlService: FileUrlService,
  ) {}

  @Get()
  @Redirect()
  redirectWorkspaceRoot() {
    return { url: this.formsService.getMarketingUrl(), statusCode: 302 };
  }

  @Get(':formSlug')
  async renderPublicForm(
    @Req() request: Request,
    @Res() response: Response,
    @HostParam('workspaceSlug') workspaceSlug: string,
    @Param('formSlug') formSlug: string,
  ): Promise<void> {
    if (workspaceSlug.toLowerCase() === 'www') {
      response.redirect(HttpStatus.FOUND, this.formsService.getMarketingUrl());

      return;
    }

    await this.throttleByIpOrThrow(request, 'view-global', 240);
    await this.throttleByIpOrThrow(
      request,
      `view:${workspaceSlug.toLowerCase()}:${formSlug.toLowerCase()}`,
      120,
    );
    const { form, workspace, snapshot } =
      await this.formsService.getPublicFormBySubdomain(workspaceSlug, formSlug);
    const nonce = randomBytes(18).toString('base64');
    const token = this.formsService.createPublicViewToken(
      form.id,
      form.publishedVersion,
    );
    const signedWorkspaceLogoUrl = snapshot.showLogo
      ? await this.fileUrlService.signWorkspaceLogoUrl(workspace)
      : null;
    const html = this.rendererService.render({
      snapshot,
      token,
      submitUrl: `/${encodeURIComponent(formSlug)}`,
      workspaceName: workspace.displayName,
      workspaceLogoUrl:
        signedWorkspaceLogoUrl ?? this.readSafeWorkspaceLogo(workspace.logo),
      nonce,
    });

    this.sendPublicHtml(response, html, nonce);
  }

  @Get('*path')
  redirectUnknownWorkspacePath(@Res() response: Response): void {
    response.redirect(HttpStatus.FOUND, this.formsService.getMarketingUrl());
  }

  @Post(':formSlug')
  @HttpCode(HttpStatus.OK)
  async submitPublicForm(
    @Req() request: Request,
    @HostParam('workspaceSlug') workspaceSlug: string,
    @Param('formSlug') formSlug: string,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    const normalizedWorkspaceSlug = workspaceSlug.toLowerCase();
    const normalizedFormSlug = formSlug.toLowerCase();

    await this.throttlerService.tokenBucketThrottleOrThrow(
      `diex-public-forms:submit-global:${normalizedWorkspaceSlug}:${normalizedFormSlug}`,
      1,
      600,
      60_000,
    );
    await this.throttleByIpOrThrow(request, 'submit-global', 30);
    await this.throttleByIpOrThrow(
      request,
      `submit:${normalizedWorkspaceSlug}:${normalizedFormSlug}`,
      10,
    );
    const submission = await this.formsService.processPublicSubmission({
      formsSubdomain: workspaceSlug,
      formSlug,
      rawPayload: payload,
      context: {
        idempotencyKey: idempotencyKey ?? null,
        ip: request.ip ?? null,
        userAgent: request.get('user-agent') ?? null,
        token: typeof payload._token === 'string' ? payload._token : null,
      },
    });

    return {
      success: true,
      message: 'Recebemos suas informações com sucesso.',
      submissionId: submission.id,
    };
  }

  private async throttleByIpOrThrow(
    request: Request,
    scope: string,
    maxPerWindow: number,
  ): Promise<void> {
    await this.throttlerService.tokenBucketThrottleOrThrow(
      `diex-public-forms:${scope}:${request.ip ?? 'unknown-ip'}`,
      1,
      maxPerWindow,
      60_000,
    );
  }

  private sendPublicHtml(
    response: Response,
    html: string,
    nonce: string,
  ): void {
    response
      .status(HttpStatus.OK)
      .set({
        'Cache-Control': 'no-store, max-age=0',
        'Content-Security-Policy': [
          "default-src 'none'",
          `style-src 'nonce-${nonce}'`,
          `script-src 'nonce-${nonce}'`,
          "img-src 'self' https: data:",
          "connect-src 'self'",
          "font-src 'none'",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "base-uri 'none'",
          "object-src 'none'",
        ].join('; '),
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Permissions-Policy':
          'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      })
      .type('html')
      .send(html);
  }

  private readSafeWorkspaceLogo(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);

      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }
}

@Controller({ host: 'diexforms.com' })
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class DiexFormsApexController {
  constructor(private readonly formsService: DiexFormsService) {}

  @Get()
  @Redirect()
  redirectApex() {
    return { url: this.formsService.getMarketingUrl(), statusCode: 302 };
  }

  @Get('*path')
  @Redirect()
  redirectApexPath() {
    return { url: this.formsService.getMarketingUrl(), statusCode: 302 };
  }
}
