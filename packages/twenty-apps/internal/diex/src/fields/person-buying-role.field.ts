import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_BUYING_ROLE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000003';

export default defineField({
  universalIdentifier: PERSON_BUYING_ROLE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'buyingRole',
  label: 'Papel na compra',
  description: 'Influência desta pessoa na decisão comercial.',
  icon: 'IconUsersGroup',
  isNullable: true,
  options: [
    {
      id: 'd1e05530-0000-4000-8000-000000000001',
      value: 'DECISION_MAKER',
      label: 'Decisor',
      position: 0,
      color: 'purple',
    },
    {
      id: 'd1e05530-0000-4000-8000-000000000002',
      value: 'CHAMPION',
      label: 'Campeão interno',
      position: 1,
      color: 'green',
    },
    {
      id: 'd1e05530-0000-4000-8000-000000000003',
      value: 'INFLUENCER',
      label: 'Influenciador',
      position: 2,
      color: 'blue',
    },
    {
      id: 'd1e05530-0000-4000-8000-000000000004',
      value: 'USER',
      label: 'Usuário',
      position: 3,
      color: 'sky',
    },
    {
      id: 'd1e05530-0000-4000-8000-000000000005',
      value: 'BLOCKER',
      label: 'Bloqueador',
      position: 4,
      color: 'red',
    },
    {
      id: 'd1e05530-0000-4000-8000-000000000006',
      value: 'UNKNOWN',
      label: 'Não identificado',
      position: 5,
      color: 'gray',
    },
  ],
});
