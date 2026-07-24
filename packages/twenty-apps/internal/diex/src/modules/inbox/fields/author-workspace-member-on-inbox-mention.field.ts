import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_MENTION_FIELD_IDS,
  INBOX_MENTION_RELATION_FIELD_IDS,
  INBOX_MENTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-mention.constants';

export default defineField({
  universalIdentifier: INBOX_MENTION_FIELD_IDS.authorWorkspaceMember,
  objectUniversalIdentifier: INBOX_MENTION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'authorWorkspaceMember',
  label: 'Autor',
  icon: 'IconUserEdit',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MENTION_RELATION_FIELD_IDS.authoredMentionsOnWorkspaceMember,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'authorWorkspaceMemberId',
  },
});
