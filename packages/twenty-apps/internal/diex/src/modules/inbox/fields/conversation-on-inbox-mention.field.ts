import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INBOX_MENTION_FIELD_IDS,
  INBOX_MENTION_RELATION_FIELD_IDS,
  INBOX_MENTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-mention.constants';
import { INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_MENTION_FIELD_IDS.conversation,
  objectUniversalIdentifier: INBOX_MENTION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxConversation',
  label: 'Conversa',
  icon: 'IconInbox',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MENTION_RELATION_FIELD_IDS.mentionsOnConversation,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'inboxConversationId',
  },
});
