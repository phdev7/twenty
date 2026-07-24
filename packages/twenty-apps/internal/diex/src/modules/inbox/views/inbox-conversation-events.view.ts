import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_EVENT_FIELD_IDS,
  INBOX_CONVERSATION_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
  INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-conversation-event.constants';

export default defineView({
  universalIdentifier: INBOX_CONVERSATION_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Histórico da inbox',
  objectUniversalIdentifier: INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconTimelineEvent',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e0fc41-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_EVENT_FIELD_IDS.summary,
      position: 0,
      isVisible: true,
      size: 300,
    },
    {
      universalIdentifier: 'd1e0fc41-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_EVENT_FIELD_IDS.eventType,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e0fc41-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_EVENT_FIELD_IDS.conversation,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fc41-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_EVENT_FIELD_IDS.actor,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fc41-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_EVENT_FIELD_IDS.details,
      position: 4,
      isVisible: true,
      size: 360,
    },
    {
      universalIdentifier: 'd1e0fc41-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_EVENT_FIELD_IDS.occurredAt,
      position: 5,
      isVisible: true,
      size: 160,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'd1e0fc42-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_EVENT_FIELD_IDS.occurredAt,
      direction: ViewSortDirection.DESC,
    },
  ],
});
