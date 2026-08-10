import {
  type InboxLabel,
  type InboxSavedReply,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';

export type InboxMacro = {
  id: string;
  name: string;
  shortcut: string;
  description?: string | null;
  status: string;
  channel: string;
  targetConversationStatus: string;
  targetPriority: string;
  internalNoteTemplate?: string | null;
  usageCount: number;
  lastUsedAt?: string | null;
  savedReply?: InboxSavedReply | null;
  inboxLabel?: InboxLabel | null;
  inboxTeam?: InboxTeam | null;
  assignee?: InboxWorkspaceMember | null;
};

export type InboxMacroPreview = {
  macroId: string;
  actions: string[];
  replyDraft?: string | null;
  internalNote?: string | null;
  unresolvedReplyVariables: string[];
  unresolvedNoteVariables: string[];
};

export type InboxMacroApplyResult = {
  macroId: string;
  appliedActions: string[];
  warnings: string[];
  replyDraft?: string | null;
  unresolvedReplyVariables: string[];
};

export type SavedReplyRenderResult = {
  text: string;
  unresolvedVariables: string[];
};
