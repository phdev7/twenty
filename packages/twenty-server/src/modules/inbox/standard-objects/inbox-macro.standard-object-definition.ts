import { type ObjectManifest } from 'twenty-shared/application';
import { FieldMetadataType } from 'twenty-shared/types';

import {
  INBOX_MACRO_FIELD_IDS,
  INBOX_MACRO_OPTION_IDS,
  INBOX_MACRO_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-macro.constants';

export enum InboxMacroStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum InboxMacroChannel {
  ALL = 'ALL',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum InboxMacroConversationStatus {
  KEEP = 'KEEP',
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
}

export enum InboxMacroPriority {
  KEEP = 'KEEP',
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const InboxMacroStandardObjectDefinition = {
  universalIdentifier: INBOX_MACRO_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxMacro' as const,
  namePlural: 'inboxMacros',
  labelSingular: 'Macro da inbox',
  labelPlural: 'Macros da inbox',
  description:
    'Pacote configurável de ações comerciais para padronizar o tratamento de conversas.',
  icon: 'IconWand',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.name,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconWand',
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.shortcut,
      type: FieldMetadataType.TEXT,
      name: 'shortcut',
      label: 'Atalho',
      description: 'Chave única, como qualificar, proposta ou follow-up.',
      icon: 'IconSlash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.description,
      type: FieldMetadataType.TEXT,
      name: 'description',
      label: 'Descrição',
      icon: 'IconAlignLeft',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.status,
      type: FieldMetadataType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${InboxMacroStatus.ACTIVE}'`,
      options: [
        {
          id: INBOX_MACRO_OPTION_IDS.status.active,
          value: InboxMacroStatus.ACTIVE,
          label: 'Ativa',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.status.inactive,
          value: InboxMacroStatus.INACTIVE,
          label: 'Inativa',
          position: 1,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.channel,
      type: FieldMetadataType.SELECT,
      name: 'channel',
      label: 'Canal',
      icon: 'IconMessage',
      defaultValue: `'${InboxMacroChannel.ALL}'`,
      options: [
        {
          id: INBOX_MACRO_OPTION_IDS.channel.all,
          value: InboxMacroChannel.ALL,
          label: 'Todos',
          position: 0,
          color: 'blue',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.channel.whatsapp,
          value: InboxMacroChannel.WHATSAPP,
          label: 'WhatsApp',
          position: 1,
          color: 'green',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.channel.email,
          value: InboxMacroChannel.EMAIL,
          label: 'E-mail',
          position: 2,
          color: 'purple',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.targetConversationStatus,
      type: FieldMetadataType.SELECT,
      name: 'targetConversationStatus',
      label: 'Status final',
      icon: 'IconProgress',
      defaultValue: `'${InboxMacroConversationStatus.KEEP}'`,
      options: [
        {
          id: INBOX_MACRO_OPTION_IDS.conversationStatus.keep,
          value: InboxMacroConversationStatus.KEEP,
          label: 'Manter',
          position: 0,
          color: 'gray',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.conversationStatus.open,
          value: InboxMacroConversationStatus.OPEN,
          label: 'Aberta',
          position: 1,
          color: 'green',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.conversationStatus.pending,
          value: InboxMacroConversationStatus.PENDING,
          label: 'Pendente',
          position: 2,
          color: 'orange',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.conversationStatus.resolved,
          value: InboxMacroConversationStatus.RESOLVED,
          label: 'Resolvida',
          position: 3,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.targetPriority,
      type: FieldMetadataType.SELECT,
      name: 'targetPriority',
      label: 'Prioridade final',
      icon: 'IconFlag',
      defaultValue: `'${InboxMacroPriority.KEEP}'`,
      options: [
        {
          id: INBOX_MACRO_OPTION_IDS.priority.keep,
          value: InboxMacroPriority.KEEP,
          label: 'Manter',
          position: 0,
          color: 'gray',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.priority.low,
          value: InboxMacroPriority.LOW,
          label: 'Baixa',
          position: 1,
          color: 'gray',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.priority.normal,
          value: InboxMacroPriority.NORMAL,
          label: 'Normal',
          position: 2,
          color: 'blue',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.priority.high,
          value: InboxMacroPriority.HIGH,
          label: 'Alta',
          position: 3,
          color: 'orange',
        },
        {
          id: INBOX_MACRO_OPTION_IDS.priority.urgent,
          value: InboxMacroPriority.URGENT,
          label: 'Urgente',
          position: 4,
          color: 'red',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.internalNoteTemplate,
      type: FieldMetadataType.TEXT,
      name: 'internalNoteTemplate',
      label: 'Nota interna',
      description:
        'Nota opcional registrada no histórico. Aceita as mesmas variáveis das respostas prontas.',
      icon: 'IconNotes',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.usageCount,
      type: FieldMetadataType.NUMBER,
      name: 'usageCount',
      label: 'Usos',
      icon: 'IconChartBar',
      defaultValue: 0,
    },
    {
      universalIdentifier: INBOX_MACRO_FIELD_IDS.lastUsedAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'lastUsedAt',
      label: 'Último uso',
      icon: 'IconClock',
      isNullable: true,
    },
  ],
} satisfies ObjectManifest;
