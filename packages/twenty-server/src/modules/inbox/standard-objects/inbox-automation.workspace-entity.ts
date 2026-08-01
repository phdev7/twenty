import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxLabelWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-label.workspace-entity';
import { type InboxTeamWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team.workspace-entity';

export class InboxAutomationWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  key: string | null;
  description: string | null;
  status: string | null;
  trigger: string | null;
  channel: string | null;
  keywords: string | null;
  crmCondition: string | null;
  onlyIfUnassigned: boolean | null;
  targetConversationStatus: string | null;
  targetPriority: string | null;
  followUpDelayMinutes: number | null;
  taskTitleTemplate: string | null;
  taskDueDelayMinutes: number | null;
  internalNoteTemplate: string | null;
  stopAfterMatch: boolean | null;
  executionOrder: number | null;
  runCount: number | null;
  lastRunAt: string | null;
  inboxLabel: EntityRelation<InboxLabelWorkspaceEntity> | null;
  inboxLabelId: string | null;
  inboxTeam: EntityRelation<InboxTeamWorkspaceEntity> | null;
  inboxTeamId: string | null;
}
