import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_DEAL_RISK_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000008';

export default defineField({
  universalIdentifier: OPPORTUNITY_DEAL_RISK_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'dealRisk',
  label: 'Risco do negócio',
  description: 'Risco consolidado de perda ou estagnação.',
  icon: 'IconAlertTriangle',
  isNullable: true,
  options: [
    {
      id: 'd1e05550-0000-4000-8000-000000000001',
      value: 'LOW',
      label: 'Baixo',
      position: 0,
      color: 'green',
    },
    {
      id: 'd1e05550-0000-4000-8000-000000000002',
      value: 'MEDIUM',
      label: 'Médio',
      position: 1,
      color: 'orange',
    },
    {
      id: 'd1e05550-0000-4000-8000-000000000003',
      value: 'HIGH',
      label: 'Alto',
      position: 2,
      color: 'red',
    },
    {
      id: 'd1e05550-0000-4000-8000-000000000004',
      value: 'UNKNOWN',
      label: 'Não avaliado',
      position: 3,
      color: 'gray',
    },
  ],
});
