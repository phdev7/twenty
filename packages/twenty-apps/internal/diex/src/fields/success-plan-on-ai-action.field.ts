import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export const SUCCESS_PLAN_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000034';
export const AI_ACTIONS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000035';

export default defineField({
  universalIdentifier:
    SUCCESS_PLAN_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'successPlan',
  label: 'Plano de sucesso',
  icon: 'IconHeartHandshake',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AI_ACTIONS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'successPlanId',
  },
});
