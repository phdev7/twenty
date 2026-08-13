import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { type Request } from 'express';
import { PermissionFlagType } from 'diex-shared/constants';

import { FormSubmissionSource } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import { DiexFormsService } from 'src/engine/core-modules/diex-forms/services/diex-forms.service';
import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

const SUBMISSION_WINDOW_MS = 60_000;
const MAX_FORM_SUBMISSIONS_PER_WINDOW = 10;
const MAX_CONNECTOR_CALLS_PER_WINDOW = 120;

@Controller('api/v1')
@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.API_KEYS_AND_WEBHOOKS),
)
export class DiexPublicFormsController {
  constructor(
    private readonly formsService: DiexFormsService,
    private readonly throttlerService: ThrottlerService,
  ) {}

  @Post('public/forms/:formId/submit')
  @HttpCode(HttpStatus.OK)
  async submitPublicFormIntegration(
    @Req() request: Request,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('formId') formId: string,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    await this.throttleByIpOrThrow(
      request,
      `integration:${formId}`,
      MAX_FORM_SUBMISSIONS_PER_WINDOW,
    );
    const submission = await this.formsService.processConnectorSubmission(
      workspace.id,
      formId,
      payload,
      FormSubmissionSource.WEBHOOK_API,
      this.buildSubmissionContext(request, idempotencyKey),
    );

    return this.buildSubmissionResponse(submission.id);
  }

  @Post('webhooks/connectors/cal-com')
  @HttpCode(HttpStatus.OK)
  async handleCalComWebhook(
    @Req() request: Request,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    await this.throttleByIpOrThrow(
      request,
      'cal-com',
      MAX_CONNECTOR_CALLS_PER_WINDOW,
    );

    return this.processConnectorSubmission(
      request,
      workspace.id,
      FormSubmissionSource.CAL_COM,
      payload,
      idempotencyKey,
    );
  }

  @Post('webhooks/connectors/yayforms')
  @HttpCode(HttpStatus.OK)
  async handleYayFormsWebhook(
    @Req() request: Request,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    await this.throttleByIpOrThrow(
      request,
      'yayforms',
      MAX_CONNECTOR_CALLS_PER_WINDOW,
    );

    return this.processConnectorSubmission(
      request,
      workspace.id,
      FormSubmissionSource.YAYFORMS,
      payload,
      idempotencyKey,
    );
  }

  @Post('webhooks/connectors/tally')
  @HttpCode(HttpStatus.OK)
  async handleTallyWebhook(
    @Req() request: Request,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    await this.throttleByIpOrThrow(
      request,
      'tally',
      MAX_CONNECTOR_CALLS_PER_WINDOW,
    );

    return this.processConnectorSubmission(
      request,
      workspace.id,
      FormSubmissionSource.TALLY,
      payload,
      idempotencyKey,
    );
  }

  private async throttleByIpOrThrow(
    request: Request,
    scope: string,
    maxPerWindow: number,
  ): Promise<void> {
    const callerIp = request.ip ?? 'unknown-ip';

    await this.throttlerService.tokenBucketThrottleOrThrow(
      `diex-public-forms:${scope}:${callerIp}`,
      1,
      maxPerWindow,
      SUBMISSION_WINDOW_MS,
    );
  }

  private async processConnectorSubmission(
    request: Request,
    workspaceId: string,
    source: FormSubmissionSource,
    payload: Record<string, unknown>,
    idempotencyKey?: string,
  ) {
    const formId =
      typeof payload.formId === 'string'
        ? payload.formId
        : typeof payload.form_id === 'string'
          ? payload.form_id
          : null;

    if (!formId) {
      throw new BadRequestException(
        'O payload do conector precisa informar formId.',
      );
    }

    const submission = await this.formsService.processConnectorSubmission(
      workspaceId,
      formId,
      payload,
      source,
      this.buildSubmissionContext(request, idempotencyKey),
    );

    return this.buildSubmissionResponse(submission.id);
  }

  private buildSubmissionContext(request: Request, idempotencyKey?: string) {
    return {
      idempotencyKey: idempotencyKey ?? null,
      ip: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    };
  }

  private buildSubmissionResponse(submissionId: string) {
    return {
      success: true,
      message: 'Recebemos suas informações com sucesso.',
      submissionId,
    };
  }
}
