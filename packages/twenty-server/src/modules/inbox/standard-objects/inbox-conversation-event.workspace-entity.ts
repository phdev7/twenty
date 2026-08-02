import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class InboxConversationEventWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  eventType: string | null;
  summary: string | null;
  details: string | null;
  occurredAt: string | null;
  inboxConversation: EntityRelation<InboxConversationWorkspaceEntity> | null;
  inboxConversationId: string | null;
  actor: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  actorId: string | null;
}
