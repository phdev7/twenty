import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { OFFER_UNIVERSAL_IDENTIFIER } from 'src/objects/offer.object';

export const OFFER_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000001';
export const OPPORTUNITIES_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000002';

export default defineField({
  universalIdentifier: OFFER_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexOffer',
  label: 'Oferta',
  icon: 'IconPackage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    OFFER_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITIES_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'diexOfferId',
  },
});
