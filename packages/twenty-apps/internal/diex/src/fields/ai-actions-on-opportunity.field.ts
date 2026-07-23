import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AI_ACTIONS_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/opportunity-on-ai-action.field';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';

export default defineField({
  universalIdentifier:
    AI_ACTIONS_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexAiActions',
  label: 'Ações de IA',
  icon: 'IconRobot',
  relationTargetObjectMetadataUniversalIdentifier:
    AI_ACTION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
