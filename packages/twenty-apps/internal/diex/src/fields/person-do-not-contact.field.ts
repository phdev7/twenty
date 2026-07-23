import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_DO_NOT_CONTACT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05600-0000-4000-8000-000000000004';

export default defineField({
  universalIdentifier: PERSON_DO_NOT_CONTACT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'doNotContact',
  label: 'Não contatar',
  description:
    'Bloqueio operacional prioritário para mensagens e cadências externas.',
  icon: 'IconUserOff',
  defaultValue: false,
});
