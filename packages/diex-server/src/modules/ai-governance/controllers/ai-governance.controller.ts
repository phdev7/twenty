import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { PermissionFlagType } from 'diex-shared/constants';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AiActionType } from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';
import { AiGovernanceService } from 'src/modules/ai-governance/services/ai-governance.service';
import { workspaceAiPolicyUpdateSchema } from 'src/modules/workspace-architecture/types/workspace-ai-policy.schema';

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
  contextVersion?: unknown;
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
      contextVersion: readString(body?.contextVersion),
    });
  }

  @Post('execute-action')
  async execute(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
    @Body() body: ExecuteBody,
  ) {
    return this.aiGovernanceService.execute({
      workspaceId: workspace.id,
      workspaceMemberId,
      actionId: readString(body?.actionId),
      previewOnly: body?.previewOnly !== false,
      confirmExecute: body?.confirmExecute === true,
      confirmationToken: readString(body?.confirmationToken),
      targetStage: readString(body?.targetStage),
    });
  }

  @Get('policy')
  async getPolicy(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.aiGovernanceService.getWorkspaceAiPolicy(workspace.id);
  }

  @Put('policy')
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.WORKSPACE))
  async updatePolicy(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @Body() body: unknown,
  ) {
    const parsed = workspaceAiPolicyUpdateSchema.safeParse(body ?? {});

    if (!parsed.success) {
      throw new BadRequestException(
        `Política de IA inválida: ${parsed.error.issues
          .map(({ path, message }) => `${path.join('.')}: ${message}`)
          .join('; ')}`,
      );
    }

    return this.aiGovernanceService.updateWorkspaceAiPolicy({
      workspaceId: workspace.id,
      update: {
        ...parsed.data,
        updatedBy: user.id,
      },
    });
  }
}
