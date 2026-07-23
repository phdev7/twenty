import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER } from 'src/objects/commercial-signal.object';

export const PERSON_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000010';
export const COMMERCIAL_SIGNALS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000011';

export default defineField({
  universalIdentifier: PERSON_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'person',
  label: 'Pessoa',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    COMMERCIAL_SIGNALS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'personId',
  },
});
