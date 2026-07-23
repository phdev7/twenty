import { defineView, ViewType } from 'twenty-sdk/define';

import { SUCCESS_PLAN_ON_MILESTONE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/success-plan-on-milestone.field';
import {
  SUCCESS_MILESTONE_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_MILESTONE_DUE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_MILESTONE_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_MILESTONE_IMPACT_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_MILESTONE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_MILESTONE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_MILESTONE_STATUS_OPTIONS,
  SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER,
} from 'src/objects/success-milestone.object';

export const SUCCESS_MILESTONES_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e07000-0000-4000-8000-000000000004';

const GROUP_UNIVERSAL_IDENTIFIERS = [
  'd1e07600-0000-4000-8000-000000000001',
  'd1e07600-0000-4000-8000-000000000002',
  'd1e07600-0000-4000-8000-000000000003',
  'd1e07600-0000-4000-8000-000000000004',
  'd1e07600-0000-4000-8000-000000000005',
];

export default defineView({
  universalIdentifier: SUCCESS_MILESTONES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Marcos de sucesso',
  objectUniversalIdentifier: SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconFlag3',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    SUCCESS_MILESTONE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'd1e07700-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        SUCCESS_MILESTONE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'd1e07700-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        SUCCESS_PLAN_ON_MILESTONE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'd1e07700-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        SUCCESS_MILESTONE_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'd1e07700-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        SUCCESS_MILESTONE_DUE_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e07700-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        SUCCESS_MILESTONE_IMPACT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'd1e07700-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier:
        SUCCESS_MILESTONE_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 300,
    },
  ],
  groups: SUCCESS_MILESTONE_STATUS_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_UNIVERSAL_IDENTIFIERS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
