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
import { INBOX_TEAM_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-team.constants';

export default defineField({
  universalIdentifier: INBOX_AUTOMATION_FIELD_IDS.team,
  objectUniversalIdentifier: INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxTeam',
  label: 'Equipe de destino',
  icon: 'IconUsersGroup',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_AUTOMATION_RELATION_FIELD_IDS.automationsOnTeam,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'inboxTeamId',
  },
});
