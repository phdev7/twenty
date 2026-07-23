import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_ANNUAL_REVENUE_RANGE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000013';

export default defineField({
  universalIdentifier:
    COMPANY_ANNUAL_REVENUE_RANGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.TEXT,
  name: 'diexAnnualRevenueRange',
  label: 'Faixa de faturamento anual',
  description:
    'Faixa declarada, mantida como contexto de qualificação e não como receita confirmada.',
  icon: 'IconCash',
  isNullable: true,
});
