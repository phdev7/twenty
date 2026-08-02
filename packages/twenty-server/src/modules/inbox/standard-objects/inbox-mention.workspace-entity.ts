import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class InboxMentionWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  excerpt: string | null;
  status: string | null;
  mentionedAt: string | null;
  readAt: string | null;
  resolvedAt: string | null;
  inboxConversation: EntityRelation<InboxConversationWorkspaceEntity> | null;
  inboxConversationId: string | null;
  inboxMessage: EntityRelation<InboxMessageWorkspaceEntity> | null;
  inboxMessageId: string | null;
  authorWorkspaceMember: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  authorWorkspaceMemberId: string | null;
  mentionedWorkspaceMember: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  mentionedWorkspaceMemberId: string | null;
}
