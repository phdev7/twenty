import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_LABEL_FIELD_IDS,
  INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-label.constants';

export default defineObject({
  universalIdentifier: INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxConversationLabel',
  namePlural: 'inboxConversationLabels',
  labelSingular: 'Aplicação de etiqueta',
  labelPlural: 'Aplicações de etiquetas',
  description:
    'Vínculo reversível de etiquetas aplicadas às conversas da inbox.',
  icon: 'IconTags',
  labelIdentifierFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_LABEL_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_CONVERSATION_LABEL_FIELD_IDS.name,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Chave da aplicação',
      description: 'Chave técnica única formada pela conversa e pela etiqueta.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_LABEL_FIELD_IDS.isActive,
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Ativa',
      icon: 'IconToggleRight',
      defaultValue: true,
    },
    {
      universalIdentifier: INBOX_CONVERSATION_LABEL_FIELD_IDS.assignedAt,
      type: FieldType.DATE_TIME,
      name: 'assignedAt',
      label: 'Aplicada em',
      icon: 'IconClock',
    },
    {
      universalIdentifier: INBOX_CONVERSATION_LABEL_FIELD_IDS.removedAt,
      type: FieldType.DATE_TIME,
      name: 'removedAt',
      label: 'Removida em',
      icon: 'IconClockOff',
      isNullable: true,
    },
  ],
});
