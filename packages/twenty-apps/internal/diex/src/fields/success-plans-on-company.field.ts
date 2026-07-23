import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  COMPANY_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLANS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/company-on-success-plan.field';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export default defineField({
  universalIdentifier: SUCCESS_PLANS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexSuccessPlans',
  label: 'Planos de sucesso',
  icon: 'IconHeartHandshake',
  relationTargetObjectMetadataUniversalIdentifier:
    SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    COMPANY_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
