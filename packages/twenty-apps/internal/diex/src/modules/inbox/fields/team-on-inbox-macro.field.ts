import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INBOX_MACRO_FIELD_IDS,
  INBOX_MACRO_RELATION_FIELD_IDS,
  INBOX_MACRO_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-macro.constants';
import { INBOX_TEAM_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-team.constants';

export default defineField({
  universalIdentifier: INBOX_MACRO_FIELD_IDS.team,
  objectUniversalIdentifier: INBOX_MACRO_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxTeam',
  label: 'Equipe',
  icon: 'IconUsersGroup',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_MACRO_RELATION_FIELD_IDS.macrosOnTeam,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'inboxTeamId',
  },
});
