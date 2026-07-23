import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  AI_ACTIONS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/success-plan-on-ai-action.field';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export default defineField({
  universalIdentifier:
    AI_ACTIONS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'aiActions',
  label: 'Ações de IA',
  icon: 'IconRobot',
  relationTargetObjectMetadataUniversalIdentifier:
    AI_ACTION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SUCCESS_PLAN_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
