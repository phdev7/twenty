import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_AUTOMATION_FIELD_IDS,
  INBOX_AUTOMATION_RELATION_FIELD_IDS,
  INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-automation.constants';
import { INBOX_TEAM_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-team.constants';

export default defineField({
  universalIdentifier: INBOX_AUTOMATION_RELATION_FIELD_IDS.automationsOnTeam,
  objectUniversalIdentifier: INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxAutomations',
  label: 'Automações',
  icon: 'IconSettingsAutomation',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_AUTOMATION_FIELD_IDS.team,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
