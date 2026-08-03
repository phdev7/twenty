import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { createCalculateCommercialScoreTool } from 'src/modules/commercial-intelligence/tools/calculate-commercial-score.tool';
import { createGetCommercialPrioritiesTool } from 'src/modules/commercial-intelligence/tools/get-commercial-priorities.tool';
import { type CommercialIntelligenceToolDependencies } from 'src/modules/commercial-intelligence/tools/types/commercial-intelligence-tool-dependencies.type';

@Injectable()
export class CommercialIntelligenceToolWorkspaceService {
  private readonly deps: CommercialIntelligenceToolDependencies;

  constructor(globalWorkspaceOrmManager: GlobalWorkspaceOrmManager) {
    this.deps = { globalWorkspaceOrmManager };
  }

  generateCommercialIntelligenceTools(workspaceId: string): ToolSet {
    const context = { workspaceId };

    const calculateCommercialScore = createCalculateCommercialScoreTool();
    const getCommercialPriorities = createGetCommercialPrioritiesTool(
      this.deps,
      context,
    );

    return {
      [calculateCommercialScore.name]: calculateCommercialScore,
      [getCommercialPriorities.name]: getCommercialPriorities,
    };
  }
}
