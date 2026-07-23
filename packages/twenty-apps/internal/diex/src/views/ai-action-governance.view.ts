import { defineView, ViewType } from 'twenty-sdk/define';

import { COMMERCIAL_SIGNAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/commercial-signal-on-ai-action.field';
import { OPPORTUNITY_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-on-ai-action.field';
import { REVIEWER_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/reviewer-on-ai-action.field';
import { SUCCESS_PLAN_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/success-plan-on-ai-action.field';
import {
  AI_ACTION_CONFIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_PROPOSED_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_REQUIRES_APPROVAL_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_STATUS_OPTIONS,
  AI_ACTION_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  AI_ACTION_UNIVERSAL_IDENTIFIER,
} from 'src/objects/ai-action.object';

export const AI_ACTION_GOVERNANCE_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e07000-0000-4000-8000-000000000005';

const GROUP_UNIVERSAL_IDENTIFIERS = [
  'd1e07800-0000-4000-8000-000000000001',
  'd1e07800-0000-4000-8000-000000000002',
  'd1e07800-0000-4000-8000-000000000003',
  'd1e07800-0000-4000-8000-000000000004',
  'd1e07800-0000-4000-8000-000000000005',
  'd1e07800-0000-4000-8000-000000000006',
];

export default defineView({
  universalIdentifier: AI_ACTION_GOVERNANCE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Governança de IA',
  objectUniversalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconShieldCheck',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    AI_ACTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        AI_ACTION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        AI_ACTION_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        AI_ACTION_CONFIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        AI_ACTION_REQUIRES_APPROVAL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        AI_ACTION_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier:
        COMMERCIAL_SIGNAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000008',
      fieldMetadataUniversalIdentifier:
        SUCCESS_PLAN_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 7,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-000000000009',
      fieldMetadataUniversalIdentifier:
        REVIEWER_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 8,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07900-0000-4000-8000-00000000000a',
      fieldMetadataUniversalIdentifier:
        AI_ACTION_PROPOSED_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 9,
      isVisible: true,
      size: 320,
    },
  ],
  groups: AI_ACTION_STATUS_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_UNIVERSAL_IDENTIFIERS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
