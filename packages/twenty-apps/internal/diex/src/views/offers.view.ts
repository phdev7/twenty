import { defineView, ViewType } from 'twenty-sdk/define';

import {
  OPPORTUNITIES_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/opportunity-offer.field';
import {
  OFFER_BASE_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_PRICING_MODEL_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_UNIVERSAL_IDENTIFIER,
  OFFER_VALUE_PROPOSITION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/objects/offer.object';

export const OFFERS_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e07000-0000-4000-8000-000000000001';

export default defineView({
  universalIdentifier: OFFERS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Catálogo de ofertas',
  objectUniversalIdentifier: OFFER_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconPackage',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e07100-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        OFFER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'd1e07100-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        OFFER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: 'd1e07100-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        OFFER_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd1e07100-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        OFFER_PRICING_MODEL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e07100-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        OFFER_BASE_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e07100-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier:
        OPPORTUNITIES_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07100-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier:
        OFFER_VALUE_PROPOSITION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 320,
    },
  ],
});
