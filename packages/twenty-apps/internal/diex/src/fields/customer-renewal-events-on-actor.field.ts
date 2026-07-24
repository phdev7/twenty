import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ACTOR_ON_CUSTOMER_RENEWAL_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  CUSTOMER_RENEWAL_EVENTS_ON_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/actor-on-customer-renewal-event.field';
import { CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal-event.object';

export default defineField({
  universalIdentifier:
    CUSTOMER_RENEWAL_EVENTS_ON_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexCustomerRenewalEvents',
  label: 'Eventos de renovação',
  icon: 'IconTimelineEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ACTOR_ON_CUSTOMER_RENEWAL_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
