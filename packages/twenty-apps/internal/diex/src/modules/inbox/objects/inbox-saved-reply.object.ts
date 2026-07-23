import { defineObject, FieldType } from 'twenty-sdk/define';

export enum InboxSavedReplyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum InboxSavedReplyChannel {
  ALL = 'ALL',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export const INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER =
  'd1e0d000-0000-4000-8000-000000000001';
export const INBOX_SAVED_REPLY_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e0d100-0000-4000-8000-000000000001';
export const INBOX_SAVED_REPLY_SHORTCUT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e0d100-0000-4000-8000-000000000002';
export const INBOX_SAVED_REPLY_BODY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e0d100-0000-4000-8000-000000000003';
export const INBOX_SAVED_REPLY_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e0d100-0000-4000-8000-000000000004';
export const INBOX_SAVED_REPLY_CHANNEL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e0d100-0000-4000-8000-000000000005';
export const INBOX_SAVED_REPLY_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e0d100-0000-4000-8000-000000000006';
export const INBOX_SAVED_REPLY_USAGE_COUNT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e0d100-0000-4000-8000-000000000007';
export const INBOX_SAVED_REPLY_LAST_USED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e0d100-0000-4000-8000-000000000008';

export default defineObject({
  universalIdentifier: INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxSavedReply',
  namePlural: 'inboxSavedReplies',
  labelSingular: 'Resposta pronta',
  labelPlural: 'Respostas prontas',
  description:
    'Modelos de resposta do workspace com atalho e variáveis do contexto comercial.',
  icon: 'IconBolt',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    INBOX_SAVED_REPLY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: INBOX_SAVED_REPLY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconAbc',
    },
    {
      universalIdentifier:
        INBOX_SAVED_REPLY_SHORTCUT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'shortcut',
      label: 'Atalho',
      description:
        'Código único sem a barra inicial. Exemplo: proposta, retorno ou boas-vindas.',
      icon: 'IconSlash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_SAVED_REPLY_BODY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'body',
      label: 'Mensagem',
      description:
        'Texto editável antes do envio. Aceita variáveis seguras do CRM entre chaves duplas.',
      icon: 'IconMessage',
    },
    {
      universalIdentifier: INBOX_SAVED_REPLY_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${InboxSavedReplyStatus.ACTIVE}'`,
      options: [
        {
          id: 'd1e0d110-0000-4000-8000-000000000001',
          value: InboxSavedReplyStatus.ACTIVE,
          label: 'Ativa',
          position: 0,
          color: 'green',
        },
        {
          id: 'd1e0d110-0000-4000-8000-000000000002',
          value: InboxSavedReplyStatus.INACTIVE,
          label: 'Inativa',
          position: 1,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_SAVED_REPLY_CHANNEL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'channel',
      label: 'Canal',
      icon: 'IconMessage',
      defaultValue: `'${InboxSavedReplyChannel.ALL}'`,
      options: [
        {
          id: 'd1e0d120-0000-4000-8000-000000000001',
          value: InboxSavedReplyChannel.ALL,
          label: 'Todos',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd1e0d120-0000-4000-8000-000000000002',
          value: InboxSavedReplyChannel.WHATSAPP,
          label: 'WhatsApp',
          position: 1,
          color: 'green',
        },
        {
          id: 'd1e0d120-0000-4000-8000-000000000003',
          value: InboxSavedReplyChannel.EMAIL,
          label: 'E-mail',
          position: 2,
          color: 'purple',
        },
      ],
    },
    {
      universalIdentifier:
        INBOX_SAVED_REPLY_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'category',
      label: 'Categoria',
      description:
        'Exemplos: abertura, qualificação, objeção, proposta, follow-up ou fechamento.',
      icon: 'IconCategory',
      isNullable: true,
    },
    {
      universalIdentifier:
        INBOX_SAVED_REPLY_USAGE_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'usageCount',
      label: 'Usos',
      icon: 'IconChartBar',
      defaultValue: 0,
    },
    {
      universalIdentifier:
        INBOX_SAVED_REPLY_LAST_USED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'lastUsedAt',
      label: 'Último uso',
      icon: 'IconClock',
      isNullable: true,
    },
  ],
});
