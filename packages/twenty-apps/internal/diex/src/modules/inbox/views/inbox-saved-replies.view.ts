import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_SAVED_REPLY_BODY_FIELD_UNIVERSAL_IDENTIFIER,
  INBOX_SAVED_REPLY_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
  INBOX_SAVED_REPLY_CHANNEL_FIELD_UNIVERSAL_IDENTIFIER,
  INBOX_SAVED_REPLY_LAST_USED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  INBOX_SAVED_REPLY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  INBOX_SAVED_REPLY_SHORTCUT_FIELD_UNIVERSAL_IDENTIFIER,
  INBOX_SAVED_REPLY_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER,
  INBOX_SAVED_REPLY_USAGE_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/objects/inbox-saved-reply.object';

export const INBOX_SAVED_REPLIES_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e0d200-0000-4000-8000-000000000001';

export default defineView({
  universalIdentifier: INBOX_SAVED_REPLIES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Respostas prontas',
  objectUniversalIdentifier: INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconBolt',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e0d210-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 190,
    },
    {
      universalIdentifier: 'd1e0d210-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_SHORTCUT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: 'd1e0d210-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'd1e0d210-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_CHANNEL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd1e0d210-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_BODY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 380,
    },
    {
      universalIdentifier: 'd1e0d210-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_USAGE_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 90,
    },
    {
      universalIdentifier: 'd1e0d210-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_LAST_USED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e0d210-0000-4000-8000-000000000008',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 7,
      isVisible: true,
      size: 110,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'd1e0d230-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        INBOX_SAVED_REPLY_USAGE_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.DESC,
    },
  ],
});
