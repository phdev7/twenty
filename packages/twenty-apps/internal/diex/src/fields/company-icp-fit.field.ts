import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_ICP_FIT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000002';

export default defineField({
  universalIdentifier: COMPANY_ICP_FIT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RATING,
  name: 'icpFit',
  label: 'Aderência ao ICP',
  description: 'Quanto esta empresa combina com o perfil de cliente ideal.',
  icon: 'IconTargetArrow',
  isNullable: true,
  options: [
    {
      id: 'd1e05520-0000-4000-8000-000000000001',
      value: 'RATING_1',
      label: '1',
      position: 0,
    },
    {
      id: 'd1e05520-0000-4000-8000-000000000002',
      value: 'RATING_2',
      label: '2',
      position: 1,
    },
    {
      id: 'd1e05520-0000-4000-8000-000000000003',
      value: 'RATING_3',
      label: '3',
      position: 2,
    },
    {
      id: 'd1e05520-0000-4000-8000-000000000004',
      value: 'RATING_4',
      label: '4',
      position: 3,
    },
    {
      id: 'd1e05520-0000-4000-8000-000000000005',
      value: 'RATING_5',
      label: '5',
      position: 4,
    },
  ],
});
