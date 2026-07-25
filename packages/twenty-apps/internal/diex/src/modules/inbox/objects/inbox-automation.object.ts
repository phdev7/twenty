import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  INBOX_AUTOMATION_FIELD_IDS,
  INBOX_AUTOMATION_OPTION_IDS,
  INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-automation.constants';

export enum InboxAutomationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum InboxAutomationTrigger {
  CONVERSATION_CREATED = 'CONVERSATION_CREATED',
  INBOUND_MESSAGE_CREATED = 'INBOUND_MESSAGE_CREATED',
}

export enum InboxAutomationChannel {
  ALL = 'ALL',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum InboxAutomationCrmCondition {
  ANY = 'ANY',
  LINKED = 'LINKED',
  UNLINKED = 'UNLINKED',
  HAS_OPPORTUNITY = 'HAS_OPPORTUNITY',
  NO_OPPORTUNITY = 'NO_OPPORTUNITY',
}

export enum InboxAutomationConversationStatus {
  KEEP = 'KEEP',
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
}

export enum InboxAutomationPriority {
  KEEP = 'KEEP',
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export default defineObject({
  universalIdentifier: INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxAutomation',
  namePlural: 'inboxAutomations',
  labelSingular: 'Automação da inbox',
  labelPlural: 'Automações da inbox',
  description:
    'Regras comerciais acionadas por novas conversas ou mensagens recebidas, sem envio externo automático.',
  icon: 'IconSettingsAutomation',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    INBOX_AUTOMATION_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.name,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconSettingsAutomation',
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.key,
      type: FieldType.TEXT,
      name: 'key',
      label: 'Chave',
      description: 'Identificador único, como lead-quente ou risco-renovacao.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.description,
      type: FieldType.TEXT,
      name: 'description',
      label: 'Objetivo',
      icon: 'IconAlignLeft',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.status,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${InboxAutomationStatus.INACTIVE}'`,
      options: [
        {
          id: INBOX_AUTOMATION_OPTION_IDS.status.active,
          value: InboxAutomationStatus.ACTIVE,
          label: 'Ativa',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.status.inactive,
          value: InboxAutomationStatus.INACTIVE,
          label: 'Inativa',
          position: 1,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.trigger,
      type: FieldType.SELECT,
      name: 'trigger',
      label: 'Gatilho',
      icon: 'IconBolt',
      defaultValue: `'${InboxAutomationTrigger.INBOUND_MESSAGE_CREATED}'`,
      options: [
        {
          id: INBOX_AUTOMATION_OPTION_IDS.trigger.conversationCreated,
          value: InboxAutomationTrigger.CONVERSATION_CREATED,
          label: 'Nova conversa',
          position: 0,
          color: 'blue',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.trigger.inboundMessageCreated,
          value: InboxAutomationTrigger.INBOUND_MESSAGE_CREATED,
          label: 'Nova mensagem recebida',
          position: 1,
          color: 'green',
        },
      ],
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.channel,
      type: FieldType.SELECT,
      name: 'channel',
      label: 'Canal',
      icon: 'IconMessage',
      defaultValue: `'${InboxAutomationChannel.ALL}'`,
      options: [
        {
          id: INBOX_AUTOMATION_OPTION_IDS.channel.all,
          value: InboxAutomationChannel.ALL,
          label: 'Todos',
          position: 0,
          color: 'blue',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.channel.whatsapp,
          value: InboxAutomationChannel.WHATSAPP,
          label: 'WhatsApp',
          position: 1,
          color: 'green',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.channel.email,
          value: InboxAutomationChannel.EMAIL,
          label: 'E-mail',
          position: 2,
          color: 'purple',
        },
      ],
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.keywords,
      type: FieldType.TEXT,
      name: 'keywords',
      label: 'Palavras-chave',
      description:
        'Termos separados por vírgula ou linha. A regra exige ao menos um termo quando preenchido.',
      icon: 'IconSearch',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.crmCondition,
      type: FieldType.SELECT,
      name: 'crmCondition',
      label: 'Condição CRM',
      icon: 'IconRelationOneToMany',
      defaultValue: `'${InboxAutomationCrmCondition.ANY}'`,
      options: [
        {
          id: INBOX_AUTOMATION_OPTION_IDS.crmCondition.any,
          value: InboxAutomationCrmCondition.ANY,
          label: 'Qualquer vínculo',
          position: 0,
          color: 'gray',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.crmCondition.linked,
          value: InboxAutomationCrmCondition.LINKED,
          label: 'Contato vinculado',
          position: 1,
          color: 'green',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.crmCondition.unlinked,
          value: InboxAutomationCrmCondition.UNLINKED,
          label: 'Contato não vinculado',
          position: 2,
          color: 'orange',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.crmCondition.hasOpportunity,
          value: InboxAutomationCrmCondition.HAS_OPPORTUNITY,
          label: 'Com oportunidade',
          position: 3,
          color: 'blue',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.crmCondition.noOpportunity,
          value: InboxAutomationCrmCondition.NO_OPPORTUNITY,
          label: 'Sem oportunidade',
          position: 4,
          color: 'yellow',
        },
      ],
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.onlyIfUnassigned,
      type: FieldType.BOOLEAN,
      name: 'onlyIfUnassigned',
      label: 'Somente sem responsável',
      icon: 'IconUserQuestion',
      defaultValue: false,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.targetConversationStatus,
      type: FieldType.SELECT,
      name: 'targetConversationStatus',
      label: 'Status final',
      icon: 'IconProgress',
      defaultValue: `'${InboxAutomationConversationStatus.KEEP}'`,
      options: [
        {
          id: INBOX_AUTOMATION_OPTION_IDS.conversationStatus.keep,
          value: InboxAutomationConversationStatus.KEEP,
          label: 'Manter',
          position: 0,
          color: 'gray',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.conversationStatus.open,
          value: InboxAutomationConversationStatus.OPEN,
          label: 'Aberta',
          position: 1,
          color: 'green',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.conversationStatus.pending,
          value: InboxAutomationConversationStatus.PENDING,
          label: 'Pendente',
          position: 2,
          color: 'orange',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.conversationStatus.resolved,
          value: InboxAutomationConversationStatus.RESOLVED,
          label: 'Resolvida',
          position: 3,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.targetPriority,
      type: FieldType.SELECT,
      name: 'targetPriority',
      label: 'Prioridade final',
      icon: 'IconFlag',
      defaultValue: `'${InboxAutomationPriority.KEEP}'`,
      options: [
        {
          id: INBOX_AUTOMATION_OPTION_IDS.priority.keep,
          value: InboxAutomationPriority.KEEP,
          label: 'Manter',
          position: 0,
          color: 'gray',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.priority.low,
          value: InboxAutomationPriority.LOW,
          label: 'Baixa',
          position: 1,
          color: 'gray',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.priority.normal,
          value: InboxAutomationPriority.NORMAL,
          label: 'Normal',
          position: 2,
          color: 'blue',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.priority.high,
          value: InboxAutomationPriority.HIGH,
          label: 'Alta',
          position: 3,
          color: 'orange',
        },
        {
          id: INBOX_AUTOMATION_OPTION_IDS.priority.urgent,
          value: InboxAutomationPriority.URGENT,
          label: 'Urgente',
          position: 4,
          color: 'red',
        },
      ],
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.followUpDelayMinutes,
      type: FieldType.NUMBER,
      name: 'followUpDelayMinutes',
      label: 'Follow-up em minutos',
      description: 'Zero mantém o prazo atual.',
      icon: 'IconCalendarDue',
      defaultValue: 0,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.taskTitleTemplate,
      type: FieldType.TEXT,
      name: 'taskTitleTemplate',
      label: 'Título da próxima ação',
      description:
        'Cria uma tarefa interna. Aceita variáveis CRM; nunca envia mensagem externa.',
      icon: 'IconCheckbox',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.taskDueDelayMinutes,
      type: FieldType.NUMBER,
      name: 'taskDueDelayMinutes',
      label: 'Prazo da tarefa em minutos',
      icon: 'IconClock',
      defaultValue: 60,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.internalNoteTemplate,
      type: FieldType.TEXT,
      name: 'internalNoteTemplate',
      label: 'Nota interna',
      description:
        'Contexto privado registrado na conversa quando a regra é aplicada.',
      icon: 'IconNotes',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.stopAfterMatch,
      type: FieldType.BOOLEAN,
      name: 'stopAfterMatch',
      label: 'Parar após aplicar',
      description: 'Impede a execução de regras posteriores no mesmo evento.',
      icon: 'IconPlayerStop',
      defaultValue: false,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.position,
      type: FieldType.NUMBER,
      name: 'executionOrder',
      label: 'Ordem',
      icon: 'IconSortAscending',
      defaultValue: 100,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.runCount,
      type: FieldType.NUMBER,
      name: 'runCount',
      label: 'Execuções',
      icon: 'IconChartBar',
      defaultValue: 0,
    },
    {
      universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.lastRunAt,
      type: FieldType.DATE_TIME,
      name: 'lastRunAt',
      label: 'Última execução',
      icon: 'IconClock',
      isNullable: true,
    },
  ],
});
