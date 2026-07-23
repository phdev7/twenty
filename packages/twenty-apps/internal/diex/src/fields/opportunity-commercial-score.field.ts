import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_COMMERCIAL_SCORE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000005';

export default defineField({
  universalIdentifier:
    OPPORTUNITY_COMMERCIAL_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'commercialScore',
  label: 'Score comercial',
  description: 'Pontuação de 0 a 100 para priorização da oportunidade.',
  icon: 'IconChartBar',
  isNullable: true,
});
