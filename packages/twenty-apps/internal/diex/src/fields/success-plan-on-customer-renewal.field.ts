import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export const SUCCESS_PLAN_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-000000000001';
export const CUSTOMER_RENEWALS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-000000000002';

export default defineField({
  universalIdentifier:
    SUCCESS_PLAN_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'successPlan',
  label: 'Plano de sucesso',
  icon: 'IconHeartHandshake',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CUSTOMER_RENEWALS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'successPlanId',
  },
});
