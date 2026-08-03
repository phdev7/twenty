import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AiActionType } from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';
import { AiGovernanceService } from 'src/modules/ai-governance/services/ai-governance.service';

type ProposeBody = {
  name?: unknown;
  type?: unknown;
  confidence?: unknown;
  rationale?: unknown;
  proposedAction?: unknown;
  opportunityId?: unknown;
  commercialSignalId?: unknown;
  successPlanId?: unknown;
  reviewerId?: unknown;
  inboxConversationId?: unknown;
  idempotencyKey?: unknown;
};

type ExecuteBody = {
  actionId?: unknown;
  previewOnly?: unknown;
  confirmExecute?: unknown;
  confirmationToken?: unknown;
  targetStage?: unknown;
};

const readString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

@Controller('rest/diex/ai')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class AiGovernanceController {
  constructor(private readonly aiGovernanceService: AiGovernanceService) {}

  @Post('propose-action')
  async propose(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() body: ProposeBody,
  ) {
    return this.aiGovernanceService.propose({
      workspaceId: workspace.id,
      name: readString(body?.name),
      type: readString(body?.type) as AiActionType,
      confidence:
        typeof body?.confidence === 'number' ? body.confidence : undefined,
      rationale: readString(body?.rationale),
      proposedAction: readString(body?.proposedAction),
      opportunityId: readString(body?.opportunityId),
      commercialSignalId: readString(body?.commercialSignalId),
      successPlanId: readString(body?.successPlanId),
      reviewerId: readString(body?.reviewerId),
      inboxConversationId: readString(body?.inboxConversationId),
      idempotencyKey: readString(body?.idempotencyKey),
    });
  }

  @Post('execute-action')
  async execute(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() body: ExecuteBody,
  ) {
    return this.aiGovernanceService.execute({
      workspaceId: workspace.id,
      actionId: readString(body?.actionId),
      previewOnly: body?.previewOnly !== false,
      confirmExecute: body?.confirmExecute === true,
      confirmationToken: readString(body?.confirmationToken),
      targetStage: readString(body?.targetStage),
    });
  }
}
