import { defineView, ViewType } from 'twenty-sdk/define';

import { COMPANY_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-success-plan.field';
import { OWNER_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/owner-on-success-plan.field';
import { PRIMARY_CONTACT_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/primary-contact-on-success-plan.field';
import {
  SUCCESS_HEALTH_OPTIONS,
  SUCCESS_PLAN_HEALTH_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_LIFECYCLE_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_NEXT_REVIEW_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_RECURRING_REVENUE_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
} from 'src/objects/success-plan.object';

export const CUSTOMER_SUCCESS_PORTFOLIO_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e07000-0000-4000-8000-000000000003';

const GROUP_UNIVERSAL_IDENTIFIERS = [
  'd1e07400-0000-4000-8000-000000000001',
  'd1e07400-0000-4000-8000-000000000002',
  'd1e07400-0000-4000-8000-000000000003',
  'd1e07400-0000-4000-8000-000000000004',
];

export default defineView({
  universalIdentifier: CUSTOMER_SUCCESS_PORTFOLIO_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Saúde da carteira',
  objectUniversalIdentifier: SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconHeartHandshake',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    SUCCESS_PLAN_HEALTH_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'd1e07500-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        SUCCESS_PLAN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'd1e07500-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        COMPANY_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'd1e07500-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        SUCCESS_PLAN_LIFECYCLE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'd1e07500-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        SUCCESS_PLAN_RECURRING_REVENUE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e07500-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        SUCCESS_PLAN_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'd1e07500-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier:
        SUCCESS_PLAN_NEXT_REVIEW_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e07500-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier:
        OWNER_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e07500-0000-4000-8000-000000000008',
      fieldMetadataUniversalIdentifier:
        PRIMARY_CONTACT_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
      position: 7,
      isVisible: true,
      size: 180,
    },
  ],
  groups: SUCCESS_HEALTH_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_UNIVERSAL_IDENTIFIERS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
