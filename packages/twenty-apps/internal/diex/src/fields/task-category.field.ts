import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const TASK_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000016';

export const TASK_CATEGORY_COMMERCIAL = 'COMMERCIAL';
export const TASK_CATEGORY_OPERATIONAL = 'OPERATIONAL';

export default defineField({
  universalIdentifier: TASK_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.SELECT,
  name: 'taskCategory',
  label: 'Frente',
  description:
    'Separa o trabalho comercial, que persegue receita nova, do operacional, que entrega e sustenta o valor já vendido.',
  icon: 'IconRoute',
  isNullable: true,
  defaultValue: `'${TASK_CATEGORY_COMMERCIAL}'`,
  options: [
    {
      id: 'd1e05560-0000-4000-8000-000000000001',
      value: TASK_CATEGORY_COMMERCIAL,
      label: 'Comercial',
      position: 0,
      color: 'blue',
    },
    {
      id: 'd1e05560-0000-4000-8000-000000000002',
      value: TASK_CATEGORY_OPERATIONAL,
      label: 'Operacional',
      position: 1,
      color: 'turquoise',
    },
  ],
});
