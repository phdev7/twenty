import { type EmailAttachment } from 'diex-shared/types';
import { type EmailRecipients } from 'diex-shared/workflow';

export type WorkflowSendEmailActionInput = {
  connectedAccountId: string;
  recipients: EmailRecipients;
  subject?: string;
  body?: string;
  files?: EmailAttachment[];
  inReplyTo?: string;
};
