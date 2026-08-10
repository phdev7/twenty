import { type EmailRecipients } from 'diex-shared/workflow';

export type EmailDraftPrefill = EmailRecipients & {
  messageId: string;
  subject: string;
  body: string;
};
