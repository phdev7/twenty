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
  customObject?: unknown;
};

type ExecuteBody = {
  actionId?: unknown;
  previewOnly?: unknown;
  confirmExecute?: unknown;
  confirmationToken?: unknown;
  targetStage?: unknown;
};

type ReviewBody = {
  actionId?: unknown;
  decision?: unknown;
  note?: unknown;
};

const readString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const readCustomObject = (
  value: unknown,
): {
  objectName: string;
  recordId?: string;
  operation: 'CREATE' | 'UPDATE';
  fields: Record<string, unknown>;
} | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(
      'A ação adaptativa deve informar um objeto válido.',
    );
  }

  const candidate = value as Record<string, unknown>;
  const objectName = readString(candidate.objectName);
  const operation = candidate.operation;

  if (!objectName) {
    throw new BadRequestException(
      'A ação adaptativa exige o nome do objeto de destino.',
    );
  }

  if (operation !== 'CREATE' && operation !== 'UPDATE') {
    throw new BadRequestException(
      'A operação adaptativa deve ser CREATE ou UPDATE.',
    );
  }

  if (
    typeof candidate.fields !== 'object' ||
    candidate.fields === null ||
    Array.isArray(candidate.fields)
  ) {
    throw new BadRequestException(
      'A ação adaptativa exige um conjunto explícito de campos.',
    );
  }

  const fields = candidate.fields as Record<string, unknown>;

  return {
    objectName,
    recordId: readString(candidate.recordId) || undefined,
    operation,
    fields,
  };
};

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
      customObject: readCustomObject(body?.customObject),
    });
  }

  @Post('execute-action')
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.WORKSPACE))
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

  @Post('review-action')
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.WORKSPACE))
  async review(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
    @Body() body: ReviewBody,
  ) {
    const decision = readString(body?.decision);

    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      throw new BadRequestException(
        'A decisão da ação de IA deve ser APPROVED ou REJECTED.',
      );
    }

    return this.aiGovernanceService.review({
      workspaceId: workspace.id,
      workspaceMemberId,
      actionId: readString(body?.actionId),
      decision,
      note: readString(body?.note),
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
