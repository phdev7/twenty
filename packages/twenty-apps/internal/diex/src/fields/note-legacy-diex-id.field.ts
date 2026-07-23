import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'd1e05500-0000-4000-8000-000000000015',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note.universalIdentifier,
  type: FieldType.TEXT,
  name: 'legacyDiexId',
  label: 'ID legado Diex',
  description:
    'Identificador técnico usado para migração idempotente do CRM anterior.',
  icon: 'IconDatabaseImport',
  isNullable: true,
  isUnique: true,
});
