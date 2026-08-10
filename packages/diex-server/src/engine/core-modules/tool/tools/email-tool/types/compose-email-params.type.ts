import { type EmailAttachment } from 'diex-shared/types';

export type ComposeEmailParams = {
  recipients: {
    to: string;
    cc?: string;
    bcc?: string;
  };
  subject: string;
  body: string;
  connectedAccountId?: string;
  files?: Array<EmailAttachment>;
  inReplyTo?: string;
};
