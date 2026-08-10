import {
  Controller,
  ForbiddenException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';
import { InboxAutomationEvaluationService } from 'src/modules/inbox/services/inbox-automation-evaluation.service';
import { type InboxAutomationEvaluationResponse } from 'src/modules/inbox/types/inbox-automation.types';

@Controller('rest/inbox/messages')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class InboxAutomationEvaluationController {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly inboxAutomationEvaluationService: InboxAutomationEvaluationService,
  ) {}

  @UseGuards(NoPermissionGuard)
  @Post(':messageId/automation-evaluations')
  async createAutomationEvaluation(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
    @Param('messageId') messageId: string,
  ): Promise<InboxAutomationEvaluationResponse> {
    const authContext = buildSystemAuthContext(workspace.id);

    if (!workspaceMemberId) {
      throw new ForbiddenException('Workspace member authentication required.');
    }

    const hasMembership =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const workspaceMemberRepository =
            await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
              workspace.id,
              WorkspaceMemberWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            );

          return Boolean(
            await workspaceMemberRepository.findOne({
              where: { id: workspaceMemberId },
              select: { id: true },
            }),
          );
        },
        authContext,
      );

    if (!hasMembership) {
      throw new ForbiddenException('Workspace member is not authorized.');
    }

    return this.inboxAutomationEvaluationService.enqueue({
      workspaceId: workspace.id,
      messageId,
    });
  }
}
