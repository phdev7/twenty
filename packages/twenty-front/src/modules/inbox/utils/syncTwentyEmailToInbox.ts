import { type ApolloClient } from '@apollo/client';
import { isDefined } from 'twenty-shared/utils';

import {
  CREATE_EMAIL_INBOX_CONVERSATION,
  CREATE_EMAIL_INBOX_MESSAGE,
  FIND_EXISTING_EMAIL_CONVERSATIONS,
  FIND_EXISTING_EMAIL_MESSAGES,
  FIND_OPPORTUNITIES_BY_POINT_OF_CONTACT,
  FIND_TWENTY_EMAIL_MESSAGE_ASSOCIATIONS,
  UPDATE_EMAIL_INBOX_CONVERSATION,
} from '@/inbox/graphql/inboxEmailSyncQueries';
import { type InboxRecordReference } from '@/inbox/types/inboxEntityTypes';
import {
  type TwentyEmailChannel,
  type TwentyEmailSyncResult,
  type TwentyEmailSyncRouting,
} from '@/inbox/types/twentyEmailSyncTypes';
import { getRecordName } from '@/inbox/utils/getRecordName';
import { loadEligibleTwentyEmailChannels } from '@/inbox/utils/loadEligibleTwentyEmailChannels';
import {
  queueInboxAutomationEvaluations,
  reconcileInboxAutomationEvaluations,
} from '@/inbox/utils/reconcileInboxAutomationEvaluations';

type NativePersonReference = InboxRecordReference & {
  company?: InboxRecordReference | null;
};

type NativeMessageParticipant = {
  id: string;
  role: string;
  handle?: string | null;
  displayName?: string | null;
  person?: NativePersonReference | null;
};

type NativeMessage = {
  id: string;
  headerMessageId?: string | null;
  subject?: string | null;
  text?: string | null;
  receivedAt?: string | null;
  createdAt?: string | null;
  isDraft?: boolean | null;
  messageThread?: { id: string; subject?: string | null } | null;
  messageParticipants?: {
    edges?: Array<{ node: NativeMessageParticipant }>;
  } | null;
};

type NativeMessageAssociation = {
  id: string;
  messageChannelId: string;
  messageExternalId?: string | null;
  messageThreadExternalId?: string | null;
  direction?: string | null;
  createdAt?: string | null;
  message?: NativeMessage | null;
};

type ExistingConversation = {
  id: string;
  name: string;
  providerThreadKey: string;
  status: string;
  contactHandle?: string | null;
  unreadCount?: number | null;
  lastMessageAt?: string | null;
  metadata?: unknown;
  person?: InboxRecordReference | null;
  company?: InboxRecordReference | null;
  opportunity?: InboxRecordReference | null;
};

type ExistingInboxMessage = { id: string; providerMessageKey: string };

type NativeOpportunity = InboxRecordReference & {
  pointOfContact?: InboxRecordReference | null;
};

