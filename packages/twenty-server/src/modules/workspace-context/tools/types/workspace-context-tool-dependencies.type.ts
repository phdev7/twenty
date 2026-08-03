import type { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

export type WorkspaceContextToolDependencies = {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
};

export type WorkspaceContextToolContext = {
  workspaceId: string;
};
