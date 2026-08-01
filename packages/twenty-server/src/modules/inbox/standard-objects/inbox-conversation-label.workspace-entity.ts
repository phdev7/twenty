import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class InboxConversationLabelWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  isActive: boolean | null;
  assignedAt: string | null;
  removedAt: string | null;
}
