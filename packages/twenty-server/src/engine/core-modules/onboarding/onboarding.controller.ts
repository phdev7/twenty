import { Body, Controller, Post, UseFilters, UseGuards } from '@nestjs/common';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { CompleteDiexOnboardingInput } from 'src/engine/core-modules/onboarding/dtos/complete-diex-onboarding.input';
import { OnboardingService } from 'src/engine/core-modules/onboarding/onboarding.service';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AiRestApiExceptionFilter } from 'src/engine/metadata-modules/ai/filters/ai-api-exception.filter';

@Controller('rest/diex/onboarding')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(AiRestApiExceptionFilter, RestApiExceptionFilter)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('operation-context')
  async completeDiexOnboarding(
    @Body() body: CompleteDiexOnboardingInput,
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ) {
    return this.onboardingService.completeDiexOnboarding({
      operationDescription: body.operationDescription,
      userId: user.id,
      userWorkspaceId,
      workspace,
    });
  }
}
