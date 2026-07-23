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
  universalIdentifier: INBOX_RELATION_FIELD_IDS.conversationsOnCompany,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexInboxConversations',
  label: 'Conversas da inbox',
  icon: 'IconInbox',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_RELATION_FIELD_IDS.companyOnConversation,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
