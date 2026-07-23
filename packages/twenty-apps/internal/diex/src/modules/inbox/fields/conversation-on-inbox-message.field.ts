import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  INBOX_RELATION_FIELD_IDS,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_RELATION_FIELD_IDS.conversationOnMessage,
  objectUniversalIdentifier: INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxConversation',
  label: 'Conversa',
  icon: 'IconInbox',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_RELATION_FIELD_IDS.messagesOnConversation,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'inboxConversationId',
  },
});
