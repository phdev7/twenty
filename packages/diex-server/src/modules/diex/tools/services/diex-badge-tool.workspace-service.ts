import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { createListDiexBadgesTool } from 'src/modules/diex/tools/list-diex-badges.tool';
import { createSetDiexBadgesTool } from 'src/modules/diex/tools/set-diex-badges.tool';

@Injectable()
export class DiexBadgeToolWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  generateBadgeTools(workspaceId: string): ToolSet {
    const listTool = createListDiexBadgesTool(
      this.flatEntityMapsCacheService,
      workspaceId,
    );
    const setTool = createSetDiexBadgesTool(
      this.globalWorkspaceOrmManager,
      this.flatEntityMapsCacheService,
      workspaceId,
    );

    return { [listTool.name]: listTool, [setTool.name]: setTool };
  }
}
