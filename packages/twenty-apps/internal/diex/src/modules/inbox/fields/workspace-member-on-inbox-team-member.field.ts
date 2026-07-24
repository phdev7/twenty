import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INBOX_TEAM_MEMBER_FIELD_IDS,
  INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_RELATION_FIELD_IDS,
} from 'src/modules/inbox/constants/inbox-team.constants';

export default defineField({
  universalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.workspaceMember,
  objectUniversalIdentifier: INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'workspaceMember',
  label: 'Usuário',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_TEAM_RELATION_FIELD_IDS.teamMembershipsOnWorkspaceMember,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'workspaceMemberId',
  },
});
