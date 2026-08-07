import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';

import { type Request } from 'express';

import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { FormSubmissionSource } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import { DiexFormsService } from 'src/engine/core-modules/diex-forms/services/diex-forms.service';

// These four endpoints are unauthenticated by design: they receive posts from
// landing pages and third-party connectors. Without a limit, a single client
// can create CRM records without bound, so every entry point is throttled per
// caller IP. The form limit is deliberately tighter than the connector ones,
// since a real visitor submits a form a handful of times, not hundreds.
const SUBMISSION_WINDOW_MS = 60_000;
const MAX_FORM_SUBMISSIONS_PER_WINDOW = 10;
const MAX_CONNECTOR_CALLS_PER_WINDOW = 120;

@Controller('api/v1')
export class DiexPublicFormsController {
  constructor(
    private readonly formsService: DiexFormsService,
    private readonly throttlerService: ThrottlerService,
  ) {}

  private async throttleByIpOrThrow(
    request: Request,
    scope: string,
    maxPerWindow: number,
  ): Promise<void> {
    // An absent IP collapses every anonymous caller onto one bucket, which
    // fails closed: the traffic is still limited rather than unlimited.
    const callerIp = request.ip ?? 'unknown-ip';

    await this.throttlerService.tokenBucketThrottleOrThrow(
      `diex-public-forms:${scope}:${callerIp}`,
      1,
      maxPerWindow,
      SUBMISSION_WINDOW_MS,
    );
  }

  // Reconstructed: connectors post to a single URL, so the target form is
  // identified inside the payload. Rejecting a missing formId keeps a
  // malformed connector call from silently creating an unattached submission.
  private async processConnectorSubmission(
    source: FormSubmissionSource,
    payload: Record<string, unknown>,
  ) {
    const formId =
      typeof payload.formId === 'string'
        ? payload.formId
        : typeof payload.form_id === 'string'
          ? payload.form_id
          : null;

    if (formId === null) {
      throw new BadRequestException(
        'O payload do conector precisa informar formId.',
      );
    }

    const submission = await this.formsService.processSubmission(
      formId,
      payload,
      source,
    );

    return { success: true, submissionId: submission.id };
  }

  @Post('public/forms/:formId/submit')
  @HttpCode(HttpStatus.OK)
  async submitPublicForm(
    @Req() request: Request,
    @Param('formId') formId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    await this.throttleByIpOrThrow(
      request,
      `submit:${formId}`,
      MAX_FORM_SUBMISSIONS_PER_WINDOW,
    );

    const source =
      typeof payload._source === 'string'
        ? (payload._source as FormSubmissionSource)
        : FormSubmissionSource.WEBHOOK_API;

    const submission = await this.formsService.processSubmission(
      formId,
      payload,
      source,
    );

    return {
      success: true,
      message: 'Dados do formulário salvos com sucesso no Diex CRM.',
      submissionId: submission.id,
    };
  }

  @Post('webhooks/connectors/cal-com')
  @HttpCode(HttpStatus.OK)
  async handleCalComWebhook(
    @Req() request: Request,
    @Body() payload: Record<string, unknown>,
  ) {
    await this.throttleByIpOrThrow(
      request,
      'cal-com',
      MAX_CONNECTOR_CALLS_PER_WINDOW,
    );

    return this.processConnectorSubmission(FormSubmissionSource.CAL_COM, payload);
  }

  @Post('webhooks/connectors/yayforms')
  @HttpCode(HttpStatus.OK)
  async handleYayFormsWebhook(
    @Req() request: Request,
    @Body() payload: Record<string, unknown>,
  ) {
    await this.throttleByIpOrThrow(
      request,
      'yayforms',
      MAX_CONNECTOR_CALLS_PER_WINDOW,
    );

    return this.processConnectorSubmission(FormSubmissionSource.YAYFORMS, payload);
  }

  @Post('webhooks/connectors/tally')
  @HttpCode(HttpStatus.OK)
  async handleTallyWebhook(
    @Req() request: Request,
    @Body() payload: Record<string, unknown>,
  ) {
    await this.throttleByIpOrThrow(
      request,
      'tally',
      MAX_CONNECTOR_CALLS_PER_WINDOW,
    );

    return this.processConnectorSubmission(FormSubmissionSource.TALLY, payload);
  }
}
