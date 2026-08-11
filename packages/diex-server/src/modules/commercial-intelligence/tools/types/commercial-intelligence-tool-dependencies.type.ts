import type { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import type { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';

export type CommercialIntelligenceToolDependencies = {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  workspaceArchitectureService: WorkspaceArchitectureService;
};

export type CommercialIntelligenceToolContext = {
  workspaceId: string;
};
