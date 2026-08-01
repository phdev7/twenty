import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type InboxMentionWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-mention.workspace-entity';

export class InboxMessageWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  providerMessageKey: string | null;
  direction: string | null;
  messageType: string | null;
  body: string | null;
  deliveryStatus: string | null;
  sentAt: string | null;
  senderHandle: string | null;
  senderDisplayName: string | null;
  mediaUrl: string | null;
  transcription: string | null;
  transcriptionStatus: string | null;
  isInternalNote: boolean | null;
  metadata: Record<string, unknown> | null;
  providerPayloadFingerprint: string | null;
  inboxConversation: EntityRelation<InboxConversationWorkspaceEntity> | null;
  inboxConversationId: string | null;
  mentions: EntityRelation<InboxMentionWorkspaceEntity[]>;
}
