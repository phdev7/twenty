import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_NEXT_ACTION_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000007';

export default defineField({
  universalIdentifier: OPPORTUNITY_NEXT_ACTION_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'nextCommercialActionAt',
  label: 'Executar próxima ação em',
  description: 'Data de compromisso do próximo passo comercial.',
  icon: 'IconCalendarDue',
  isNullable: true,
});
