import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INBOX_AUTOMATION_FIELD_IDS,
  INBOX_AUTOMATION_RELATION_FIELD_IDS,
  INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-automation.constants';
import { INBOX_LABEL_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-label.constants';

export default defineField({
  universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.label,
  objectUniversalIdentifier: INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxLabel',
  label: 'Etiqueta a aplicar',
  icon: 'IconTag',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_LABEL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_AUTOMATION_RELATION_FIELD_IDS.automationsOnLabel,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'inboxLabelId',
  },
});
