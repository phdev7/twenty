import type { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';

export type CommercialIntelligenceToolDependencies = {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
};

export type CommercialIntelligenceToolContext = {
  workspaceId: string;
};
