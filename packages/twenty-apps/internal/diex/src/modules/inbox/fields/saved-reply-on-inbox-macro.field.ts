import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INBOX_MACRO_FIELD_IDS,
  INBOX_MACRO_RELATION_FIELD_IDS,
  INBOX_MACRO_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-macro.constants';
import { INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/objects/inbox-saved-reply.object';

export default defineField({
  universalIdentifier: INBOX_MACRO_FIELD_IDS.savedReply,
  objectUniversalIdentifier: INBOX_MACRO_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'savedReply',
  label: 'Resposta pronta',
  icon: 'IconBolt',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MACRO_RELATION_FIELD_IDS.macrosOnSavedReply,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'savedReplyId',
  },
});
