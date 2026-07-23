import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import { INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-universal-identifiers';
import {
  AI_ACTIONS_ON_INBOX_CONVERSATION_FIELD_UNIVERSAL_IDENTIFIER,
  INBOX_CONVERSATION_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/fields/inbox-conversation-on-ai-action.field';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';

export default defineField({
  universalIdentifier:
    AI_ACTIONS_ON_INBOX_CONVERSATION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'diexAiActions',
  label: 'Ações de IA',
  icon: 'IconRobot',
  relationTargetObjectMetadataUniversalIdentifier:
    AI_ACTION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INBOX_CONVERSATION_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
