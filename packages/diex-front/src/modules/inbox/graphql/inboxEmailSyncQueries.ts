import { gql } from '@apollo/client';

export const FIND_ELIGIBLE_DIEX_EMAIL_CHANNELS = gql`
  query FindEligibleDiexEmailChannels {
    myMessageChannels {
      id
      handle
      type
      visibility
      isSyncEnabled
      syncStatus
      connectedAccountId
      connectedAccount {
        id
        handle
        provider
        archivedAt
      }
    }
  }
`;

export const FIND_DIEX_EMAIL_MESSAGE_ASSOCIATIONS = gql`
  query FindDiexEmailMessageAssociations(
    $filter: MessageChannelMessageAssociationFilterInput
    $orderBy: [MessageChannelMessageAssociationOrderByInput]
  ) {
    messageChannelMessageAssociations(
      filter: $filter
      orderBy: $orderBy
      first: 500
    ) {
      edges {
        node {
          id
          messageChannelId
          messageExternalId
          messageThreadExternalId
          direction
          createdAt
          message {
            id
            headerMessageId
            subject
            text
            receivedAt
            createdAt
            isDraft
            messageThread {
              id
              subject
            }
            messageParticipants {
              edges {
                node {
                  id
                  role
                  handle
                  displayName
                  person {
                    id
                    name {
                      firstName
                      lastName
                    }
                    company {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const FIND_EXISTING_EMAIL_CONVERSATIONS = gql`
  query FindExistingEmailConversations($filter: InboxConversationFilterInput) {
    inboxConversations(filter: $filter, first: 500) {
      edges {
        node {
          id
          name
          providerThreadKey
          status
          contactHandle
          unreadCount
          lastMessageAt
          metadata
          person {
            id
          }
          company {
            id
          }
          opportunity {
            id
          }
        }
      }
    }
  }
`;

export const FIND_EXISTING_EMAIL_MESSAGES = gql`
  query FindExistingEmailMessages($filter: InboxMessageFilterInput) {
    inboxMessages(filter: $filter, first: 500) {
      edges {
        node {
          id
          providerMessageKey
        }
      }
    }
  }
`;

export const FIND_OPPORTUNITIES_BY_POINT_OF_CONTACT = gql`
  query FindOpportunitiesByPointOfContact(
    $filter: OpportunityFilterInput
    $orderBy: [OpportunityOrderByInput]
  ) {
    opportunities(filter: $filter, orderBy: $orderBy, first: 500) {
      edges {
        node {
          id
          name
          pointOfContact {
            id
          }
        }
      }
    }
  }
`;

export const CREATE_EMAIL_INBOX_CONVERSATION = gql`
  mutation CreateEmailInboxConversation($data: InboxConversationCreateInput!) {
    createInboxConversation(data: $data) {
      id
    }
  }
`;

export const UPDATE_EMAIL_INBOX_CONVERSATION = gql`
  mutation UpdateEmailInboxConversation(
    $id: UUID!
    $data: InboxConversationUpdateInput!
  ) {
    updateInboxConversation(id: $id, data: $data) {
      id
    }
  }
`;

export const CREATE_EMAIL_INBOX_MESSAGE = gql`
  mutation CreateEmailInboxMessage($data: InboxMessageCreateInput!) {
    createInboxMessage(data: $data) {
      id
    }
  }
`;

export const SEND_DIEX_EMAIL = gql`
  mutation SendDiexEmail($input: SendEmailInput!) {
    sendEmail(input: $input) {
      success
      error
      messageThreadId
    }
  }
`;
