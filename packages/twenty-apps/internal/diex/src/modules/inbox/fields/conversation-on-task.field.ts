import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  INBOX_RELATION_FIELD_IDS,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_RELATION_FIELD_IDS.conversationOnTask,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexInboxConversation',
  label: 'Conversa de origem',
  icon: 'IconInbox',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_RELATION_FIELD_IDS.tasksOnConversation,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'diexInboxConversationId',
  },
});
