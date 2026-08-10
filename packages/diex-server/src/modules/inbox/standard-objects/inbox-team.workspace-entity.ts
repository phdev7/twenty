import { BaseWorkspaceEntity } from 'src/engine/diex-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxAutomationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-automation.workspace-entity';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type InboxMacroWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-macro.workspace-entity';
import { type InboxTeamMemberWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team-member.workspace-entity';

export class InboxTeamWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  key: string | null;
  description: string | null;
  status: string | null;
  routingStrategy: string | null;
  defaultResponseSlaMinutes: number | null;
  isDefault: boolean | null;
  inboxAutomations: EntityRelation<InboxAutomationWorkspaceEntity[]>;
  inboxConversations: EntityRelation<InboxConversationWorkspaceEntity[]>;
  inboxMacros: EntityRelation<InboxMacroWorkspaceEntity[]>;
  memberships: EntityRelation<InboxTeamMemberWorkspaceEntity[]>;
}
