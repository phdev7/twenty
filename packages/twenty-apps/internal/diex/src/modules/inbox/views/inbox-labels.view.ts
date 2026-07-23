import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_LABEL_FIELD_IDS,
  INBOX_LABELS_VIEW_UNIVERSAL_IDENTIFIER,
  INBOX_LABEL_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-label.constants';

export default defineView({
  universalIdentifier: INBOX_LABELS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Etiquetas da inbox',
  objectUniversalIdentifier: INBOX_LABEL_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconTags',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e0e210-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_LABEL_FIELD_IDS.name,
      position: 0,
      isVisible: true,
      size: 190,
    },
    {
      universalIdentifier: 'd1e0e210-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier: INBOX_LABEL_FIELD_IDS.slug,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd1e0e210-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier: INBOX_LABEL_FIELD_IDS.color,
      position: 2,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'd1e0e210-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier: INBOX_LABEL_FIELD_IDS.description,
      position: 3,
      isVisible: true,
      size: 360,
    },
    {
      universalIdentifier: 'd1e0e210-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier: INBOX_LABEL_FIELD_IDS.usageCount,
      position: 4,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: 'd1e0e210-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier: INBOX_LABEL_FIELD_IDS.status,
      position: 5,
      isVisible: true,
      size: 110,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'd1e0e230-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_LABEL_FIELD_IDS.name,
      direction: ViewSortDirection.ASC,
    },
  ],
});
