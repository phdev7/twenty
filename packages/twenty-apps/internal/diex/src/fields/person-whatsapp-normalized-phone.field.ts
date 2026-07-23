import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_WHATSAPP_NORMALIZED_PHONE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05600-0000-4000-8000-000000000001';

export default defineField({
  universalIdentifier:
    PERSON_WHATSAPP_NORMALIZED_PHONE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'whatsappNormalizedPhone',
  label: 'WhatsApp normalizado',
  description:
    'Número somente com dígitos usado para relacionar mensagens recebidas sem depender da formatação visual.',
  icon: 'IconBrandWhatsapp',
  isNullable: true,
  isUnique: true,
});
