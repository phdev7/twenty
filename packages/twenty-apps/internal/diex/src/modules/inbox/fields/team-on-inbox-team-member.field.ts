import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INBOX_TEAM_MEMBER_FIELD_IDS,
  INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_RELATION_FIELD_IDS,
  INBOX_TEAM_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-team.constants';

export default defineField({
  universalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.team,
  objectUniversalIdentifier: INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxTeam',
  label: 'Equipe',
  icon: 'IconUsersGroup',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_TEAM_RELATION_FIELD_IDS.membershipsOnTeam,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'inboxTeamId',
  },
});
