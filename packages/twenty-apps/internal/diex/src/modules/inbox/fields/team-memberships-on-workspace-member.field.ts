import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_TEAM_MEMBER_FIELD_IDS,
  INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_RELATION_FIELD_IDS,
} from 'src/modules/inbox/constants/inbox-team.constants';

export default defineField({
  universalIdentifier:
    INBOX_TEAM_RELATION_FIELD_IDS.teamMembershipsOnWorkspaceMember,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexInboxTeamMemberships',
  label: 'Equipes da inbox',
  icon: 'IconUsersGroup',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_TEAM_MEMBER_FIELD_IDS.workspaceMember,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
