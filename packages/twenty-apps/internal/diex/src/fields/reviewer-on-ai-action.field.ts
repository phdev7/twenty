import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';

export const REVIEWER_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000036';
export const AI_ACTIONS_ON_REVIEWER_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000037';

export default defineField({
  universalIdentifier: REVIEWER_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'reviewer',
  label: 'Revisor',
  icon: 'IconUserCheck',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    AI_ACTIONS_ON_REVIEWER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'reviewerId',
  },
});
