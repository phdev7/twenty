import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_MACRO_FIELD_IDS,
  INBOX_MACROS_VIEW_UNIVERSAL_IDENTIFIER,
  INBOX_MACRO_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-macro.constants';

export default defineView({
  universalIdentifier: INBOX_MACROS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Macros da inbox',
  objectUniversalIdentifier: INBOX_MACRO_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconWand',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.name,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.shortcut,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.channel,
      position: 2,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        INBOX_MACRO_FIELD_IDS.targetConversationStatus,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.targetPriority,
      position: 4,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.label,
      position: 5,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.team,
      position: 6,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000008',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.assignee,
      position: 7,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-000000000009',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.savedReply,
      position: 8,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-00000000000a',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.usageCount,
      position: 9,
      isVisible: true,
      size: 90,
    },
    {
      universalIdentifier: 'd1e0fb41-0000-4000-8000-00000000000b',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.status,
      position: 10,
      isVisible: true,
      size: 100,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'd1e0fb42-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_MACRO_FIELD_IDS.usageCount,
      direction: ViewSortDirection.DESC,
    },
  ],
});
