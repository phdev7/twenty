import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

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
}
