import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

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
}
