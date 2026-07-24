import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CUSTOMER_RENEWALS_ON_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/owner-on-customer-renewal.field';
import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';

export default defineField({
  universalIdentifier: CUSTOMER_RENEWALS_ON_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexOwnedCustomerRenewals',
  label: 'Renovações sob responsabilidade',
  icon: 'IconRefreshDot',
  relationTargetObjectMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    OWNER_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
