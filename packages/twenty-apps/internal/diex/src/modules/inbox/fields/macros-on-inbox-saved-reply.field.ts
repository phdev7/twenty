import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_MACRO_FIELD_IDS,
  INBOX_MACRO_RELATION_FIELD_IDS,
  INBOX_MACRO_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-macro.constants';
import { INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/objects/inbox-saved-reply.object';

export default defineField({
  universalIdentifier: INBOX_MACRO_RELATION_FIELD_IDS.macrosOnSavedReply,
  objectUniversalIdentifier: INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxMacros',
  label: 'Macros',
  icon: 'IconWand',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_MACRO_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MACRO_FIELD_IDS.savedReply,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
