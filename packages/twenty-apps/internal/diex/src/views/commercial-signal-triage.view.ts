import { defineView, ViewType } from 'twenty-sdk/define';

import { COMPANY_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-commercial-signal.field';
import { OPPORTUNITY_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-on-commercial-signal.field';
import { PERSON_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-on-commercial-signal.field';
import {
  COMMERCIAL_SIGNAL_CAPTURED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_SIGNAL_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_SIGNAL_RECOMMENDED_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_SIGNAL_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_SIGNAL_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_SIGNAL_STATUS_OPTIONS,
  COMMERCIAL_SIGNAL_STRENGTH_FIELD_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_SIGNAL_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER,
} from 'src/objects/commercial-signal.object';

export const COMMERCIAL_SIGNAL_TRIAGE_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e07000-0000-4000-8000-000000000002';

const GROUP_UNIVERSAL_IDENTIFIERS = [
  'd1e07200-0000-4000-8000-000000000001',
  'd1e07200-0000-4000-8000-000000000002',
  'd1e07200-0000-4000-8000-000000000003',
  'd1e07200-0000-4000-8000-000000000004',
];

export default defineView({
  universalIdentifier: COMMERCIAL_SIGNAL_TRIAGE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Triagem de sinais',
  objectUniversalIdentifier: COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconRadar',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    COMMERCIAL_SIGNAL_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        COMMERCIAL_SIGNAL_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        COMMERCIAL_SIGNAL_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        COMMERCIAL_SIGNAL_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        COMMERCIAL_SIGNAL_STRENGTH_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        OPPORTUNITY_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier:
        COMPANY_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier:
        PERSON_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000008',
      fieldMetadataUniversalIdentifier:
        COMMERCIAL_SIGNAL_CAPTURED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 7,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e07300-0000-4000-8000-000000000009',
      fieldMetadataUniversalIdentifier:
        COMMERCIAL_SIGNAL_RECOMMENDED_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 8,
      isVisible: true,
      size: 300,
    },
  ],
  groups: COMMERCIAL_SIGNAL_STATUS_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_UNIVERSAL_IDENTIFIERS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