type ConversationGroup = {
  providerThreadKey: string;
  channel: TwentyEmailChannel;
  messageThreadId: string;
  messageThreadExternalId: string;
  messages: NativeMessageAssociation[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeEmail = (value?: string | null): string =>
  value?.trim().toLowerCase() ?? '';

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getTimestamp = (message: NativeMessageAssociation): number => {
  const value =
    message.message?.receivedAt ??
    message.message?.createdAt ??
    message.createdAt ??
    '';
  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getOccurredAt = (message: NativeMessageAssociation): string =>
  new Date(getTimestamp(message) || Date.now()).toISOString();

const isIncoming = (association: NativeMessageAssociation): boolean =>
  association.direction === 'INCOMING';

const getParticipants = (
  association: NativeMessageAssociation,
): NativeMessageParticipant[] =>
  association.message?.messageParticipants?.edges?.map(({ node }) => node) ??
  [];

const getContactParticipant = (
  association: NativeMessageAssociation,
  channelHandle: string,
): NativeMessageParticipant | null => {
  const participants = getParticipants(association);
  const targetRole = isIncoming(association) ? 'FROM' : 'TO';
  const normalizedChannelHandle = normalizeEmail(channelHandle);

  return (
    participants.find(
      ({ role, handle }) =>
        role === targetRole &&
        normalizeEmail(handle) !== normalizedChannelHandle &&
        isValidEmail(normalizeEmail(handle)),
    ) ?? null
  );
};

const getSenderParticipant = (
  association: NativeMessageAssociation,
): NativeMessageParticipant | null =>
  getParticipants(association).find(({ role }) => role === 'FROM') ?? null;

const buildProviderThreadKey = ({
  channelId,
  messageThreadExternalId,
}: {
  channelId: string;
  messageThreadExternalId: string;
}): string => `TWENTY_EMAIL:${channelId}:${messageThreadExternalId}`;

const buildProviderMessageKey = (
  association: NativeMessageAssociation,
): string =>
  `TWENTY_EMAIL:${association.messageChannelId}:${
    association.messageExternalId || association.message?.id || association.id
  }`;

const getSubject = (association: NativeMessageAssociation): string =>
  association.message?.subject?.trim() ||
  association.message?.messageThread?.subject?.trim() ||
  'Conversa por e-mail';

const getBodyPreview = (association: NativeMessageAssociation): string =>
  (association.message?.text?.trim() || getSubject(association)).slice(0, 250);

const parseExistingMetadata = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const loadNativeAssociations = async (
  apolloCoreClient: ApolloClient,
  channelIds: string[],
): Promise<NativeMessageAssociation[]> => {
  const { data } = await apolloCoreClient.query<{
    messageChannelMessageAssociations?: {
      edges?: Array<{ node: NativeMessageAssociation }>;
    };
  }>({
    query: FIND_TWENTY_EMAIL_MESSAGE_ASSOCIATIONS,
    variables: {
      filter: { messageChannelId: { in: channelIds } },
      orderBy: [{ createdAt: 'DescNullsLast' }],
    },
    fetchPolicy: 'network-only',
  });

  const associations =
    data?.messageChannelMessageAssociations?.edges?.map(({ node }) => node) ??
    [];

  return associations.filter(
    ({ message }) =>
      isDefined(message) && isDefined(message.id) && message.isDraft !== true,
  );
};

const groupAssociations = (
  associations: NativeMessageAssociation[],
  channels: TwentyEmailChannel[],
): ConversationGroup[] => {
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));
  const groups = new Map<string, ConversationGroup>();

  for (const association of associations) {
    const channel = channelById.get(association.messageChannelId);
    const messageThreadId = association.message?.messageThread?.id;
    const messageThreadExternalId =
      association.messageThreadExternalId || messageThreadId;

    if (!channel || !messageThreadId || !messageThreadExternalId) {
      continue;
    }

    const providerThreadKey = buildProviderThreadKey({
      channelId: channel.id,
      messageThreadExternalId,
    });
    const current = groups.get(providerThreadKey);

    if (current) {
      current.messages.push(association);
    } else {
      groups.set(providerThreadKey, {
        providerThreadKey,
        channel,
        messageThreadId,
        messageThreadExternalId,
        messages: [association],
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      messages: [...group.messages].sort(
        (left, right) => getTimestamp(left) - getTimestamp(right),
      ),
    }))
    .filter((group) =>
      group.messages.some((message) =>
        Boolean(getContactParticipant(message, group.channel.handle)),
      ),
    );
};

const loadExistingConversations = async (
  apolloCoreClient: ApolloClient,
  providerThreadKeys: string[],
): Promise<ExistingConversation[]> => {
  if (providerThreadKeys.length === 0) {
    return [];
  }

  const { data } = await apolloCoreClient.query<{
    inboxConversations?: { edges?: Array<{ node: ExistingConversation }> };
  }>({
    query: FIND_EXISTING_EMAIL_CONVERSATIONS,
    variables: { filter: { providerThreadKey: { in: providerThreadKeys } } },
    fetchPolicy: 'network-only',
  });

  return data?.inboxConversations?.edges?.map(({ node }) => node) ?? [];
};

const loadExistingMessages = async (
  apolloCoreClient: ApolloClient,
  providerMessageKeys: string[],
): Promise<ExistingInboxMessage[]> => {
  if (providerMessageKeys.length === 0) {
    return [];
  }

  const { data } = await apolloCoreClient.query<{
    inboxMessages?: { edges?: Array<{ node: ExistingInboxMessage }> };
  }>({
    query: FIND_EXISTING_EMAIL_MESSAGES,
    variables: { filter: { providerMessageKey: { in: providerMessageKeys } } },
    fetchPolicy: 'network-only',
  });

  return data?.inboxMessages?.edges?.map(({ node }) => node) ?? [];
};

const loadOpportunitiesByPerson = async (
  apolloCoreClient: ApolloClient,
  personIds: string[],
): Promise<Map<string, NativeOpportunity>> => {
  if (personIds.length === 0) {
    return new Map();
  }

  const { data } = await apolloCoreClient.query<{
    opportunities?: { edges?: Array<{ node: NativeOpportunity }> };
  }>({
    query: FIND_OPPORTUNITIES_BY_POINT_OF_CONTACT,
    variables: {
      filter: { pointOfContactId: { in: personIds } },
      orderBy: [{ updatedAt: 'DescNullsLast' }],
    },
    fetchPolicy: 'network-only',
  });
  const opportunityByPersonId = new Map<string, NativeOpportunity>();

  for (const opportunity of data?.opportunities?.edges?.map(
    ({ node }) => node,
  ) ?? []) {
    if (
      opportunity.pointOfContact?.id &&
      !opportunityByPersonId.has(opportunity.pointOfContact.id)
    ) {
      opportunityByPersonId.set(opportunity.pointOfContact.id, opportunity);
    }
  }

  return opportunityByPersonId;
};

const getRepresentativeContact = (
  group: ConversationGroup,
): NativeMessageParticipant | null => {
  for (let index = group.messages.length - 1; index >= 0; index -= 1) {
    const contact = getContactParticipant(
      group.messages[index],
      group.channel.handle,
    );

    if (contact) {
      return contact;
    }
  }

  return null;
};

const buildConversationMetadata = ({
  existingMetadata,
  group,
  latestMessage,
}: {
  existingMetadata?: unknown;
  group: ConversationGroup;
  latestMessage: NativeMessageAssociation;
}): Record<string, unknown> => ({
  ...parseExistingMetadata(existingMetadata),
  source: 'TWENTY_NATIVE_EMAIL',
  messageChannelId: group.channel.id,
  connectedAccountId: group.channel.connectedAccountId,
  channelHandle: group.channel.handle,
  messageThreadId: group.messageThreadId,
  messageThreadExternalId: group.messageThreadExternalId,
  lastMessageExternalId: latestMessage.messageExternalId ?? null,
  lastHeaderMessageId: latestMessage.message?.headerMessageId ?? null,
  subject: getSubject(latestMessage),
  syncedAt: new Date().toISOString(),
});

const getFirstRespondedAt = (group: ConversationGroup): string | null => {
  const firstIncomingIndex = group.messages.findIndex(isIncoming);

  if (firstIncomingIndex < 0) {
    return null;
  }

  const response = group.messages
    .slice(firstIncomingIndex + 1)
    .find((message) => !isIncoming(message));

  return response ? getOccurredAt(response) : null;
};

export const syncTwentyEmailToInbox = async ({
  apolloClient,
  apolloCoreClient,
  workspaceId,
  routing,
}: {
  apolloClient: ApolloClient;
  apolloCoreClient: ApolloClient;
  workspaceId: string;
  routing?: TwentyEmailSyncRouting;
}): Promise<TwentyEmailSyncResult> => {
  const channels = await loadEligibleTwentyEmailChannels(apolloClient);

  if (channels.length === 0) {
    return {
      eligibleChannels: 0,
      importedThreads: 0,
      createdConversations: 0,
      updatedConversations: 0,
      createdMessages: 0,
      automationEvaluationsQueued: 0,
      automationEvaluationsPending: 0,
      automationWarnings: [],
    };
  }

  const associations = await loadNativeAssociations(
    apolloCoreClient,
    channels.map(({ id }) => id),
  );
  const groups = groupAssociations(associations, channels);
  const providerThreadKeys = groups.map(
    ({ providerThreadKey }) => providerThreadKey,
  );
  const providerMessageKeys = associations.map(buildProviderMessageKey);
  const [existingConversations, existingMessages] = await Promise.all([
    loadExistingConversations(apolloCoreClient, providerThreadKeys),
    loadExistingMessages(apolloCoreClient, providerMessageKeys),
  ]);
  const conversationByKey = new Map(
    existingConversations.map((conversation) => [
      conversation.providerThreadKey,
      conversation,
    ]),
  );
  const existingMessageKeys = new Set(
    existingMessages.map(({ providerMessageKey }) => providerMessageKey),
  );
  const representativeContacts = groups
    .map(getRepresentativeContact)
    .filter(
      (contact): contact is NativeMessageParticipant =>
        contact?.person?.id != null,
    );
  const opportunityByPersonId = await loadOpportunitiesByPerson(
    apolloCoreClient,
    [...new Set(representativeContacts.map(({ person }) => person!.id))],
  );
  let createdConversations = 0;
  let updatedConversations = 0;
  let createdMessages = 0;

  for (const group of groups) {
    const contact = getRepresentativeContact(group);

    if (!contact) {
      continue;
    }

    const contactHandle = normalizeEmail(contact.handle);
    const latestMessage = group.messages[group.messages.length - 1];
    const existing = conversationByKey.get(group.providerThreadKey);
    const missingMessages = group.messages.filter(
      (message) => !existingMessageKeys.has(buildProviderMessageKey(message)),
    );
    const newIncomingCount = missingMessages.filter(isIncoming).length;
    const latestMessageAt = getOccurredAt(latestMessage);
    const latestIsNewer =
      !existing?.lastMessageAt ||
      Date.parse(latestMessageAt) >= Date.parse(existing.lastMessageAt);
    const contactName =
      contact.displayName?.trim() ||
      getRecordName(contact.person) ||
      contactHandle;
    const person = contact.person ?? null;
    const company = person?.company ?? null;
    const opportunity = person?.id
      ? (opportunityByPersonId.get(person.id) ?? null)
      : null;
    const metadata = buildConversationMetadata({
      existingMetadata: existing?.metadata,
      group,
      latestMessage,
    });
    let conversationId = existing?.id;

    if (!conversationId) {
      const firstRespondedAt = getFirstRespondedAt(group);
      const firstIncoming = group.messages.find(isIncoming);
      const responseSlaMinutes = Math.max(1, routing?.responseSlaMinutes ?? 60);
      const { data } = await apolloCoreClient.mutate<{
        createInboxConversation?: { id?: string | null } | null;
      }>({
        mutation: CREATE_EMAIL_INBOX_CONVERSATION,
        variables: {
          data: {
            name: contactName || 'Contato por e-mail',
            providerThreadKey: group.providerThreadKey,
            channel: 'EMAIL',
            provider: 'TWENTY_EMAIL',
            status: 'OPEN',
            priority: 'NORMAL',
            contactHandle,
            unreadCount: isIncoming(latestMessage) ? 1 : 0,
            lastMessagePreview: getBodyPreview(latestMessage),
            lastMessageDirection: isIncoming(latestMessage)
              ? 'INBOUND'
              : 'OUTBOUND',
            lastMessageAt: latestMessageAt,
            firstResponseDueAt:
              firstIncoming && !firstRespondedAt
                ? new Date(
                    getTimestamp(firstIncoming) + responseSlaMinutes * 60_000,
                  ).toISOString()
                : null,
            firstRespondedAt,
            metadata,
            personId: person?.id ?? null,
            companyId: company?.id ?? null,
            opportunityId: opportunity?.id ?? null,
            inboxTeamId: routing?.inboxTeamId ?? null,
            assigneeId: routing?.assigneeId ?? null,
          },
        },
      });

      conversationId = data?.createInboxConversation?.id ?? undefined;

      if (!conversationId) {
        throw new Error(
          `A conversa nativa de e-mail ${group.providerThreadKey} não retornou um identificador.`,
        );
      }

      conversationByKey.set(group.providerThreadKey, {
        id: conversationId,
        name: contactName,
        providerThreadKey: group.providerThreadKey,
        status: 'OPEN',
        contactHandle,
        unreadCount: isIncoming(latestMessage) ? 1 : 0,
        lastMessageAt: latestMessageAt,
        metadata,
        person,
        company,
        opportunity,
      });
      createdConversations += 1;
    } else if (latestIsNewer || missingMessages.length > 0) {
      await apolloCoreClient.mutate({
        mutation: UPDATE_EMAIL_INBOX_CONVERSATION,
        variables: {
          id: conversationId,
          data: {
            ...(latestIsNewer
              ? {
                  lastMessagePreview: getBodyPreview(latestMessage),
                  lastMessageDirection: isIncoming(latestMessage)
                    ? 'INBOUND'
                    : 'OUTBOUND',
                  lastMessageAt: latestMessageAt,
                  metadata,
                }
              : {}),
            ...(newIncomingCount > 0
              ? {
                  status: 'OPEN',
                  snoozedUntil: null,
                  unreadCount:
                    Math.max(0, existing?.unreadCount ?? 0) + newIncomingCount,
                }
              : {}),
            ...(!existing?.contactHandle ? { contactHandle } : {}),
            ...(!existing?.person?.id && person?.id
              ? { personId: person.id }
              : {}),
            ...(!existing?.company?.id && company?.id
              ? { companyId: company.id }
              : {}),
            ...(!existing?.opportunity?.id && opportunity?.id
              ? { opportunityId: opportunity.id }
              : {}),
          },
        },
      });
      updatedConversations += 1;
    }

    for (const association of missingMessages) {
      const providerMessageKey = buildProviderMessageKey(association);
      const sender = getSenderParticipant(association);

      const { data } = await apolloCoreClient.mutate<{
        createInboxMessage?: { id?: string | null } | null;
      }>({
        mutation: CREATE_EMAIL_INBOX_MESSAGE,
        variables: {
          data: {
            name: getSubject(association).slice(0, 255),
            providerMessageKey,
            direction: isIncoming(association) ? 'INBOUND' : 'OUTBOUND',
            messageType: 'TEXT',
            body: association.message?.text?.trim() || null,
            deliveryStatus: isIncoming(association) ? 'RECEIVED' : 'SENT',
            sentAt: getOccurredAt(association),
            senderHandle: normalizeEmail(sender?.handle) || null,
            senderDisplayName:
              sender?.displayName?.trim() ||
              getRecordName(sender?.person) ||
              normalizeEmail(sender?.handle) ||
              null,
            isInternalNote: false,
            metadata: {
              source: 'TWENTY_NATIVE_EMAIL',
              messageChannelId: group.channel.id,
              messageId: association.message?.id ?? null,
              messageThreadId: group.messageThreadId,
              messageExternalId: association.messageExternalId ?? null,
              messageThreadExternalId: group.messageThreadExternalId,
              headerMessageId: association.message?.headerMessageId ?? null,
              subject: getSubject(association),
            },
            inboxConversationId: conversationId,
          },
        },
      });

      const createdInboxMessageId = data?.createInboxMessage?.id;

      if (!createdInboxMessageId) {
        throw new Error(
          `A mensagem nativa de e-mail ${providerMessageKey} não retornou um identificador.`,
        );
      }

      // Persist the server id before any later mutation can fail. The next
      // reconciliation can then recover this message even though the sync
      // no longer considers it missing on the provider side.
      if (isIncoming(association)) {
        queueInboxAutomationEvaluations({
          workspaceId,
          messageIds: [createdInboxMessageId],
        });
      }

      existingMessageKeys.add(providerMessageKey);
      createdMessages += 1;
    }
  }

  const automationReconciliation = await reconcileInboxAutomationEvaluations({
    workspaceId,
  });

  return {
    eligibleChannels: channels.length,
    importedThreads: groups.length,
    createdConversations,
    updatedConversations,
    createdMessages,
    automationEvaluationsQueued:
      automationReconciliation.queuedCount +
      automationReconciliation.alreadyQueuedCount,
    automationEvaluationsPending: automationReconciliation.pendingCount,
    automationWarnings: automationReconciliation.warnings,
  };
};
