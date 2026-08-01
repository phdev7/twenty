import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class InboxSavedReplyWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  shortcut: string | null;
  body: string | null;
  status: string | null;
  channel: string | null;
  category: string | null;
  usageCount: number | null;
  lastUsedAt: string | null;
}
