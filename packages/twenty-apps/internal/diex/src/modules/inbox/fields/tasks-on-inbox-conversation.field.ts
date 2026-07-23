import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  INBOX_RELATION_FIELD_IDS,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_RELATION_FIELD_IDS.tasksOnConversation,
  objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'tasks',
  label: 'Tarefas',
  icon: 'IconChecklist',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_RELATION_FIELD_IDS.conversationOnTask,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
