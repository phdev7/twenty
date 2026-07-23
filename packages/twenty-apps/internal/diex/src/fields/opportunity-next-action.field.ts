import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_NEXT_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000006';

export default defineField({
  universalIdentifier: OPPORTUNITY_NEXT_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.TEXT,
  name: 'nextCommercialAction',
  label: 'Próxima ação',
  description: 'Próximo passo objetivo que move a venda.',
  icon: 'IconArrowRight',
  isNullable: true,
});
