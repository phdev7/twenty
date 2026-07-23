import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_FIELD_IDS,
  INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  INBOX_OPTION_IDS,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';

export enum InboxConversationChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum InboxConversationProvider {
  EVOLUTION = 'EVOLUTION',
  TWENTY_EMAIL = 'TWENTY_EMAIL',
  MANUAL = 'MANUAL',
}

export enum InboxConversationStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  SNOOZED = 'SNOOZED',
  RESOLVED = 'RESOLVED',
}

export enum InboxConversationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum InboxMessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export const INBOX_CONVERSATION_STATUS_OPTIONS = [
  {
    id: INBOX_OPTION_IDS.conversationStatus.open,
    value: InboxConversationStatus.OPEN,
    label: 'Aberta',
    position: 0,
    color: 'green' as const,
  },
  {
    id: INBOX_OPTION_IDS.conversationStatus.pending,
    value: InboxConversationStatus.PENDING,
    label: 'Pendente',
    position: 1,
    color: 'orange' as const,
  },
  {
    id: INBOX_OPTION_IDS.conversationStatus.snoozed,
    value: InboxConversationStatus.SNOOZED,
    label: 'Adiada',
    position: 2,
    color: 'blue' as const,
  },
  {
    id: INBOX_OPTION_IDS.conversationStatus.resolved,
    value: InboxConversationStatus.RESOLVED,
    label: 'Resolvida',
    position: 3,
    color: 'gray' as const,
  },
];

export default defineObject({
  universalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxConversation',
  namePlural: 'inboxConversations',
  labelSingular: 'Conversa da inbox',
  labelPlural: 'Conversas da inbox',
  description:
    'Atendimento comercial conectado a pessoa, empresa, oportunidade, responsável e tarefas.',
  icon: 'IconInbox',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.name,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Contato',
      icon: 'IconUser',
      defaultValue: "'Nova conversa'",
    },
    {
      universalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.providerThreadKey,
      type: FieldType.TEXT,
      name: 'providerThreadKey',
      label: 'Chave externa da conversa',
      description:
        'Chave idempotente composta pelo provedor, instância e identificador externo.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.channel,
      type: FieldType.SELECT,
      name: 'channel',
      label: 'Canal',
      icon: 'IconMessage',
      defaultValue: `'${InboxConversationChannel.WHATSAPP}'`,
      options: [
        {
          id: INBOX_OPTION_IDS.conversationChannel.whatsapp,
          value: InboxConversationChannel.WHATSAPP,
          label: 'WhatsApp',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_OPTION_IDS.conversationChannel.email,
          value: InboxConversationChannel.EMAIL,
          label: 'E-mail',
          position: 1,
          color: 'blue',
        },
      ],
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.provider,
      type: FieldType.SELECT,
      name: 'provider',
      label: 'Provedor',
      icon: 'IconPlugConnected',
      defaultValue: `'${InboxConversationProvider.EVOLUTION}'`,
      options: [
        {
          id: INBOX_OPTION_IDS.conversationProvider.evolution,
          value: InboxConversationProvider.EVOLUTION,
          label: 'Evolution',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_OPTION_IDS.conversationProvider.twentyEmail,
          value: InboxConversationProvider.TWENTY_EMAIL,
          label: 'Twenty E-mail',
          position: 1,
          color: 'blue',
        },
        {
          id: INBOX_OPTION_IDS.conversationProvider.manual,
          value: InboxConversationProvider.MANUAL,
          label: 'Manual',
          position: 2,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.status,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${InboxConversationStatus.OPEN}'`,
      options: INBOX_CONVERSATION_STATUS_OPTIONS,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.priority,
      type: FieldType.SELECT,
      name: 'priority',
      label: 'Prioridade',
      icon: 'IconAlertTriangle',
      defaultValue: `'${InboxConversationPriority.NORMAL}'`,
      options: [
        {
          id: INBOX_OPTION_IDS.conversationPriority.low,
          value: InboxConversationPriority.LOW,
          label: 'Baixa',
          position: 0,
          color: 'gray',
        },
        {
          id: INBOX_OPTION_IDS.conversationPriority.normal,
          value: InboxConversationPriority.NORMAL,
          label: 'Normal',
          position: 1,
          color: 'blue',
        },
        {
          id: INBOX_OPTION_IDS.conversationPriority.high,
          value: InboxConversationPriority.HIGH,
          label: 'Alta',
          position: 2,
          color: 'orange',
        },
        {
          id: INBOX_OPTION_IDS.conversationPriority.urgent,
          value: InboxConversationPriority.URGENT,
          label: 'Urgente',
          position: 3,
          color: 'red',
        },
      ],
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.contactHandle,
      type: FieldType.TEXT,
      name: 'contactHandle',
      label: 'Telefone ou endereço',
      icon: 'IconPhone',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.unreadCount,
      type: FieldType.NUMBER,
      name: 'unreadCount',
      label: 'Não lidas',
      icon: 'IconMessageCircle',
      defaultValue: 0,
    },
    {
      universalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.lastMessagePreview,
      type: FieldType.TEXT,
      name: 'lastMessagePreview',
      label: 'Última mensagem',
      icon: 'IconMessage',
      isNullable: true,
    },
    {
      universalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.lastMessageDirection,
      type: FieldType.SELECT,
      name: 'lastMessageDirection',
      label: 'Direção da última mensagem',
      icon: 'IconArrowsExchange',
      isNullable: true,
      options: [
        {
          id: INBOX_OPTION_IDS.conversationDirection.inbound,
          value: InboxMessageDirection.INBOUND,
          label: 'Recebida',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_OPTION_IDS.conversationDirection.outbound,
          value: InboxMessageDirection.OUTBOUND,
          label: 'Enviada',
          position: 1,
          color: 'blue',
        },
      ],
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.lastMessageAt,
      type: FieldType.DATE_TIME,
      name: 'lastMessageAt',
      label: 'Última mensagem em',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.firstResponseDueAt,
      type: FieldType.DATE_TIME,
      name: 'firstResponseDueAt',
      label: 'Primeira resposta até',
      icon: 'IconClockHour4',
      isNullable: true,
    },
    {
      universalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.firstRespondedAt,
      type: FieldType.DATE_TIME,
      name: 'firstRespondedAt',
      label: 'Primeira resposta em',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.followUpDueAt,
      type: FieldType.DATE_TIME,
      name: 'followUpDueAt',
      label: 'Follow-up até',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.snoozedUntil,
      type: FieldType.DATE_TIME,
      name: 'snoozedUntil',
      label: 'Adiada até',
      icon: 'IconClockPause',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.slaBreachedAt,
      type: FieldType.DATE_TIME,
      name: 'slaBreachedAt',
      label: 'SLA violado em',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_FIELD_IDS.metadata,
      type: FieldType.RAW_JSON,
      name: 'metadata',
      label: 'Metadados seguros',
      description:
        'Metadados operacionais já redigidos; nunca deve armazenar credenciais ou payload bruto.',
      icon: 'IconBraces',
      isNullable: true,
    },
  ],
});
