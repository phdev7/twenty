import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_MENTION_FIELD_IDS,
  INBOX_MENTION_RELATION_FIELD_IDS,
  INBOX_MENTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-mention.constants';

export default defineField({
  universalIdentifier:
    INBOX_MENTION_RELATION_FIELD_IDS.authoredMentionsOnWorkspaceMember,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexAuthoredInboxMentions',
  label: 'Menções criadas',
  icon: 'IconAt',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_MENTION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MENTION_FIELD_IDS.authorWorkspaceMember,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
