import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

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
import { type WorkspaceCustomPageBlockInput } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { type WorkspacePageRenderer } from 'src/modules/workspace-architecture/types/workspace-page-catalog.schema';

const WORKSPACE_PAGE_RENDERERS: WorkspacePageRenderer[] = [
  'INBOX',
  'DASHBOARD',
  'PIPELINE',
  'CALENDAR',
  'OPERATIONS',
  'CUSTOM',
];

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

  @Get('readiness')
  async getCommercialReadiness(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.onboardingService.getCommercialReadiness(workspace.id);
  }

  @Get('architecture')
  async getArchitecture(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.onboardingService.getDiexArchitecture(workspace.id);
  }

  @Get('pages')
  async getPages(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.onboardingService.getDiexPageCatalog(workspace.id);
  }

  @Get('pages/:pageKey/data')
  async getPageData(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('pageKey') pageKey: string,
  ) {
    return this.onboardingService.getDiexPageData(workspace.id, pageKey);
  }

  @Post('architecture/regenerate')
  async regenerateArchitecture(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ) {
    return this.onboardingService.regenerateDiexArchitecture({
      workspaceId: workspace.id,
      userId: user.id,
      userWorkspaceId,
    });
  }

  @Post('pages')
  async updatePages(
    @Body()
    body: {
      action?: unknown;
      key?: unknown;
      label?: unknown;
      description?: unknown;
      showInNavigation?: unknown;
      position?: unknown;
      aiGenerated?: unknown;
      renderer?: unknown;
      icon?: unknown;
      navigationGroup?: unknown;
      capabilities?: unknown;
      dataSources?: unknown;
      primaryAction?: unknown;
      blocks?: unknown;
    },
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    const action = typeof body?.action === 'string' ? body.action : '';
    const key = typeof body?.key === 'string' ? body.key : '';

    if (action === 'CREATE') {
      const label = typeof body?.label === 'string' ? body.label.trim() : '';

      if (label.length < 2) {
        throw new BadRequestException(
          'Informe pelo menos duas letras para criar a página.',
        );
      }

      return this.onboardingService.createDiexPage({
        workspaceId: workspace.id,
        userId: user.id,
        label,
        description:
          typeof body?.description === 'string' ? body.description : undefined,
        aiGenerated: body?.aiGenerated === true,
        renderer:
          typeof body?.renderer === 'string' &&
          WORKSPACE_PAGE_RENDERERS.includes(
            body.renderer as WorkspacePageRenderer,
          )
            ? (body.renderer as WorkspacePageRenderer)
            : undefined,
        icon: typeof body?.icon === 'string' ? body.icon : undefined,
        navigationGroup:
          typeof body?.navigationGroup === 'string'
            ? body.navigationGroup
            : undefined,
        capabilities: Array.isArray(body?.capabilities)
          ? body.capabilities.filter(
              (capability): capability is string =>
                typeof capability === 'string',
            )
          : undefined,
        dataSources: Array.isArray(body?.dataSources)
          ? body.dataSources.filter(
              (source): source is string => typeof source === 'string',
            )
          : undefined,
        blocks: Array.isArray(body?.blocks)
          ? (body.blocks as WorkspaceCustomPageBlockInput[])
          : undefined,
      });
    }

    if (action === 'ARCHIVE' && key) {
      return this.onboardingService.archiveDiexPage({
        workspaceId: workspace.id,
        userId: user.id,
        key,
      });
    }

    if (action === 'RESTORE' && key) {
      return this.onboardingService.restoreDiexPage({
        workspaceId: workspace.id,
        userId: user.id,
        key,
      });
    }

    if (action === 'UPDATE' && key) {
      return this.onboardingService.updateDiexPage({
        workspaceId: workspace.id,
        userId: user.id,
        key,
        label: typeof body?.label === 'string' ? body.label : undefined,
        description:
          typeof body?.description === 'string' ? body.description : undefined,
        showInNavigation:
          typeof body?.showInNavigation === 'boolean'
            ? body.showInNavigation
            : undefined,
        position:
          typeof body?.position === 'number' ? body.position : undefined,
        renderer:
          typeof body?.renderer === 'string' &&
          WORKSPACE_PAGE_RENDERERS.includes(
            body.renderer as WorkspacePageRenderer,
          )
            ? (body.renderer as WorkspacePageRenderer)
            : undefined,
        icon: typeof body?.icon === 'string' ? body.icon : undefined,
        navigationGroup:
          typeof body?.navigationGroup === 'string'
            ? body.navigationGroup
            : undefined,
        capabilities: Array.isArray(body?.capabilities)
          ? body.capabilities.filter(
              (capability): capability is string =>
                typeof capability === 'string',
            )
          : undefined,
        dataSources: Array.isArray(body?.dataSources)
          ? body.dataSources.filter(
              (source): source is string => typeof source === 'string',
            )
          : undefined,
        primaryAction:
          typeof body?.primaryAction === 'string'
            ? body.primaryAction
            : undefined,
        blocks: Array.isArray(body?.blocks)
          ? (body.blocks as WorkspaceCustomPageBlockInput[])
          : undefined,
      });
    }

    throw new BadRequestException('Ação de página operacional inválida.');
  }

  @Post('architecture/approve')
  async approveArchitecture(
    @Body() body: { version?: unknown },
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.onboardingService.approveDiexArchitecture({
      workspaceId: workspace.id,
      userId: user.id,
      version: typeof body?.version === 'number' ? body.version : undefined,
    });
  }

  @Post('architecture/apply')
  async applyArchitecture(
    @Body() body: { version?: unknown },
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.onboardingService.applyDiexArchitecture({
      workspaceId: workspace.id,
      userId: user.id,
      version: typeof body?.version === 'number' ? body.version : undefined,
    });
  }

  @Post('goal')
  async setCommercialGoal(
    @Body() body: { goal?: unknown },
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.onboardingService.setCommercialGoal({
      workspaceId: workspace.id,
      userId: user.id,
      goal: typeof body?.goal === 'string' ? body.goal : '',
    });
  }

  @Post('first-commercial-flow')
  async executeFirstCommercialFlow(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.onboardingService.executeFirstCommercialFlow(workspace.id);
  }

  @Post('complete')
  async completeDiexCommercialOnboarding(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.onboardingService.completeDiexCommercialOnboarding({
      workspaceId: workspace.id,
      userId: user.id,
    });
  }
}
