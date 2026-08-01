import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxMacroWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-macro.workspace-entity';

export class InboxSavedReplyWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  shortcut: string | null;
  body: string | null;
  status: string | null;
  channel: string | null;
  category: string | null;
  usageCount: number | null;
  lastUsedAt: string | null;
  inboxMacros: EntityRelation<InboxMacroWorkspaceEntity[]>;
}
