import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type InboxLabelWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-label.workspace-entity';

export class InboxConversationLabelWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  isActive: boolean | null;
  assignedAt: string | null;
  removedAt: string | null;
  inboxConversation: EntityRelation<InboxConversationWorkspaceEntity> | null;
  inboxConversationId: string | null;
  inboxLabel: EntityRelation<InboxLabelWorkspaceEntity> | null;
  inboxLabelId: string | null;
}
