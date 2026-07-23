import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_NICHE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000012';

export default defineField({
  universalIdentifier: COMPANY_NICHE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.TEXT,
  name: 'diexNiche',
  label: 'Nicho',
  description: 'Nicho específico da conta para abordagem comercial contextual.',
  icon: 'IconTargetArrow',
  isNullable: true,
});
