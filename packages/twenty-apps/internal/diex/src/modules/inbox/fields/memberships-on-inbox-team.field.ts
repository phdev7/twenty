import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_TEAM_MEMBER_FIELD_IDS,
  INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_RELATION_FIELD_IDS,
  INBOX_TEAM_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-team.constants';

export default defineField({
  universalIdentifier: INBOX_TEAM_RELATION_FIELD_IDS.membershipsOnTeam,
  objectUniversalIdentifier: INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'memberships',
  label: 'Membros',
  icon: 'IconUsers',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_TEAM_MEMBER_FIELD_IDS.team,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
