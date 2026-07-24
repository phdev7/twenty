import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import { INBOX_LABEL_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-label.constants';
import {
  INBOX_MACRO_FIELD_IDS,
  INBOX_MACRO_RELATION_FIELD_IDS,
  INBOX_MACRO_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-macro.constants';

export default defineField({
  universalIdentifier: INBOX_MACRO_RELATION_FIELD_IDS.macrosOnLabel,
  objectUniversalIdentifier: INBOX_LABEL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxMacros',
  label: 'Macros',
  icon: 'IconWand',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_MACRO_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.label,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
