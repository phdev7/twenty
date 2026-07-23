import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_DECISION_ACCESS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000009';

export default defineField({
  universalIdentifier:
    OPPORTUNITY_DECISION_ACCESS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'decisionAccessConfirmed',
  label: 'Acesso ao decisor',
  description:
    'Confirma que a equipe possui acesso direto ou validado à pessoa que decide a compra.',
  icon: 'IconUserCheck',
  isNullable: true,
});
