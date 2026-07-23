import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER } from 'src/objects/success-milestone.object';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export const SUCCESS_PLAN_ON_MILESTONE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000026';
export const MILESTONES_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000027';

export default defineField({
  universalIdentifier:
    SUCCESS_PLAN_ON_MILESTONE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'successPlan',
  label: 'Plano de sucesso',
  icon: 'IconHeartHandshake',
  relationTargetObjectMetadataUniversalIdentifier:
    SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    MILESTONES_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'successPlanId',
  },
});
