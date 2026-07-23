import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_NEED_CONFIRMED_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-00000000000b';

export default defineField({
  universalIdentifier:
    OPPORTUNITY_NEED_CONFIRMED_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'needConfirmed',
  label: 'Necessidade confirmada',
  description:
    'Confirma que o problema, impacto e necessidade de mudança foram validados.',
  icon: 'IconCircleCheck',
  isNullable: true,
});
