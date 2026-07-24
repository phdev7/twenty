import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { INBOX_LABEL_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-label.constants';
import {
  INBOX_MACRO_FIELD_IDS,
  INBOX_MACRO_RELATION_FIELD_IDS,
  INBOX_MACRO_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-macro.constants';

export default defineField({
  universalIdentifier: INBOX_MACRO_FIELD_IDS.label,
  objectUniversalIdentifier: INBOX_MACRO_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxLabel',
  label: 'Etiqueta',
  icon: 'IconTag',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_LABEL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MACRO_RELATION_FIELD_IDS.macrosOnLabel,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'inboxLabelId',
  },
});
