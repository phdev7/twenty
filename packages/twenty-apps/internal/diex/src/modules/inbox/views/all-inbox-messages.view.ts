import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_MESSAGE_FIELD_IDS,
  INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  INBOX_RELATION_FIELD_IDS,
  INBOX_VIEW_IDS,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineView({
  universalIdentifier: INBOX_VIEW_IDS.allMessages,
  name: 'Histórico da inbox',
  objectUniversalIdentifier: INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconMessages',
  position: 0,
  fields: [
    {
      universalIdentifier: INBOX_VIEW_IDS.allMessagesFields.name,
      fieldMetadataUniversalIdentifier: INBOX_MESSAGE_FIELD_IDS.name,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.allMessagesFields.conversation,
      fieldMetadataUniversalIdentifier:
        INBOX_RELATION_FIELD_IDS.conversationOnMessage,
      position: 1,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.allMessagesFields.direction,
      fieldMetadataUniversalIdentifier: INBOX_MESSAGE_FIELD_IDS.direction,
      position: 2,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.allMessagesFields.type,
      fieldMetadataUniversalIdentifier: INBOX_MESSAGE_FIELD_IDS.type,
      position: 3,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier:
        INBOX_VIEW_IDS.allMessagesFields.deliveryStatus,
      fieldMetadataUniversalIdentifier:
        INBOX_MESSAGE_FIELD_IDS.deliveryStatus,
      position: 4,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier:
        INBOX_VIEW_IDS.allMessagesFields.senderDisplayName,
      fieldMetadataUniversalIdentifier:
        INBOX_MESSAGE_FIELD_IDS.senderDisplayName,
      position: 5,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.allMessagesFields.body,
      fieldMetadataUniversalIdentifier: INBOX_MESSAGE_FIELD_IDS.body,
      position: 6,
      isVisible: true,
      size: 320,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.allMessagesFields.sentAt,
      fieldMetadataUniversalIdentifier: INBOX_MESSAGE_FIELD_IDS.sentAt,
      position: 7,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier:
        INBOX_VIEW_IDS.allMessagesFields.isInternalNote,
      fieldMetadataUniversalIdentifier:
        INBOX_MESSAGE_FIELD_IDS.isInternalNote,
      position: 8,
      isVisible: true,
      size: 110,
    },
  ],
  sorts: [
    {
      universalIdentifier: INBOX_VIEW_IDS.allMessagesSort,
      fieldMetadataUniversalIdentifier: INBOX_MESSAGE_FIELD_IDS.sentAt,
      direction: ViewSortDirection.DESC,
    },
  ],
});
