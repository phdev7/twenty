import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_AUTOMATION_FIELD_IDS,
  INBOX_AUTOMATION_RELATION_FIELD_IDS,
  INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-automation.constants';

export default defineField({
  universalIdentifier:
    INBOX_AUTOMATION_RELATION_FIELD_IDS.automationsOnWorkspaceMember,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexInboxAutomations',
  label: 'Automações da inbox',
  icon: 'IconSettingsAutomation',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_AUTOMATION_FIELD_IDS.assignee,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
