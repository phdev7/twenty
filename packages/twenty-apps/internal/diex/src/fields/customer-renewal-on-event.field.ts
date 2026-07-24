import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal-event.object';
import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';

export const CUSTOMER_RENEWAL_ON_EVENT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-000000000007';
export const EVENTS_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-000000000008';

export default defineField({
  universalIdentifier: CUSTOMER_RENEWAL_ON_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'customerRenewal',
  label: 'Renovação',
  icon: 'IconRefreshDot',
  relationTargetObjectMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    EVENTS_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'customerRenewalId',
  },
});
