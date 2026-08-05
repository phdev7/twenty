import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type ToolSet } from 'ai';
import { ToolCategory } from 'twenty-shared/ai';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { WORKSPACE_APPROVAL_TOOL_SERVICE_TOKEN } from 'src/engine/core-modules/tool-provider/constants/workspace-approval-tool-service.token';
import { type GenerateDescriptorOptions } from 'src/engine/core-modules/tool-provider/interfaces/generate-descriptor-options.type';
import { type ToolProvider } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolDescriptor } from 'src/engine/core-modules/tool-provider/types/tool-descriptor.type';
import { type ToolIndexEntry } from 'src/engine/core-modules/tool-provider/types/tool-index-entry.type';
import { executeToolFromToolSet } from 'src/engine/core-modules/tool-provider/utils/execute-tool-from-tool-set.util';
import { toolSetToDescriptors } from 'src/engine/core-modules/tool-provider/utils/tool-set-to-descriptors.util';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import type { WorkspaceApprovalToolService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-tool.service';

@Injectable()
export class DiexWorkspaceApprovalToolProvider implements ToolProvider {
  private readonly logger = new Logger(DiexWorkspaceApprovalToolProvider.name);

  readonly category = ToolCategory.DIEX;

  constructor(
    @Optional()
    @Inject(WORKSPACE_APPROVAL_TOOL_SERVICE_TOKEN)
    private readonly workspaceApprovalToolService: WorkspaceApprovalToolService | null,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // Approving a workspace is a server-level action, not a workspace-level one,
  // so role permissions are irrelevant here: only a full server admin may see
  // or run these tools.
  async isAvailable(context: ToolProviderContext): Promise<boolean> {
    return isDefined(await this.resolveServerAdmin(context));
  }

  async generateDescriptors(
    context: ToolProviderContext,
    options?: GenerateDescriptorOptions,
  ): Promise<(ToolIndexEntry | ToolDescriptor)[]> {
    const toolSet = await this.buildToolSet(context);

    if (!isDefined(toolSet)) {
      return [];
    }

    return toolSetToDescriptors(toolSet, ToolCategory.DIEX, {
      includeSchemas: options?.includeSchemas ?? true,
    });
  }

  async executeStaticTool(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolProviderContext,
  ): Promise<ToolOutput> {
    const toolSet = await this.buildToolSet(context);

    if (!isDefined(toolSet)) {
      return {
        success: false,
        message: 'Workspace approval tools are not available.',
        error: 'FORBIDDEN',
      };
    }

    return executeToolFromToolSet(toolSet, toolName, args, ToolCategory.DIEX);
  }

  private async buildToolSet(
    context: ToolProviderContext,
  ): Promise<ToolSet | null> {
    const serverAdmin = await this.resolveServerAdmin(context);

    if (
      !isDefined(serverAdmin) ||
      !isDefined(this.workspaceApprovalToolService)
    ) {
      return null;
    }

    return this.workspaceApprovalToolService.generateWorkspaceApprovalTools({
      userId: serverAdmin.id,
      canAccessFullAdminPanel: true,
    });
  }

  private async resolveServerAdmin(
    context: ToolProviderContext,
  ): Promise<UserEntity | null> {
    // The tool service is injected optionally so a resolution failure degrades to
    // "no approval tools" instead of taking the whole server down at boot. That
    // would otherwise be silent, so say it out loud: the admin panel and the
    // GraphQL mutation still work, but the AI/MCP path is gone.
    if (!isDefined(this.workspaceApprovalToolService)) {
      this.logger.warn(
        'WorkspaceApprovalToolService did not resolve; workspace approval tools are unavailable to the AI agent and MCP clients.',
      );

      return null;
    }

    if (!isDefined(context.userId)) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id: context.userId },
    });

    if (!isDefined(user) || user.canAccessFullAdminPanel !== true) {
      return null;
    }

    return user;
  }
}
