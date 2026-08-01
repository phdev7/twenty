import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

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
}
