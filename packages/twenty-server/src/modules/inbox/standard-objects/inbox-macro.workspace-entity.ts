import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

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
}
