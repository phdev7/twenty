import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_MENTION_FIELD_IDS,
  INBOX_MENTION_RELATION_FIELD_IDS,
  INBOX_MENTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-mention.constants';
import { INBOX_MESSAGE_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_MENTION_RELATION_FIELD_IDS.mentionsOnMessage,
  objectUniversalIdentifier: INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'mentions',
  label: 'Menções',
  icon: 'IconAt',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_MENTION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MENTION_FIELD_IDS.message,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
