import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CUSTOMER_RENEWAL_ON_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  EVENTS_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/customer-renewal-on-event.field';
import { CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal-event.object';
import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';

export default defineField({
  universalIdentifier: EVENTS_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'renewalEvents',
  label: 'Histórico',
  icon: 'IconTimelineEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_ON_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
