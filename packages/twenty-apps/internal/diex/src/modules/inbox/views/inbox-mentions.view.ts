import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_MENTION_FIELD_IDS,
  INBOX_MENTIONS_VIEW_UNIVERSAL_IDENTIFIER,
  INBOX_MENTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-mention.constants';

export default defineView({
  universalIdentifier: INBOX_MENTIONS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Menções da inbox',
  objectUniversalIdentifier: INBOX_MENTION_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconAt',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e0fa41-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_MENTION_FIELD_IDS.name,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fa41-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        INBOX_MENTION_FIELD_IDS.mentionedWorkspaceMember,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fa41-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        INBOX_MENTION_FIELD_IDS.authorWorkspaceMember,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fa41-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier: INBOX_MENTION_FIELD_IDS.conversation,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fa41-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier: INBOX_MENTION_FIELD_IDS.excerpt,
      position: 4,
      isVisible: true,
      size: 300,
    },
    {
      universalIdentifier: 'd1e0fa41-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier: INBOX_MENTION_FIELD_IDS.status,
      position: 5,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'd1e0fa41-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier: INBOX_MENTION_FIELD_IDS.mentionedAt,
      position: 6,
      isVisible: true,
      size: 150,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'd1e0fa42-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_MENTION_FIELD_IDS.mentionedAt,
      direction: ViewSortDirection.DESC,
    },
  ],
});
