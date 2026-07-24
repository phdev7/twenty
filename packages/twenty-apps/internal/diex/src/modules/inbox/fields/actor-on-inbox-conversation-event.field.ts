import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_EVENT_FIELD_IDS,
  INBOX_CONVERSATION_EVENT_RELATION_FIELD_IDS,
  INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-conversation-event.constants';

export default defineField({
  universalIdentifier: INBOX_CONVERSATION_EVENT_FIELD_IDS.actor,
  objectUniversalIdentifier: INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'actor',
  label: 'Autor',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_EVENT_RELATION_FIELD_IDS.eventsOnWorkspaceMember,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'actorId',
  },
});
