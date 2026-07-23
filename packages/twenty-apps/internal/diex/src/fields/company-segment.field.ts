import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_SEGMENT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05500-0000-4000-8000-000000000011';

export default defineField({
  universalIdentifier: COMPANY_SEGMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.TEXT,
  name: 'diexSegment',
  label: 'Segmento',
  description: 'Segmento comercial usado para aderência ao ICP e priorização.',
  icon: 'IconCategory',
  isNullable: true,
});
