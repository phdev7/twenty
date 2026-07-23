import {
  defineView,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_FIELD_IDS,
  INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  INBOX_RELATION_FIELD_IDS,
  INBOX_VIEW_IDS,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';
import { InboxConversationStatus } from 'src/modules/inbox/objects/inbox-conversation.object';

export default defineView({
  universalIdentifier: INBOX_VIEW_IDS.activeConversations,
  name: 'Inbox ativa',
  objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconInbox',
  position: 0,
  fields: [
    {
      universalIdentifier: INBOX_VIEW_IDS.activeConversationsFields.name,
      fieldMetadataUniversalIdentifier: INBOX_CONVERSATION_FIELD_IDS.name,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.activeConversationsFields.status,
      fieldMetadataUniversalIdentifier: INBOX_CONVERSATION_FIELD_IDS.status,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.activeConversationsFields.priority,
      fieldMetadataUniversalIdentifier: INBOX_CONVERSATION_FIELD_IDS.priority,
      position: 2,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.activeConversationsFields.person,
      fieldMetadataUniversalIdentifier:
        INBOX_RELATION_FIELD_IDS.personOnConversation,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.activeConversationsFields.company,
      fieldMetadataUniversalIdentifier:
        INBOX_RELATION_FIELD_IDS.companyOnConversation,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier:
        INBOX_VIEW_IDS.activeConversationsFields.opportunity,
      fieldMetadataUniversalIdentifier:
        INBOX_RELATION_FIELD_IDS.opportunityOnConversation,
      position: 5,
      isVisible: true,
      size: 190,
    },
    {
      universalIdentifier: INBOX_VIEW_IDS.activeConversationsFields.assignee,
      fieldMetadataUniversalIdentifier:
        INBOX_RELATION_FIELD_IDS.assigneeOnConversation,
      position: 6,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier:
        INBOX_VIEW_IDS.activeConversationsFields.unreadCount,
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.unreadCount,
      position: 7,
      isVisible: true,
      size: 90,
    },
    {
      universalIdentifier:
        INBOX_VIEW_IDS.activeConversationsFields.lastMessagePreview,
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.lastMessagePreview,
      position: 8,
      isVisible: true,
      size: 300,
    },
    {
      universalIdentifier:
        INBOX_VIEW_IDS.activeConversationsFields.lastMessageAt,
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.lastMessageAt,
      position: 9,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier:
        INBOX_VIEW_IDS.activeConversationsFields.followUpDueAt,
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.followUpDueAt,
      position: 10,
      isVisible: true,
      size: 150,
    },
  ],
  filters: [
    {
      universalIdentifier: INBOX_VIEW_IDS.activeConversationsFilter,
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.status,
      operand: ViewFilterOperand.IS_NOT,
      value: [InboxConversationStatus.RESOLVED],
    },
  ],
  sorts: [
    {
      universalIdentifier: INBOX_VIEW_IDS.activeConversationsSort,
      fieldMetadataUniversalIdentifier:
        INBOX_CONVERSATION_FIELD_IDS.lastMessageAt,
      direction: ViewSortDirection.DESC,
    },
  ],
});
