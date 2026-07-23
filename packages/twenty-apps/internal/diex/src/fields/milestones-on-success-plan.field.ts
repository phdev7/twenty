import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  MILESTONES_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_ON_MILESTONE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/success-plan-on-milestone.field';
import { SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER } from 'src/objects/success-milestone.object';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export default defineField({
  universalIdentifier:
    MILESTONES_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'milestones',
  label: 'Marcos de sucesso',
  icon: 'IconFlag3',
  relationTargetObjectMetadataUniversalIdentifier:
    SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SUCCESS_PLAN_ON_MILESTONE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
