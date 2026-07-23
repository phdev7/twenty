import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_TIMING_CONFIRMED_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-00000000000c';

export default defineField({
  universalIdentifier:
    OPPORTUNITY_TIMING_CONFIRMED_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'timingConfirmed',
  label: 'Prazo confirmado',
  description:
    'Confirma que o prazo de decisão ou implantação foi validado com o cliente.',
  icon: 'IconCalendarCheck',
  isNullable: true,
});
