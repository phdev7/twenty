import { type GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';

export type CustomerSuccessToolDependencies = {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
};

export type CustomerSuccessToolContext = {
  workspaceId: string;
};
