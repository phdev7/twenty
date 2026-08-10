import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { PermissionFlagType } from 'diex-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { ApproveDiexAccessRequestDTO } from 'src/engine/core-modules/diex-access-request/dtos/approve-diex-access-request.dto';
import { ApproveDiexAccessRequestInput } from 'src/engine/core-modules/diex-access-request/dtos/approve-diex-access-request.input';
import { RetryDiexAccessRequestInvitationDTO } from 'src/engine/core-modules/diex-access-request/dtos/retry-diex-access-request-invitation.dto';
import { RetryDiexAccessRequestInvitationInput } from 'src/engine/core-modules/diex-access-request/dtos/retry-diex-access-request-invitation.input';
import { DiexAccessRequestService } from 'src/engine/core-modules/diex-access-request/services/diex-access-request.service';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';

@Resolver()
@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(
  PermissionsGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@UseGuards(
  UserAuthGuard,
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.WORKSPACE_MEMBERS),
)
export class DiexAccessRequestResolver {
  constructor(
    private readonly diexAccessRequestService: DiexAccessRequestService,
  ) {}

  @Mutation(() => ApproveDiexAccessRequestDTO)
  async approveDiexAccessRequest(
    @Args('input') input: ApproveDiexAccessRequestInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
  ): Promise<ApproveDiexAccessRequestDTO> {
    return this.diexAccessRequestService.approveRequest({
      requestId: input.requestId,
      requestedSubdomain: input.subdomain,
      operatorWorkspaceId: workspace.id,
      operator: user,
    });
  }

  @Mutation(() => RetryDiexAccessRequestInvitationDTO)
  async retryDiexAccessRequestInvitation(
    @Args('input') input: RetryDiexAccessRequestInvitationInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
  ): Promise<RetryDiexAccessRequestInvitationDTO> {
    return this.diexAccessRequestService.retryInvitation({
      requestId: input.requestId,
      operatorWorkspaceId: workspace.id,
      operator: user,
    });
  }
}
