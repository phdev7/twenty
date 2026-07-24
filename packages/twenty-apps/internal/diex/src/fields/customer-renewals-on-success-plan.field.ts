import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CUSTOMER_RENEWALS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/success-plan-on-customer-renewal.field';
import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export default defineField({
  universalIdentifier:
    CUSTOMER_RENEWALS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'customerRenewals',
  label: 'Renovações',
  icon: 'IconRefreshDot',
  relationTargetObjectMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SUCCESS_PLAN_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
