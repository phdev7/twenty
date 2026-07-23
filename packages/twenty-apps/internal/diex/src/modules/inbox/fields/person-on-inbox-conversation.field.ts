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
  universalIdentifier: INBOX_RELATION_FIELD_IDS.personOnConversation,
  objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'person',
  label: 'Pessoa',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_RELATION_FIELD_IDS.conversationsOnPerson,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'personId',
  },
});
