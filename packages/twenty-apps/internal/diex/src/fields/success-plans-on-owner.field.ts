import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OWNER_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLANS_ON_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/owner-on-success-plan.field';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export default defineField({
  universalIdentifier: SUCCESS_PLANS_ON_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexOwnedSuccessPlans',
  label: 'Planos de sucesso sob responsabilidade',
  icon: 'IconHeartHandshake',
  relationTargetObjectMetadataUniversalIdentifier:
    SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    OWNER_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
