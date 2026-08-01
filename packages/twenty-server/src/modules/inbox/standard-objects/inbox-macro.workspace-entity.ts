import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxLabelWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-label.workspace-entity';
import { type InboxTeamWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team.workspace-entity';
import { type InboxSavedReplyWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-saved-reply.workspace-entity';

export class InboxMacroWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  shortcut: string | null;
  description: string | null;
  status: string | null;
  channel: string | null;
  targetConversationStatus: string | null;
  targetPriority: string | null;
  internalNoteTemplate: string | null;
  usageCount: number | null;
  lastUsedAt: string | null;
  inboxLabel: EntityRelation<InboxLabelWorkspaceEntity> | null;
  inboxLabelId: string | null;
  inboxTeam: EntityRelation<InboxTeamWorkspaceEntity> | null;
  inboxTeamId: string | null;
  savedReply: EntityRelation<InboxSavedReplyWorkspaceEntity> | null;
  savedReplyId: string | null;
}
