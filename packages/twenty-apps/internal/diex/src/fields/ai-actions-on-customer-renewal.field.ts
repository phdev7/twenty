import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  AI_ACTIONS_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  CUSTOMER_RENEWAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/customer-renewal-on-ai-action.field';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';
import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';

export default defineField({
  universalIdentifier:
    AI_ACTIONS_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'aiActions',
  label: 'Ações de IA',
  icon: 'IconRobot',
  relationTargetObjectMetadataUniversalIdentifier:
    AI_ACTION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
