import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  INBOX_RELATION_FIELD_IDS,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_RELATION_FIELD_IDS.messagesOnConversation,
  objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'messages',
  label: 'Mensagens',
  icon: 'IconMessage',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_RELATION_FIELD_IDS.conversationOnMessage,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
