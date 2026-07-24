import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_EVENT_FIELD_IDS,
  INBOX_CONVERSATION_EVENT_RELATION_FIELD_IDS,
  INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-conversation-event.constants';

export default defineField({
  universalIdentifier:
    INBOX_CONVERSATION_EVENT_RELATION_FIELD_IDS.eventsOnWorkspaceMember,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexInboxConversationEvents',
  label: 'Eventos da inbox',
  icon: 'IconTimelineEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_EVENT_FIELD_IDS.actor,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
