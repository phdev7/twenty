import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INBOX_TEAM_RELATION_FIELD_IDS,
  INBOX_TEAM_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-team.constants';
import { INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_TEAM_RELATION_FIELD_IDS.teamOnConversation,
  objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxTeam',
  label: 'Equipe',
  icon: 'IconUsersGroup',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_TEAM_RELATION_FIELD_IDS.conversationsOnTeam,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'inboxTeamId',
  },
});
