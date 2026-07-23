import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_LABEL_FIELD_IDS,
  INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
  INBOX_LABEL_RELATION_FIELD_IDS,
} from 'src/modules/inbox/constants/inbox-label.constants';
import { INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_LABEL_RELATION_FIELD_IDS.assignmentsOnConversation,
  objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'labelAssignments',
  label: 'Etiquetas',
  icon: 'IconTags',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_LABEL_FIELD_IDS.conversation,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
