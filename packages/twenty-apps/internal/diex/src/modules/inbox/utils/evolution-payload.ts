import { createHash } from 'node:crypto';

import {
  InboxMessageDeliveryStatus,
  InboxMessageType,
} from 'src/modules/inbox/objects/inbox-message.object';

type JsonRecord = Record<string, unknown>;

export type NormalizedEvolutionMessage = {
  providerMessageKey: string;
  providerThreadKey: string;
  instanceName: string;
  eventName: string;
  remoteJid: string;
  contactHandle: string;
  normalizedPhone: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
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

const asRecord = (value: unknown): JsonRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const readPath = (source: unknown, path: string): unknown => {
  let current: unknown = source;

  for (const segment of path.split('.')) {
    const record = asRecord(current);

    if (!record || !(segment in record)) {
      return undefined;
    }

    current = record[segment];
  }

  return current;
};

const firstString = (
  source: unknown,
  paths: string[],
): string | undefined => {
  for (const path of paths) {
    const value = readPath(source, path);

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
};

const readBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'yes'].includes(value.toLowerCase());
  }

  return value === 1;
};

const normalizeEventName = (eventName: string | undefined): string =>
  (eventName ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.\s-]+/g, '_');

// Only these two address a human by their number. Every other WhatsApp JID —
// the LID privacy handle, a group, a channel, a status post — carries digits
// that look like a phone and are not one, and dialing or deduplicating on them
// invents a contact that does not exist.
const PERSON_JID_SUFFIXES = ['@s.whatsapp.net', '@c.us'];
const LID_JID_SUFFIX = '@lid';
const IGNORED_JID_SUFFIXES = ['@broadcast', '@newsletter'];

const readJidSuffix = (value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  const separatorIndex = normalized.indexOf('@');

  return separatorIndex === -1 ? null : normalized.slice(separatorIndex);
};

const isLidJid = (value: string): boolean =>
  readJidSuffix(value) === LID_JID_SUFFIX;

// A status post or a channel broadcast is not somebody writing to the company,
// and an inbox that fills up with them stops being an inbox.
export const isIgnorableJid = (value: string): boolean => {
  const suffix = readJidSuffix(value);

  return suffix !== null && IGNORED_JID_SUFFIXES.includes(suffix);
};

export const normalizePhone = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }

  const suffix = readJidSuffix(value);

  if (suffix !== null && !PERSON_JID_SUFFIXES.includes(suffix)) {
    return null;
  }

  const withoutProviderSuffix = value.split('@')[0] ?? '';
  const digits = withoutProviderSuffix.replace(/\D+/g, '');

  return digits.length >= 8 ? digits : null;
};

