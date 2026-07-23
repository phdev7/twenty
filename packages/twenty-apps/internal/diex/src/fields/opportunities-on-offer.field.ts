import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OFFER_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITIES_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/opportunity-offer.field';
import { OFFER_UNIVERSAL_IDENTIFIER } from 'src/objects/offer.object';

export default defineField({
  universalIdentifier: OPPORTUNITIES_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OFFER_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'opportunities',
  label: 'Oportunidades',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OFFER_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
