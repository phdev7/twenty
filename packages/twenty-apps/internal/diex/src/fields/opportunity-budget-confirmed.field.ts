import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_BUDGET_CONFIRMED_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-00000000000a';

export default defineField({
  universalIdentifier:
    OPPORTUNITY_BUDGET_CONFIRMED_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'budgetConfirmed',
  label: 'Orçamento confirmado',
  description:
    'Confirma que existe orçamento ou fonte de verba validada para a compra.',
  icon: 'IconCashBanknote',
  isNullable: true,
});
