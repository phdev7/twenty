import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class InboxMentionWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  excerpt: string | null;
  status: string | null;
  mentionedAt: string | null;
  readAt: string | null;
  resolvedAt: string | null;
}
