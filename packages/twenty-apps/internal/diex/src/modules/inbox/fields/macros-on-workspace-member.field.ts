import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_MACRO_FIELD_IDS,
  INBOX_MACRO_RELATION_FIELD_IDS,
  INBOX_MACRO_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-macro.constants';

export default defineField({
  universalIdentifier: INBOX_MACRO_RELATION_FIELD_IDS.macrosOnWorkspaceMember,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexInboxMacros',
  label: 'Macros da inbox',
  icon: 'IconWand',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_MACRO_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MACRO_FIELD_IDS.assignee,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
