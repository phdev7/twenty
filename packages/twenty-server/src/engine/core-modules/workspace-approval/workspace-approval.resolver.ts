import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { ApproveWorkspaceCreationDTO } from 'src/engine/core-modules/workspace-approval/dtos/approve-workspace-creation.dto';
import { ApproveWorkspaceCreationInput } from 'src/engine/core-modules/workspace-approval/dtos/approve-workspace-creation.input';
import { PendingWorkspaceApprovalDTO } from 'src/engine/core-modules/workspace-approval/dtos/pending-workspace-approval.dto';
import { WorkspaceApprovalService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval.service';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { PermissionFlagType } from 'twenty-shared/constants';

import { AdminPanelGuard } from 'src/engine/guards/admin-panel-guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(PreventNestToAutoLogGraphqlErrorsFilter)
// Mirrors AdminPanelResolver: this resolver backs a tab inside the admin panel,
// so it is gated the same way the rest of that panel is. AdminPanelGuard is the
// load-bearing check (server admin only); the settings permission guard keeps it
// consistent with the surrounding panel. WorkspaceApprovalService re-checks the
// approver, so the mutation is not guard-only.
@UseGuards(
  WorkspaceAuthGuard,
  UserAuthGuard,
  AdminPanelGuard,
  SettingsPermissionGuard(PermissionFlagType.SECURITY),
)
export class WorkspaceApprovalResolver {
  constructor(
    private readonly workspaceApprovalService: WorkspaceApprovalService,
  ) {}

  @Query(() => [PendingWorkspaceApprovalDTO])
  async pendingWorkspaceApprovals(): Promise<PendingWorkspaceApprovalDTO[]> {
    return this.workspaceApprovalService.listPendingApprovals();
  }

  @Mutation(() => ApproveWorkspaceCreationDTO)
  async approveWorkspaceCreation(
    @Args('input') input: ApproveWorkspaceCreationInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<ApproveWorkspaceCreationDTO> {
    return this.workspaceApprovalService.approveWorkspace({
      workspaceId: input.workspaceId,
      approver: user,
    });
  }
}
