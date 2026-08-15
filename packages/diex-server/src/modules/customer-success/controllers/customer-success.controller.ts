import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { PermissionFlagType } from 'diex-shared/constants';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CustomerSuccessService } from 'src/modules/customer-success/services/customer-success.service';

type ReviewBody = {
  successPlanId?: unknown;
  mode?: unknown;
};

type HandoffBody = {
  opportunityId?: unknown;
  ownerId?: unknown;
  renewalDate?: unknown;
  recurringRevenueMicros?: unknown;
  currencyCode?: unknown;
  objectives?: unknown;
  successCriteria?: unknown;
  previewOnly?: unknown;
  confirmCreate?: unknown;
  confirmationToken?: unknown;
};

type MilestoneBody = {
  milestoneId?: unknown;
  action?: unknown;
  outcome?: unknown;
  evidence?: unknown;
  impact?: unknown;
  previewOnly?: unknown;
  confirmUpdate?: unknown;
  confirmationToken?: unknown;
};

const readString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

@Controller('rest/diex/customer-success')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class CustomerSuccessController {
  constructor(
    private readonly customerSuccessService: CustomerSuccessService,
  ) {}

  // As três rotas executam com privilégio de sistema (buildSystemAuthContext) e
  // alteram receita recorrente, renovações e milestones. Operação que roda como
  // sistema exige permissão administrativa: para liberá-la a um cargo restrito,
  // o serviço precisa antes passar a operar com o authContext de quem chamou.
  @Post('review')
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.WORKSPACE))
  async review(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() body: ReviewBody,
  ) {
    const successPlanId = readString(body?.successPlanId);

    if (!successPlanId) {
      throw new Error('Selecione um plano de sucesso válido.');
    }

    return {
      ...(await this.customerSuccessService.review({
        workspaceId: workspace.id,
        successPlanId,
        updateSuccessPlan: body?.mode === 'APPLY',
        proposeAction: body?.mode === 'APPLY',
      })),
      mode: body?.mode === 'APPLY' ? 'APPLY' : 'PREVIEW',
    };
  }

  @Post('handoff')
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.WORKSPACE))
  async handoff(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() body: HandoffBody,
  ) {
    return this.customerSuccessService.handoff({
      workspaceId: workspace.id,
      opportunityId: readString(body?.opportunityId),
      ownerId: readString(body?.ownerId),
      renewalDate: readString(body?.renewalDate),
      recurringRevenueMicros:
        typeof body?.recurringRevenueMicros === 'number'
          ? body.recurringRevenueMicros
          : Number.NaN,
      currencyCode: readString(body?.currencyCode),
      objectives: readString(body?.objectives),
      successCriteria: readString(body?.successCriteria),
      previewOnly: body?.previewOnly !== false,
      confirmCreate: body?.confirmCreate === true,
      confirmationToken: readString(body?.confirmationToken),
    });
  }

  @Post('milestone-action')
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.WORKSPACE))
  async milestoneAction(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() body: MilestoneBody,
  ) {
    return this.customerSuccessService.updateMilestone({
      workspaceId: workspace.id,
      milestoneId: readString(body?.milestoneId),
      action: readString(body?.action) as 'START' | 'BLOCK' | 'COMPLETE',
      outcome: readString(body?.outcome),
      evidence: readString(body?.evidence),
      impact: readString(body?.impact),
      previewOnly: body?.previewOnly !== false,
      confirmUpdate: body?.confirmUpdate === true,
      confirmationToken: readString(body?.confirmationToken),
    });
  }
}
