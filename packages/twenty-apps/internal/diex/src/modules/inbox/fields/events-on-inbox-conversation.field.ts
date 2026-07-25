import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_EVENT_FIELD_IDS,
  INBOX_CONVERSATION_EVENT_RELATION_FIELD_IDS,
  INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-conversation-event.constants';
import { INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier:
    INBOX_CONVERSATION_EVENT_RELATION_FIELD_IDS.eventsOnConversation,
  objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'conversationEvents',
  label: 'Eventos',
  icon: 'IconTimelineEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_EVENT_FIELD_IDS.conversation,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
