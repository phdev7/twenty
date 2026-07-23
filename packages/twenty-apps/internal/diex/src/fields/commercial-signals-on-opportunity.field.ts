import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  COMMERCIAL_SIGNALS_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/opportunity-on-commercial-signal.field';
import { COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER } from 'src/objects/commercial-signal.object';

export default defineField({
  universalIdentifier:
    COMMERCIAL_SIGNALS_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexCommercialSignals',
  label: 'Sinais comerciais',
  icon: 'IconRadar',
  relationTargetObjectMetadataUniversalIdentifier:
    COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
