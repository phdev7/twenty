import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_LIFECYCLE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000001';

export default defineField({
  universalIdentifier: COMPANY_LIFECYCLE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.SELECT,
  name: 'diexLifecycle',
  label: 'Jornada Diex',
  description: 'Situação comercial e pós-venda consolidada da conta.',
  icon: 'IconRoute',
  isNullable: true,
  options: [
    {
      id: 'd1e05510-0000-4000-8000-000000000001',
      value: 'PROSPECT',
      label: 'Prospect',
      position: 0,
      color: 'gray',
    },
    {
      id: 'd1e05510-0000-4000-8000-000000000002',
      value: 'QUALIFIED',
      label: 'Qualificada',
      position: 1,
      color: 'blue',
    },
    {
      id: 'd1e05510-0000-4000-8000-000000000003',
      value: 'CUSTOMER',
      label: 'Cliente',
      position: 2,
      color: 'green',
    },
    {
      id: 'd1e05510-0000-4000-8000-000000000004',
      value: 'EXPANSION',
      label: 'Expansão',
      position: 3,
      color: 'purple',
    },
    {
      id: 'd1e05510-0000-4000-8000-000000000005',
      value: 'AT_RISK',
      label: 'Em risco',
      position: 4,
      color: 'red',
    },
    {
      id: 'd1e05510-0000-4000-8000-000000000006',
      value: 'CHURNED',
      label: 'Churn',
      position: 5,
      color: 'orange',
    },
  ],
});
