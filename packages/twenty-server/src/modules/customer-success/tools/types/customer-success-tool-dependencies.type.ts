import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

export type CustomerSuccessToolDependencies = {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
};

export type CustomerSuccessToolContext = {
  workspaceId: string;
};
