import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_AUTOMATION_FIELD_IDS,
  INBOX_AUTOMATION_RELATION_FIELD_IDS,
  INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-automation.constants';
import { INBOX_LABEL_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-label.constants';

export default defineField({
  universalIdentifier: INBOX_AUTOMATION_RELATION_FIELD_IDS.automationsOnLabel,
  objectUniversalIdentifier: INBOX_LABEL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxAutomations',
  label: 'Automações',
  icon: 'IconSettingsAutomation',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_AUTOMATION_FIELD_IDS.label,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
