import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  INBOX_TEAM_RELATION_FIELD_IDS,
  INBOX_TEAM_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-team.constants';
import { INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineField({
  universalIdentifier: INBOX_TEAM_RELATION_FIELD_IDS.conversationsOnTeam,
  objectUniversalIdentifier: INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxConversations',
  label: 'Conversas',
  icon: 'IconInbox',
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_TEAM_RELATION_FIELD_IDS.teamOnConversation,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
