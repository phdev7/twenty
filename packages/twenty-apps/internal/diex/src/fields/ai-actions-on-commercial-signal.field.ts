import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  AI_ACTIONS_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_SIGNAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/commercial-signal-on-ai-action.field';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';
import { COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER } from 'src/objects/commercial-signal.object';

export default defineField({
  universalIdentifier:
    AI_ACTIONS_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'aiActions',
  label: 'Ações de IA',
  icon: 'IconRobot',
  relationTargetObjectMetadataUniversalIdentifier:
    AI_ACTION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    COMMERCIAL_SIGNAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
