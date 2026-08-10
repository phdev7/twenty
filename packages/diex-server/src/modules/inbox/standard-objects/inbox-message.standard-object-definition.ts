import { type ObjectManifest } from 'diex-shared/application';
import { FieldMetadataType } from 'diex-shared/types';

import {
  INBOX_MESSAGE_FIELD_IDS,
  INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  INBOX_OPTION_IDS,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';
import { InboxMessageDirection } from 'src/modules/inbox/standard-objects/inbox-conversation.standard-object-definition';

export enum InboxMessageType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  REACTION = 'REACTION',
  SYSTEM = 'SYSTEM',
}

export enum InboxTranscriptionStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum InboxMessageDeliveryStatus {
  RECEIVED = 'RECEIVED',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export const InboxMessageStandardObjectDefinition = {
  universalIdentifier: INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxMessage' as const,
  namePlural: 'inboxMessages',
  labelSingular: 'Mensagem da inbox',
  labelPlural: 'Mensagens da inbox',
  description:
    'Mensagem comercial recebida, enviada ou registrada internamente na inbox.',
  icon: 'IconMessage',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: INBOX_MESSAGE_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.name,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Resumo',
      icon: 'IconMessage',
      defaultValue: "'Mensagem'",
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.providerMessageKey,
      type: FieldMetadataType.TEXT,
      name: 'providerMessageKey',
      label: 'Chave externa da mensagem',
      description:
        'Chave idempotente composta pelo provedor, instância e identificador externo.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.direction,
      type: FieldMetadataType.SELECT,
      name: 'direction',
      label: 'Direção',
      icon: 'IconArrowsExchange',
      defaultValue: `'${InboxMessageDirection.INBOUND}'`,
      options: [
        {
          id: INBOX_OPTION_IDS.messageDirection.inbound,
          value: InboxMessageDirection.INBOUND,
          label: 'Recebida',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_OPTION_IDS.messageDirection.outbound,
          value: InboxMessageDirection.OUTBOUND,
          label: 'Enviada',
          position: 1,
          color: 'blue',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.type,
      type: FieldMetadataType.SELECT,
      name: 'messageType',
      label: 'Tipo',
      icon: 'IconCategory',
      defaultValue: `'${InboxMessageType.TEXT}'`,
      options: [
        {
          id: INBOX_OPTION_IDS.messageType.text,
          value: InboxMessageType.TEXT,
          label: 'Texto',
          position: 0,
          color: 'blue',
        },
        {
          id: INBOX_OPTION_IDS.messageType.audio,
          value: InboxMessageType.AUDIO,
          label: 'Áudio',
          position: 1,
          color: 'purple',
        },
        {
          id: INBOX_OPTION_IDS.messageType.image,
          value: InboxMessageType.IMAGE,
          label: 'Imagem',
          position: 2,
          color: 'green',
        },
        {
          id: INBOX_OPTION_IDS.messageType.video,
          value: InboxMessageType.VIDEO,
          label: 'Vídeo',
          position: 3,
          color: 'orange',
        },
        {
          id: INBOX_OPTION_IDS.messageType.document,
          value: InboxMessageType.DOCUMENT,
          label: 'Documento',
          position: 4,
          color: 'gray',
        },
        {
          id: INBOX_OPTION_IDS.messageType.reaction,
          value: InboxMessageType.REACTION,
          label: 'Reação',
          position: 5,
          color: 'yellow',
        },
        {
          id: INBOX_OPTION_IDS.messageType.system,
          value: InboxMessageType.SYSTEM,
          label: 'Sistema',
          position: 6,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.body,
      type: FieldMetadataType.TEXT,
      name: 'body',
      label: 'Conteúdo',
      icon: 'IconNotes',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.deliveryStatus,
      type: FieldMetadataType.SELECT,
      name: 'deliveryStatus',
      label: 'Entrega',
      icon: 'IconChecks',
      defaultValue: `'${InboxMessageDeliveryStatus.RECEIVED}'`,
      options: [
        {
          id: INBOX_OPTION_IDS.deliveryStatus.received,
          value: InboxMessageDeliveryStatus.RECEIVED,
          label: 'Recebida',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_OPTION_IDS.deliveryStatus.queued,
          value: InboxMessageDeliveryStatus.QUEUED,
          label: 'Na fila',
          position: 1,
          color: 'gray',
        },
        {
          id: INBOX_OPTION_IDS.deliveryStatus.sent,
          value: InboxMessageDeliveryStatus.SENT,
          label: 'Enviada',
          position: 2,
          color: 'blue',
        },
        {
          id: INBOX_OPTION_IDS.deliveryStatus.delivered,
          value: InboxMessageDeliveryStatus.DELIVERED,
          label: 'Entregue',
          position: 3,
          color: 'green',
        },
        {
          id: INBOX_OPTION_IDS.deliveryStatus.read,
          value: InboxMessageDeliveryStatus.READ,
          label: 'Lida',
          position: 4,
          color: 'blue',
        },
        {
          id: INBOX_OPTION_IDS.deliveryStatus.failed,
          value: InboxMessageDeliveryStatus.FAILED,
          label: 'Falhou',
          position: 5,
          color: 'red',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.sentAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'sentAt',
      label: 'Enviada em',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.senderHandle,
      type: FieldMetadataType.TEXT,
      name: 'senderHandle',
      label: 'Endereço do remetente',
      icon: 'IconPhone',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.senderDisplayName,
      type: FieldMetadataType.TEXT,
      name: 'senderDisplayName',
      label: 'Remetente',
      icon: 'IconUser',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.mediaUrl,
      type: FieldMetadataType.TEXT,
      name: 'mediaUrl',
      label: 'Mídia',
      description:
        'URL já autorizada ou identificador seguro; nunca uma credencial do provedor.',
      icon: 'IconPaperclip',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.transcription,
      type: FieldMetadataType.TEXT,
      name: 'transcription',
      label: 'Transcrição',
      description:
        'Texto do áudio, para o histórico ser legível e a IA entender o que o cliente falou.',
      icon: 'IconFileText',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.transcriptionStatus,
      type: FieldMetadataType.SELECT,
      name: 'transcriptionStatus',
      label: 'Status da transcrição',
      description:
        'Controla o que já foi transcrito, para o mesmo áudio não ser reenviado ao provedor a cada ciclo.',
      icon: 'IconWaveSine',
      isNullable: true,
      options: [
        {
          id: INBOX_OPTION_IDS.transcriptionStatus.pending,
          value: InboxTranscriptionStatus.PENDING,
          label: 'Pendente',
          position: 0,
          color: 'gray',
        },
        {
          id: INBOX_OPTION_IDS.transcriptionStatus.done,
          value: InboxTranscriptionStatus.DONE,
          label: 'Transcrito',
          position: 1,
          color: 'green',
        },
        {
          id: INBOX_OPTION_IDS.transcriptionStatus.failed,
          value: InboxTranscriptionStatus.FAILED,
          label: 'Falhou',
          position: 2,
          color: 'red',
        },
        {
          id: INBOX_OPTION_IDS.transcriptionStatus.unavailable,
          value: InboxTranscriptionStatus.UNAVAILABLE,
          label: 'Indisponível',
          position: 3,
          color: 'orange',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.isInternalNote,
      type: FieldMetadataType.BOOLEAN,
      name: 'isInternalNote',
      label: 'Nota interna',
      icon: 'IconLock',
      defaultValue: false,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.metadata,
      type: FieldMetadataType.RAW_JSON,
      name: 'metadata',
      label: 'Metadados seguros',
      description:
        'Metadados operacionais já redigidos; nunca deve armazenar credenciais ou payload bruto.',
      icon: 'IconBraces',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MESSAGE_FIELD_IDS.providerPayloadFingerprint,
      type: FieldMetadataType.TEXT,
      name: 'providerPayloadFingerprint',
      label: 'Impressão digital do payload',
      description:
        'Hash para diagnóstico e idempotência, sem persistir o payload sensível.',
      icon: 'IconFingerprint',
      isNullable: true,
    },
  ],
} satisfies ObjectManifest;
