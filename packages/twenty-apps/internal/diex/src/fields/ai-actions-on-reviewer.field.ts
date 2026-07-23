import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AI_ACTIONS_ON_REVIEWER_FIELD_UNIVERSAL_IDENTIFIER,
  REVIEWER_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/reviewer-on-ai-action.field';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';

export default defineField({
  universalIdentifier: AI_ACTIONS_ON_REVIEWER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'diexReviewActions',
  label: 'Ações de IA para revisão',
  icon: 'IconShieldCheck',
  relationTargetObjectMetadataUniversalIdentifier:
    AI_ACTION_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    REVIEWER_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