const timestampToIso = (value: unknown): string => {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (Number.isFinite(numeric) && numeric > 0) {
    const milliseconds = numeric > 10_000_000_000 ? numeric : numeric * 1_000;
    const date = new Date(milliseconds);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  if (typeof value === 'string') {
    const parsedDate = new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return new Date().toISOString();
};

const fingerprint = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

const getMessageTypeAndBody = (
  messageItem: JsonRecord,
): { type: InboxMessageType; body: string | null } => {
  const typeHint = (
    firstString(messageItem, ['messageType', 'type']) ?? ''
  ).toLowerCase();
  const text = firstString(messageItem, [
    'message.conversation',
    'message.extendedTextMessage.text',
    'message.imageMessage.caption',
    'message.videoMessage.caption',
    'message.documentMessage.caption',
    'message.documentMessage.fileName',
    'message.reactionMessage.text',
    'body',
    'text',
  ]);

  if (
    typeHint.includes('image') ||
    readPath(messageItem, 'message.imageMessage')
  ) {
    return { type: InboxMessageType.IMAGE, body: text ?? null };
  }

  if (
    typeHint.includes('video') ||
    readPath(messageItem, 'message.videoMessage')
  ) {
    return { type: InboxMessageType.VIDEO, body: text ?? null };
  }

  if (
    typeHint.includes('audio') ||
    readPath(messageItem, 'message.audioMessage')
  ) {
    return { type: InboxMessageType.AUDIO, body: text ?? null };
  }

  if (
    typeHint.includes('document') ||
    readPath(messageItem, 'message.documentMessage')
  ) {
    return { type: InboxMessageType.DOCUMENT, body: text ?? null };
  }

  if (
    typeHint.includes('reaction') ||
    readPath(messageItem, 'message.reactionMessage')
  ) {
    return { type: InboxMessageType.REACTION, body: text ?? null };
  }

  if (
    text ||
    typeHint.includes('conversation') ||
    typeHint.includes('text')
  ) {
    return { type: InboxMessageType.TEXT, body: text ?? null };
  }

  return { type: InboxMessageType.SYSTEM, body: null };
};

const getEvolutionDataItems = (payload: JsonRecord): JsonRecord[] => {
  const data = payload.data;

  if (Array.isArray(data)) {
    return data
      .map(asRecord)
      .filter((item): item is JsonRecord => item !== null);
  }

  const dataRecord = asRecord(data);
  const nestedMessages = asArray(dataRecord?.messages);

  if (nestedMessages.length > 0) {
    return nestedMessages
      .map(asRecord)
      .filter((item): item is JsonRecord => item !== null);
  }

  return dataRecord ? [dataRecord] : [payload];
};

// When the chat is addressed by LID, the phone travels beside it in
// remoteJidAlt. The phone is the identity the CRM already knows the person by,
// so it wins whenever the provider sends it.
const readContactJid = (item: JsonRecord): string => {
  const phoneCandidate = firstString(item, [
    'key.remoteJidAlt',
    'key.senderPn',
    'key.participantAlt',
    'key.participantPn',
  ]);

  if (phoneCandidate && !isLidJid(phoneCandidate)) {
    return phoneCandidate;
  }

  return (
    firstString(item, ['key.remoteJid', 'remoteJid', 'chatId', 'sender']) ?? ''
  );
};

export const extractEvolutionInstanceName = (
  payload: unknown,
): string | null => {
  const instanceName = firstString(payload, [
    'instance',
    'instanceName',
    'data.instance',
    'sender',
  ]);

  return instanceName ?? null;
};

export const normalizeEvolutionMessages = (
  payload: unknown,
): NormalizedEvolutionMessage[] => {
  const payloadRecord = asRecord(payload);

  if (!payloadRecord) {
    return [];
  }

  const eventName = normalizeEventName(
    firstString(payloadRecord, ['event', 'type']),
  );

  if (
    eventName &&
    !eventName.includes('messages_upsert') &&
    !eventName.includes('messages_set') &&
    !eventName.includes('send_message')
  ) {
    return [];
  }

  const instanceName = extractEvolutionInstanceName(payloadRecord) ?? '';

  return getEvolutionDataItems(payloadRecord).flatMap((item) => {
    const remoteJid = readContactJid(item);
    const externalMessageId =
      firstString(item, ['key.id', 'id', 'messageId']) ?? fingerprint(item);

    if (
      !remoteJid ||
      !externalMessageId ||
      !instanceName ||
      isIgnorableJid(remoteJid)
    ) {
      return [];
    }

    const fromMe = readBoolean(
      readPath(item, 'key.fromMe') ?? readPath(item, 'fromMe'),
    );
    const message = getMessageTypeAndBody(item);
    const normalizedPhone = normalizePhone(remoteJid);
    const senderDisplayName =
      firstString(item, [
        'pushName',
        'contactName',
        'name',
        'contact.name',
      ]) ?? null;
    const sentAt = timestampToIso(
      readPath(item, 'messageTimestamp') ??
        readPath(item, 'timestamp') ??
        readPath(payloadRecord, 'date_time'),
    );

    return [
      {
        providerMessageKey: `${instanceName}:${externalMessageId}`,
        providerThreadKey: `${instanceName}:${remoteJid}`,
        instanceName,
        eventName,
        remoteJid,
        contactHandle: normalizedPhone ?? remoteJid,
        normalizedPhone,
        direction: fromMe ? 'OUTBOUND' : 'INBOUND',
        type: message.type,
        body: message.body,
        sentAt,
        senderDisplayName,
        deliveryStatus: fromMe
          ? InboxMessageDeliveryStatus.SENT
          : InboxMessageDeliveryStatus.RECEIVED,
        payloadFingerprint: fingerprint(item),
      },
    ];
  });
};

const mapDeliveryStatus = (
  value: string | undefined,
): InboxMessageDeliveryStatus | null => {
  const normalized = (value ?? '').trim().toUpperCase();

  if (
    ['ERROR', 'FAILED', 'FAILURE', '-1'].includes(normalized) ||
    normalized.includes('ERROR')
  ) {
    return InboxMessageDeliveryStatus.FAILED;
  }

  if (
    ['READ', 'PLAYED', 'READ_ACK', '3', '4'].includes(normalized) ||
    normalized.includes('READ')
  ) {
    return InboxMessageDeliveryStatus.READ;
  }

  if (
    ['DELIVERED', 'DELIVERY_ACK', '2'].includes(normalized) ||
    normalized.includes('DELIVER')
  ) {
    return InboxMessageDeliveryStatus.DELIVERED;
  }

  if (
    ['SENT', 'SERVER_ACK', '1'].includes(normalized) ||
    normalized.includes('SENT')
  ) {
    return InboxMessageDeliveryStatus.SENT;
  }

  if (['PENDING', 'QUEUED', '0'].includes(normalized)) {
    return InboxMessageDeliveryStatus.QUEUED;
  }

  return null;
};

export const normalizeEvolutionStatuses = (
  payload: unknown,
): NormalizedEvolutionStatus[] => {
  const payloadRecord = asRecord(payload);

  if (!payloadRecord) {
    return [];
  }

  const eventName = normalizeEventName(
    firstString(payloadRecord, ['event', 'type']),
  );

  if (
    eventName &&
    !eventName.includes('messages_update') &&
    !eventName.includes('message_status') &&
    !eventName.includes('status')
  ) {
    return [];
  }

  const instanceName = extractEvolutionInstanceName(payloadRecord) ?? '';

  return getEvolutionDataItems(payloadRecord).flatMap((item) => {
    const externalMessageId = firstString(item, [
      'key.id',
      'id',
      'messageId',
    ]);
    const deliveryStatus = mapDeliveryStatus(
      firstString(item, ['status', 'update.status', 'state']),
    );

    if (!instanceName || !externalMessageId || !deliveryStatus) {
      return [];
    }

    return [
      {
        providerMessageKey: `${instanceName}:${externalMessageId}`,
        deliveryStatus,
      },
    ];
  });
};

export const buildMessagePreview = (
  message: NormalizedEvolutionMessage,
): string => {
  const fallbackByType: Record<InboxMessageType, string> = {
    [InboxMessageType.TEXT]: 'Mensagem de texto',
    [InboxMessageType.AUDIO]: 'Áudio',
    [InboxMessageType.IMAGE]: 'Imagem',
    [InboxMessageType.VIDEO]: 'Vídeo',
    [InboxMessageType.DOCUMENT]: 'Documento',
    [InboxMessageType.REACTION]: 'Reação',
    [InboxMessageType.SYSTEM]: 'Evento do sistema',
  };
  const preview = message.body?.trim() || fallbackByType[message.type];

  return preview.slice(0, 250);
};
