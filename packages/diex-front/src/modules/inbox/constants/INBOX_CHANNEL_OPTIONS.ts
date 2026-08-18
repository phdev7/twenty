import { type InboxChannel } from '@/inbox/types/inboxEntityTypes';

// Mirrors the channel select of the inboxConversation standard object. The list
// is duplicated here because the option labels are part of the product copy and
// the field metadata is only resolved per workspace.
export const INBOX_CHANNEL_OPTIONS: { value: InboxChannel; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'WEBCHAT', label: 'Chat do site' },
  { value: 'SMS', label: 'SMS' },
  { value: 'TIKTOK', label: 'TikTok' },
];
