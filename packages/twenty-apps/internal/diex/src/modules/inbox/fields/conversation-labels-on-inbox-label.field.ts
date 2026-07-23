import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_LABEL_FIELD_IDS,
  INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
  INBOX_LABEL_RELATION_FIELD_IDS,
  INBOX_LABEL_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-label.constants';

export default defineField({
  universalIdentifier: INBOX_LABEL_RELATION_FIELD_IDS.assignmentsOnLabel,
  objectUniversalIdentifier: INBOX_LABEL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'conversationAssignments',
  label: 'Conversas',
  icon: 'IconInbox',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_LABEL_FIELD_IDS.label,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
