import { type ObjectManifest } from 'twenty-shared/application';
import { FieldMetadataType } from 'twenty-shared/types';

import {
  INBOX_CONVERSATION_EVENT_FIELD_IDS,
  INBOX_CONVERSATION_EVENT_OPTION_IDS,
  INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-conversation-event.constants';

export enum InboxConversationEventType {
  STATUS_CHANGED = 'STATUS_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  TEAM_CHANGED = 'TEAM_CHANGED',
  ASSIGNEE_CHANGED = 'ASSIGNEE_CHANGED',
  LABEL_CHANGED = 'LABEL_CHANGED',
  SNOOZED = 'SNOOZED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  MACRO_APPLIED = 'MACRO_APPLIED',
  MENTION_RESOLVED = 'MENTION_RESOLVED',
  AI_TRIAGED = 'AI_TRIAGED',
  AUTOMATION_APPLIED = 'AUTOMATION_APPLIED',
}

export const InboxConversationEventStandardObjectDefinition = {
  universalIdentifier: INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxConversationEvent' as const,
  namePlural: 'inboxConversationEvents',
  labelSingular: 'Evento da conversa',
  labelPlural: 'Eventos das conversas',
  description:
    'Trilha estruturada das mudanças operacionais realizadas na Inbox comercial.',
  icon: 'IconTimelineEvent',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_EVENT_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_CONVERSATION_EVENT_FIELD_IDS.name,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Chave do evento',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_EVENT_FIELD_IDS.eventType,
      type: FieldMetadataType.SELECT,
      name: 'eventType',
      label: 'Tipo',
      icon: 'IconActivity',
      options: [
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.statusChanged,
          value: InboxConversationEventType.STATUS_CHANGED,
          label: 'Status alterado',
          position: 0,
          color: 'blue',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.priorityChanged,
          value: InboxConversationEventType.PRIORITY_CHANGED,
          label: 'Prioridade alterada',
          position: 1,
          color: 'orange',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.teamChanged,
          value: InboxConversationEventType.TEAM_CHANGED,
          label: 'Equipe alterada',
          position: 2,
          color: 'blue',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.assigneeChanged,
          value: InboxConversationEventType.ASSIGNEE_CHANGED,
          label: 'Responsável alterado',
          position: 3,
          color: 'turquoise',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.labelChanged,
          value: InboxConversationEventType.LABEL_CHANGED,
          label: 'Etiqueta alterada',
          position: 4,
          color: 'purple',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.snoozed,
          value: InboxConversationEventType.SNOOZED,
          label: 'Conversa adiada',
          position: 5,
          color: 'yellow',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.taskCreated,
          value: InboxConversationEventType.TASK_CREATED,
          label: 'Próxima ação criada',
          position: 6,
          color: 'green',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.taskCompleted,
          value: InboxConversationEventType.TASK_COMPLETED,
          label: 'Próxima ação concluída',
          position: 7,
          color: 'green',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.macroApplied,
          value: InboxConversationEventType.MACRO_APPLIED,
          label: 'Macro aplicada',
          position: 8,
          color: 'blue',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.mentionResolved,
          value: InboxConversationEventType.MENTION_RESOLVED,
          label: 'Menção resolvida',
          position: 9,
          color: 'gray',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.aiTriaged,
          value: InboxConversationEventType.AI_TRIAGED,
          label: 'Triagem de IA',
          position: 10,
          color: 'purple',
        },
        {
          id: INBOX_CONVERSATION_EVENT_OPTION_IDS.automationApplied,
          value: InboxConversationEventType.AUTOMATION_APPLIED,
          label: 'Automação aplicada',
          position: 11,
          color: 'turquoise',
        },
      ],
    },
    {
      universalIdentifier: INBOX_CONVERSATION_EVENT_FIELD_IDS.summary,
      type: FieldMetadataType.TEXT,
      name: 'summary',
      label: 'Resumo',
      icon: 'IconActivity',
    },
    {
      universalIdentifier: INBOX_CONVERSATION_EVENT_FIELD_IDS.details,
      type: FieldMetadataType.TEXT,
      name: 'details',
      label: 'Detalhes',
      icon: 'IconAlignLeft',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_EVENT_FIELD_IDS.occurredAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'occurredAt',
      label: 'Ocorrido em',
      icon: 'IconClock',
    },
  ],
} satisfies ObjectManifest;
