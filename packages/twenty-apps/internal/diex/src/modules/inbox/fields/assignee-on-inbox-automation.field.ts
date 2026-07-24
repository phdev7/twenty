import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_AUTOMATION_FIELD_IDS,
  INBOX_AUTOMATION_RELATION_FIELD_IDS,
  INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-automation.constants';

export default defineField({
  universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.assignee,
  objectUniversalIdentifier: INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'assignee',
  label: 'Responsável de destino',
  icon: 'IconUserCheck',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_AUTOMATION_RELATION_FIELD_IDS.automationsOnWorkspaceMember,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'assigneeId',
  },
});
