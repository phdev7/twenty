import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal-event.object';

export const ACTOR_ON_CUSTOMER_RENEWAL_EVENT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-000000000009';
export const CUSTOMER_RENEWAL_EVENTS_ON_ACTOR_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-00000000000a';

export default defineField({
  universalIdentifier:
    ACTOR_ON_CUSTOMER_RENEWAL_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'actor',
  label: 'Autor',
  icon: 'IconUserCheck',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_EVENTS_ON_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'actorId',
  },
});
