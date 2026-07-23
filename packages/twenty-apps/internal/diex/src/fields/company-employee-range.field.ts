import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_EMPLOYEE_RANGE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000014';

export default defineField({
  universalIdentifier: COMPANY_EMPLOYEE_RANGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.TEXT,
  name: 'diexEmployeeRange',
  label: 'Faixa de colaboradores',
  description: 'Porte declarado usado para ICP e desenho da oferta.',
  icon: 'IconUsers',
  isNullable: true,
});
