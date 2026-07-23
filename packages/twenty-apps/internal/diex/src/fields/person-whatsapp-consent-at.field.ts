import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_WHATSAPP_CONSENT_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05600-0000-4000-8000-000000000003';

export default defineField({
  universalIdentifier:
    PERSON_WHATSAPP_CONSENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'whatsappConsentAt',
  label: 'Consentimento registrado em',
  description:
    'Momento em que a autorização ou recusa mais recente foi registrada.',
  icon: 'IconCalendarCheck',
  isNullable: true,
});
