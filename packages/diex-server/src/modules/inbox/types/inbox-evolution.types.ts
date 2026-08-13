export type WhatsappProvisioning = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  webhookSecret: string;
};

export type InboxMessageDirection = 'INBOUND' | 'OUTBOUND';

export type InboxMessageType =
  | 'TEXT'
  | 'AUDIO'
  | 'IMAGE'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'REACTION'
  | 'SYSTEM';

export type InboxMessageDeliveryStatus =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'RECEIVED';

export type InboxTranscriptionStatus =
  | 'PENDING'
  | 'DONE'
  | 'FAILED'
  | 'UNAVAILABLE';

export type NormalizedEvolutionMessage = {
  providerMessageKey: string;
  providerThreadKey: string;
  instanceName: string;
  eventName: string;
  remoteJid: string;
  contactHandle: string;
  normalizedPhone: string | null;
  direction: InboxMessageDirection;
  type: InboxMessageType;
  body: string | null;
  sentAt: string;
  senderDisplayName: string | null;
  deliveryStatus: InboxMessageDeliveryStatus;
  payloadFingerprint: string;
};

export type NormalizedEvolutionStatus = {
  providerMessageKey: string;
  deliveryStatus: InboxMessageDeliveryStatus;
};

export type ProcessEvolutionWebhookResult = {
  received: number;
  inboundMessages: number;
  createdMessages: number;
  duplicateMessages: number;
  updatedStatuses: number;
  automationsApplied: number;
  automationWarnings: string[];
  ignored: number;
};

export type IngestMessageResult = {
  status: 'CREATED' | 'DUPLICATE';
  messageId?: string;
  automationsApplied: number;
  automationWarnings: string[];
};

export type EvolutionMedia = {
  base64: string;
  mimeType: string;
  fileName: string | null;
};

export type EvolutionWebhookRegistration = {
  configured: true;
  instanceName: string;
  webhookUrl: string;
  providerStatus: number;
  events: readonly string[];
};

export type WhatsappConnectionState =
  | 'CONNECTED'
  | 'AWAITING_SCAN'
  | 'CONNECTING'
  | 'NOT_PROVISIONED'
  | 'UNAVAILABLE';

export type WhatsappConnectionResult = {
  state: WhatsappConnectionState;
  instanceName: string | null;
  phone: string | null;
  // Data URI for an <img>. Rendered only inside authenticated workspace
  // surfaces: a WhatsApp QR is a live credential.
  qrCodeDataUri: string | null;
  validatedAt?: string | null;
  message: string;
};

export type SyncEvolutionMessagesResult = {
  fetched: number;
  considered: number;
  createdMessages: number;
  duplicateMessages: number;
  transcribedAudios: number;
  watermark: string;
  message: string;
};

export type TranscribePendingAudiosResult = {
  transcribed: number;
  unavailable: number;
  failed: number;
};

export type MarkBreachedResponseSlasResult = {
  marked: number;
};

export type SendEvolutionTextResult =
  | {
      previewOnly: true;
      conversationId: string;
      destination: string;
      textPreview: string;
      expiresAt: string;
      confirmationToken: string;
      message: string;
    }
  | {
      previewOnly: false;
      sent: boolean;
      conversationId: string;
      inboxMessageId?: string;
      providerMessageKey?: string;
      sentAt?: string;
      message: string;
    };
