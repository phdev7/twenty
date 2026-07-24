import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';
import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';

export const CUSTOMER_RENEWAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-00000000000b';
export const AI_ACTIONS_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-00000000000c';

export default defineField({
  universalIdentifier: CUSTOMER_RENEWAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'customerRenewal',
  label: 'Renovação',
  icon: 'IconRefreshDot',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AI_ACTIONS_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'customerRenewalId',
  },
});
