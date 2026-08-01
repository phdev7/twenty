import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class InboxConversationEventWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  eventType: string | null;
  summary: string | null;
  details: string | null;
  occurredAt: string | null;
}
