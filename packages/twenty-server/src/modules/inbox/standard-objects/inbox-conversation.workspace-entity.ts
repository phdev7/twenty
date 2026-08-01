import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { type InboxConversationEventWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation-event.workspace-entity';
import { type InboxTeamWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team.workspace-entity';
import { type InboxConversationLabelWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation-label.workspace-entity';
import { type InboxMentionWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-mention.workspace-entity';
import { type InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';

export class InboxConversationWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  providerThreadKey: string | null;
  channel: string | null;
  provider: string | null;
  status: string | null;
  priority: string | null;
  contactHandle: string | null;
  unreadCount: number | null;
  lastMessagePreview: string | null;
  lastMessageDirection: string | null;
  lastMessageAt: string | null;
  firstResponseDueAt: string | null;
  firstRespondedAt: string | null;
  followUpDueAt: string | null;
  snoozedUntil: string | null;
  slaBreachedAt: string | null;
  metadata: Record<string, unknown> | null;
  diexAiActions: EntityRelation<AiActionWorkspaceEntity[]>;
  conversationEvents: EntityRelation<InboxConversationEventWorkspaceEntity[]>;
  inboxTeam: EntityRelation<InboxTeamWorkspaceEntity> | null;
  inboxTeamId: string | null;
  labelAssignments: EntityRelation<InboxConversationLabelWorkspaceEntity[]>;
  mentions: EntityRelation<InboxMentionWorkspaceEntity[]>;
  messages: EntityRelation<InboxMessageWorkspaceEntity[]>;
}
