import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_LABEL_FIELD_IDS,
  INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
  INBOX_LABEL_RELATION_FIELD_IDS,
  INBOX_LABEL_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-label.constants';

export default defineField({
  universalIdentifier: INBOX_CONVERSATION_LABEL_FIELD_IDS.label,
  objectUniversalIdentifier: INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxLabel',
  label: 'Etiqueta',
  icon: 'IconTag',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_LABEL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_LABEL_RELATION_FIELD_IDS.assignmentsOnLabel,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'inboxLabelId',
  },
});
