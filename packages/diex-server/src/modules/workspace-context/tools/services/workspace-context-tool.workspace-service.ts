import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { createGetWorkspaceContextTool } from 'src/modules/workspace-context/tools/get-workspace-context.tool';
import { type WorkspaceContextToolDependencies } from 'src/modules/workspace-context/tools/types/workspace-context-tool-dependencies.type';

@Injectable()
export class WorkspaceContextToolWorkspaceService {
  private readonly deps: WorkspaceContextToolDependencies;

  constructor(globalWorkspaceOrmManager: GlobalWorkspaceOrmManager) {
    this.deps = { globalWorkspaceOrmManager };
  }

  generateWorkspaceContextTools(workspaceId: string): ToolSet {
    const context = { workspaceId };

    const getWorkspaceContext = createGetWorkspaceContextTool(
      this.deps,
      context,
    );

    return {
      [getWorkspaceContext.name]: getWorkspaceContext,
    };
  }
}
