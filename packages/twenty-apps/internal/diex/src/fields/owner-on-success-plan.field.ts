import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export const OWNER_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000024';
export const SUCCESS_PLANS_ON_OWNER_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000025';

export default defineField({
  universalIdentifier: OWNER_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'owner',
  label: 'Responsável de CS',
  icon: 'IconUserCheck',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    SUCCESS_PLANS_ON_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'ownerId',
  },
});
