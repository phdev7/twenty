import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export enum WhatsAppConsentStatus {
  UNKNOWN = 'UNKNOWN',
  OPTED_IN = 'OPTED_IN',
  OPTED_OUT = 'OPTED_OUT',
}

export const PERSON_WHATSAPP_CONSENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05600-0000-4000-8000-000000000002';

export default defineField({
  universalIdentifier:
    PERSON_WHATSAPP_CONSENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'whatsappConsentStatus',
  label: 'Consentimento WhatsApp',
  description:
    'Base factual para permitir ou bloquear contato ativo pelo WhatsApp.',
  icon: 'IconShieldCheck',
  defaultValue: `'${WhatsAppConsentStatus.UNKNOWN}'`,
  options: [
    {
      id: 'd1e05610-0000-4000-8000-000000000001',
      value: WhatsAppConsentStatus.UNKNOWN,
      label: 'Não confirmado',
      position: 0,
      color: 'gray',
    },
    {
      id: 'd1e05610-0000-4000-8000-000000000002',
      value: WhatsAppConsentStatus.OPTED_IN,
      label: 'Autorizado',
      position: 1,
      color: 'green',
    },
    {
      id: 'd1e05610-0000-4000-8000-000000000003',
      value: WhatsAppConsentStatus.OPTED_OUT,
      label: 'Recusado',
      position: 2,
      color: 'red',
    },
  ],
});
