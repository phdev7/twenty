import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Request } from 'express';
import { FieldActorSource } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';
import { Repository } from 'typeorm';

import { WorkflowTriggerRestApiExceptionFilter } from 'src/engine/core-modules/workflow/filters/workflow-trigger-rest-api-exception.filter';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { JwtTokenTypeEnum } from 'src/engine/core-modules/auth/types/jwt-token-type.enum';
import { JwtWrapperService } from 'src/engine/core-modules/jwt/services/jwt-wrapper.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  DiexORMException,
  DiexORMExceptionCode,
} from 'src/engine/diex-orm/exceptions/diex-orm.exception';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import {
  WorkflowVersionStatus,
  type WorkflowVersionWorkspaceEntity,
} from 'src/modules/workflow/common/standard-objects/workflow-version.workspace-entity';
import { type WorkflowWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';
import {
  WorkflowTriggerException,
  WorkflowTriggerExceptionCode,
} from 'src/modules/workflow/workflow-trigger/exceptions/workflow-trigger.exception';
import { WorkflowTriggerType } from 'src/modules/workflow/workflow-trigger/types/workflow-trigger.type';
import { WorkflowTriggerWorkspaceService } from 'src/modules/workflow/workflow-trigger/workspace-services/workflow-trigger.workspace-service';

@Controller('webhooks')
@UseFilters(
  WorkflowTriggerRestApiExceptionFilter,
  PermissionsGraphqlApiExceptionFilter,
)
export class WorkflowTriggerController {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workflowTriggerWorkspaceService: WorkflowTriggerWorkspaceService,
    private readonly jwtWrapperService: JwtWrapperService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    @InjectRepository(WorkspaceEntity)
    protected readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  @Post('workflows/:workspaceId/:workflowId')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async runWorkflowByPostRequest(
    @Param('workspaceId') workspaceId: string,
    @Param('workflowId') workflowId: string,
    @Req() request: Request,
  ) {
    return await this.runWorkflow({
      workflowId,
      payload: request.body || {},
      workspaceId,
      request,
    });
  }

  @Get('workflows/:workspaceId/:workflowId')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async runWorkflowByGetRequest(
    @Param('workspaceId') workspaceId: string,
    @Param('workflowId') workflowId: string,
    @Req() request: Request,
  ) {
    return await this.runWorkflow({ workflowId, workspaceId, request });
  }

  private async runWorkflow({
    workflowId,
    payload,
    workspaceId,
    request,
  }: {
    workflowId: string;
    payload?: object;
    workspaceId: string;
    request: Request;
  }) {
    const workspaceExists = await this.workspaceRepository.existsBy({
      id: workspaceId,
    });

    if (!workspaceExists) {
      throw new WorkflowTriggerException(
        `[Webhook trigger] Workspace ${workspaceId} not found`,
        WorkflowTriggerExceptionCode.NOT_FOUND,
      );
    }

    const authContext = buildSystemAuthContext(workspaceId);

    try {
      const { workflow, workflowVersion } =
        await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
          async () => {
            const workflowRepository =
              await this.globalWorkspaceOrmManager.getRepository<WorkflowWorkspaceEntity>(
                workspaceId,
                'workflow',
                { shouldBypassPermissionChecks: true },
              );

            const workflow = await workflowRepository.findOne({
              where: { id: workflowId },
            });

            if (!isDefined(workflow)) {
              throw new WorkflowTriggerException(
                `[Webhook trigger] Workflow ${workflowId} not found in workspace ${workspaceId}`,
                WorkflowTriggerExceptionCode.NOT_FOUND,
              );
            }

            if (
              !isDefined(workflow.lastPublishedVersionId) ||
              workflow.lastPublishedVersionId === ''
            ) {
              throw new WorkflowTriggerException(
                `[Webhook trigger] Workflow ${workflowId} has not been activated in workspace ${workspaceId}`,
                WorkflowTriggerExceptionCode.INVALID_WORKFLOW_STATUS,
              );
            }

            const workflowVersionRepository =
              await this.globalWorkspaceOrmManager.getRepository<WorkflowVersionWorkspaceEntity>(
                workspaceId,
                'workflowVersion',
                { shouldBypassPermissionChecks: true },
              );
            const workflowVersion = await workflowVersionRepository.findOne({
              where: { id: workflow.lastPublishedVersionId },
            });

            if (!isDefined(workflowVersion)) {
              throw new WorkflowTriggerException(
                `[Webhook trigger] No workflow version activated for workflow ${workflowId} in workspace ${workspaceId}`,
                WorkflowTriggerExceptionCode.INVALID_WORKFLOW_VERSION,
              );
            }

            if (workflowVersion.trigger?.type !== WorkflowTriggerType.WEBHOOK) {
              throw new WorkflowTriggerException(
                `[Webhook trigger] Workflow ${workflowId} does not have a Webhook trigger in workspace ${workspaceId}`,
                WorkflowTriggerExceptionCode.INVALID_WORKFLOW_TRIGGER,
              );
            }

            if (workflowVersion.status !== WorkflowVersionStatus.ACTIVE) {
              throw new WorkflowTriggerException(
                `[Webhook trigger] Workflow version ${workflowVersion.id} is not active in workspace ${workspaceId}`,
                WorkflowTriggerExceptionCode.INVALID_WORKFLOW_STATUS,
              );
            }

            return { workflow, workflowVersion };
          },
          authContext,
        );

      if (
        workflowVersion.trigger?.type === WorkflowTriggerType.WEBHOOK &&
        workflowVersion.trigger.settings.authentication === 'API_KEY'
      ) {
        await this.assertWorkspaceApiKey(request, workspaceId);
      }

      const { workflowRunId } =
        await this.workflowTriggerWorkspaceService.runWorkflowVersion({
          workflowVersionId: workflow.lastPublishedVersionId!,
          payload: payload || {},
          createdBy: {
            source: FieldActorSource.WEBHOOK,
            workspaceMemberId: null,
            name: 'Webhook',
            context: {},
          },
          workspaceId,
        });

      return {
        workflowName: workflow.name,
        success: true,
        workflowRunId,
      };
    } catch (error) {
      this.rethrowWorkspaceNotFoundAsTriggerException(error, workspaceId);
    }
  }

  private async assertWorkspaceApiKey(
    request: Request,
    workspaceId: string,
  ): Promise<void> {
    const authorizationHeader = request.headers.authorization;
    const token =
      typeof authorizationHeader === 'string' &&
      authorizationHeader.startsWith('Bearer ')
        ? authorizationHeader.slice('Bearer '.length).trim()
        : '';

    if (!token) {
      throw new WorkflowTriggerException(
        `[Webhook trigger] API key is required for workflow webhook in workspace ${workspaceId}`,
        WorkflowTriggerExceptionCode.FORBIDDEN,
      );
    }

    try {
      const payload = await this.jwtWrapperService.verifyJwtToken(token);
      const tokenType = payload?.type as string | undefined;
      const tokenWorkspaceId =
        typeof payload?.workspaceId === 'string'
          ? payload.workspaceId
          : typeof payload?.sub === 'string'
            ? payload.sub
            : null;

      if (isDefined(tokenType) && tokenType !== JwtTokenTypeEnum.API_KEY) {
        throw new WorkflowTriggerException(
          `[Webhook trigger] API key is required for workflow webhook in workspace ${workspaceId}`,
          WorkflowTriggerExceptionCode.FORBIDDEN,
        );
      }

      if (tokenWorkspaceId !== workspaceId) {
        throw new WorkflowTriggerException(
          `[Webhook trigger] API key workspace does not match webhook workspace ${workspaceId}`,
          WorkflowTriggerExceptionCode.FORBIDDEN,
        );
      }

      const { apiKeyMap } = await this.workspaceCacheService.getOrRecompute(
        workspaceId,
        ['apiKeyMap'],
      );
      const apiKeyId =
        typeof payload?.jti === 'string' ? payload.jti : undefined;
      const apiKey = apiKeyId ? apiKeyMap[apiKeyId] : undefined;

      if (
        !apiKey ||
        apiKey.revokedAt ||
        new Date(apiKey.expiresAt) < new Date()
      ) {
        throw new WorkflowTriggerException(
          `[Webhook trigger] API key is invalid for workspace ${workspaceId}`,
          WorkflowTriggerExceptionCode.FORBIDDEN,
        );
      }
    } catch (error) {
      if (error instanceof WorkflowTriggerException) {
        throw error;
      }

      throw new WorkflowTriggerException(
        `[Webhook trigger] API key is invalid for workspace ${workspaceId}`,
        WorkflowTriggerExceptionCode.FORBIDDEN,
      );
    }
  }

  private rethrowWorkspaceNotFoundAsTriggerException(
    error: unknown,
    workspaceId: string,
  ): never {
    if (
      error instanceof DiexORMException &&
      [
        DiexORMExceptionCode.WORKSPACE_NOT_FOUND,
        DiexORMExceptionCode.WORKSPACE_SCHEMA_NOT_FOUND,
      ].includes(error.code)
    ) {
      throw new WorkflowTriggerException(
        `[Webhook trigger] Workspace ${workspaceId} not found`,
        WorkflowTriggerExceptionCode.NOT_FOUND,
      );
    }

    throw error;
  }
}
