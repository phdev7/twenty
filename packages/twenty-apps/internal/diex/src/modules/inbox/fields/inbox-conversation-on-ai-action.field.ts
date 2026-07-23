import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';

export const INBOX_CONVERSATION_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000038';
export const AI_ACTIONS_ON_INBOX_CONVERSATION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000039';

export default defineField({
  universalIdentifier:
    INBOX_CONVERSATION_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'inboxConversation',
  label: 'Conversa da inbox',
  icon: 'IconInbox',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AI_ACTIONS_ON_INBOX_CONVERSATION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'inboxConversationId',
  },
});
