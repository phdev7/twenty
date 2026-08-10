import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { createGetRenewalPrioritiesTool } from 'src/modules/renewal/tools/get-renewal-priorities.tool';

@Injectable()
export class RenewalToolWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  generateRenewalTools(workspaceId: string): ToolSet {
    const tool = createGetRenewalPrioritiesTool(
      this.globalWorkspaceOrmManager,
      workspaceId,
    );

    return { [tool.name]: tool };
  }
}
