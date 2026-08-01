export type EvolutionTextPreview = {
  previewOnly: true;
  conversationId: string;
  destination: string;
  textPreview: string;
  expiresAt: string;
  confirmationToken: string;
  message: string;
};

export type EvolutionTextReceipt = {
  previewOnly: false;
  sent: boolean;
  conversationId: string;
  inboxMessageId?: string;
  providerMessageKey?: string;
  sentAt?: string;
  message: string;
};

export type InboxExternalMessagePreview =
  | (EvolutionTextPreview & {
      channel: 'WHATSAPP';
      subjectPreview?: null;
    })
  | {
      previewOnly: true;
      channel: 'EMAIL';
      conversationId: string;
      destination: string;
      subjectPreview: string;
      textPreview: string;
      connectedAccountId: string;
      messageChannelId: string;
      inReplyTo?: string | null;
      expiresAt: string;
      confirmationToken: string;
      message: string;
    };

export type EvolutionMediaPayload = {
  inboxMessageId: string;
  mimeType: string;
  fileName?: string | null;
  dataUri: string;
};

export type EvolutionConfigureReceipt = {
  configured: boolean;
  instanceName: string;
  webhookUrl: string;
  providerStatus: number;
  events: string[];
};

export type InboxTriageResult = {
  conversationId: string;
  summary: string;
  intent: string;
  sentiment: string;
  urgency: number;
  signalType?: string | null;
  signalStrength: number;
  confidence: number;
  evidence: string;
  recommendedAction: string;
  suggestedReply: string;
  commercialSignalId?: string;
  aiActionId?: string;
  message: string;
};
