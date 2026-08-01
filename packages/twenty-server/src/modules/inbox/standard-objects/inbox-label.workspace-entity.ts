import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxConversationLabelWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation-label.workspace-entity';
import { type InboxAutomationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-automation.workspace-entity';
import { type InboxMacroWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-macro.workspace-entity';

export class InboxLabelWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  slug: string | null;
  color: string | null;
  description: string | null;
  status: string | null;
  usageCount: number | null;
  conversationAssignments: EntityRelation<
    InboxConversationLabelWorkspaceEntity[]
  >;
  inboxAutomations: EntityRelation<InboxAutomationWorkspaceEntity[]>;
  inboxMacros: EntityRelation<InboxMacroWorkspaceEntity[]>;
}
