import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { type PersonName } from 'src/modules/inbox/front-components/types/inbox.types';

type NativeRecordReference = {
  id: string;
  name?: string | PersonName | null;
};

type NativePersonReference = NativeRecordReference & {
  company?: NativeRecordReference | null;
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
  messageThread?: {
    id: string;
    subject?: string | null;
  } | null;
  messageParticipants?: {
    edges?: Array<{
      node: NativeMessageParticipant;
    }>;
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
  person?: NativeRecordReference | null;
  company?: NativeRecordReference | null;
  opportunity?: NativeRecordReference | null;
};

type ExistingInboxMessage = {
  id: string;
  providerMessageKey: string;
};

type NativeOpportunity = NativeRecordReference & {
  pointOfContact?: NativeRecordReference | null;
};

export type TwentyEmailChannel = {
  id: string;
  handle: string;
  type: 'EMAIL' | 'EMAIL_GROUP' | string;
  visibility: string;
  isSyncEnabled: boolean;
  syncStatus: string;
  connectedAccountId: string;
  connectedAccount?: {
    id: string;
    handle: string;
    provider: string;
    archivedAt?: string | null;
  } | null;
};

export type TwentyEmailConversationMetadata = {
  source: 'TWENTY_NATIVE_EMAIL';
  messageChannelId: string;
  connectedAccountId: string;
  channelHandle: string;
  messageThreadId: string;
  messageThreadExternalId: string;
  lastMessageExternalId?: string | null;
  lastHeaderMessageId?: string | null;
  subject?: string | null;
  syncedAt: string;
};

export type TwentyEmailSyncRouting = {
  assigneeId?: string | null;
  inboxTeamId?: string | null;
  responseSlaMinutes?: number;
};

export type TwentyEmailSyncResult = {
  eligibleChannels: number;
  importedThreads: number;
  createdConversations: number;
  updatedConversations: number;
  createdMessages: number;
};

type SyncTwentyEmailInput = {
  coreClient?: CoreApiClient;
  metadataClient?: MetadataApiClient;
  routing?: TwentyEmailSyncRouting;
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

const getRecordName = (record?: NativeRecordReference | null): string => {
  if (!record?.name) {
    return '';
  }

  if (typeof record.name === 'string') {
    return record.name.trim();
  }

  return [record.name.firstName, record.name.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
};

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

export const readTwentyEmailConversationMetadata = (
  value: unknown,
): TwentyEmailConversationMetadata | null => {
  if (
    !isRecord(value) ||
    value.source !== 'TWENTY_NATIVE_EMAIL' ||
    typeof value.messageChannelId !== 'string' ||
    typeof value.connectedAccountId !== 'string' ||
    typeof value.channelHandle !== 'string' ||
    typeof value.messageThreadId !== 'string' ||
    typeof value.messageThreadExternalId !== 'string' ||
    typeof value.syncedAt !== 'string'
  ) {
    return null;
  }

  return {
    source: 'TWENTY_NATIVE_EMAIL',
    messageChannelId: value.messageChannelId,
    connectedAccountId: value.connectedAccountId,
    channelHandle: value.channelHandle,
    messageThreadId: value.messageThreadId,
    messageThreadExternalId: value.messageThreadExternalId,
    lastMessageExternalId:
      typeof value.lastMessageExternalId === 'string'
        ? value.lastMessageExternalId
        : null,
    lastHeaderMessageId:
      typeof value.lastHeaderMessageId === 'string'
        ? value.lastHeaderMessageId
        : null,
    subject: typeof value.subject === 'string' ? value.subject : null,
    syncedAt: value.syncedAt,
  };
};

export const loadEligibleTwentyEmailChannels = async (
  metadataClient = new MetadataApiClient(),
): Promise<TwentyEmailChannel[]> => {
  const result = (await metadataClient.query({
    myMessageChannels: {
      id: true,
      handle: true,
      type: true,
      visibility: true,
      isSyncEnabled: true,
      syncStatus: true,
      connectedAccountId: true,
      connectedAccount: {
        id: true,
        handle: true,
        provider: true,
        archivedAt: true,
      },
    },
  } as never)) as unknown as {
    myMessageChannels?: TwentyEmailChannel[];
  };

  return (result.myMessageChannels ?? []).filter(
    (channel) =>
      (channel.type === 'EMAIL' || channel.type === 'EMAIL_GROUP') &&
      channel.isSyncEnabled &&
      channel.connectedAccount?.archivedAt == null &&
      (channel.visibility === 'SHARE_EVERYTHING' ||
        channel.type === 'EMAIL_GROUP'),
  );
};

const loadNativeAssociations = async (
  client: CoreApiClient,
  channelIds: string[],
): Promise<NativeMessageAssociation[]> => {
  const result = (await client.query({
    messageChannelMessageAssociations: {
      __args: {
        filter: {
          messageChannelId: {
            in: channelIds,
          },
        },
        first: 500,
        orderBy: [{ createdAt: 'DescNullsLast' }],
      },
      edges: {
        node: {
          id: true,
          messageChannelId: true,
          messageExternalId: true,
          messageThreadExternalId: true,
          direction: true,
          createdAt: true,
          message: {
            id: true,
            headerMessageId: true,
            subject: true,
            text: true,
            receivedAt: true,
            createdAt: true,
            isDraft: true,
            messageThread: {
              id: true,
              subject: true,
            },
            messageParticipants: {
              edges: {
                node: {
                  id: true,
                  role: true,
                  handle: true,
                  displayName: true,
                  person: {
                    id: true,
                    name: {
                      firstName: true,
                      lastName: true,
                    },
                    company: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  } as never)) as unknown as {
    messageChannelMessageAssociations?: {
      edges?: Array<{
        node: NativeMessageAssociation;
      }>;
    };
  };

  return (
    result.messageChannelMessageAssociations?.edges
      ?.map(({ node }) => node)
      .filter(({ message }) => message?.id && message.isDraft !== true) ?? []
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
  client: CoreApiClient,
  providerThreadKeys: string[],
): Promise<ExistingConversation[]> => {
  if (providerThreadKeys.length === 0) {
    return [];
  }

  const result = (await client.query({
    inboxConversations: {
      __args: {
        filter: {
          providerThreadKey: {
            in: providerThreadKeys,
          },
        },
        first: 500,
      },
      edges: {
        node: {
          id: true,
          name: true,
          providerThreadKey: true,
          status: true,
          contactHandle: true,
          unreadCount: true,
          lastMessageAt: true,
          metadata: true,
          person: { id: true },
          company: { id: true },
          opportunity: { id: true },
        },
      },
    },
  } as never)) as unknown as {
    inboxConversations?: {
      edges?: Array<{ node: ExistingConversation }>;
    };
  };

  return result.inboxConversations?.edges?.map(({ node }) => node) ?? [];
};

const loadExistingMessages = async (
  client: CoreApiClient,
  providerMessageKeys: string[],
): Promise<ExistingInboxMessage[]> => {
  if (providerMessageKeys.length === 0) {
    return [];
  }

  const result = (await client.query({
    inboxMessages: {
      __args: {
        filter: {
          providerMessageKey: {
            in: providerMessageKeys,
          },
        },
        first: 500,
      },
      edges: {
        node: {
          id: true,
          providerMessageKey: true,
        },
      },
    },
  } as never)) as unknown as {
    inboxMessages?: {
      edges?: Array<{ node: ExistingInboxMessage }>;
    };
  };

  return result.inboxMessages?.edges?.map(({ node }) => node) ?? [];
};

const loadOpportunitiesByPerson = async (
  client: CoreApiClient,
  personIds: string[],
): Promise<Map<string, NativeOpportunity>> => {
  if (personIds.length === 0) {
    return new Map();
  }

  const result = (await client.query({
    opportunities: {
      __args: {
        filter: {
          pointOfContactId: {
            in: personIds,
          },
        },
        first: 500,
        orderBy: [{ updatedAt: 'DescNullsLast' }],
      },
      edges: {
        node: {
          id: true,
          name: true,
          pointOfContact: {
            id: true,
          },
        },
      },
    },
  } as never)) as unknown as {
    opportunities?: {
      edges?: Array<{ node: NativeOpportunity }>;
    };
  };
  const opportunityByPersonId = new Map<string, NativeOpportunity>();

  for (const opportunity of result.opportunities?.edges?.map(
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
}): TwentyEmailConversationMetadata & Record<string, unknown> => ({
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
  coreClient = new CoreApiClient(),
  metadataClient = new MetadataApiClient(),
  routing,
}: SyncTwentyEmailInput = {}): Promise<TwentyEmailSyncResult> => {
  const channels = await loadEligibleTwentyEmailChannels(metadataClient);

  if (channels.length === 0) {
    return {
      eligibleChannels: 0,
      importedThreads: 0,
      createdConversations: 0,
      updatedConversations: 0,
      createdMessages: 0,
    };
  }

  const associations = await loadNativeAssociations(
    coreClient,
    channels.map(({ id }) => id),
  );
  const groups = groupAssociations(associations, channels);
  const providerThreadKeys = groups.map(
    ({ providerThreadKey }) => providerThreadKey,
  );
  const providerMessageKeys = associations.map(buildProviderMessageKey);
  const [existingConversations, existingMessages] = await Promise.all([
    loadExistingConversations(coreClient, providerThreadKeys),
    loadExistingMessages(coreClient, providerMessageKeys),
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
  const opportunityByPersonId = await loadOpportunitiesByPerson(coreClient, [
    ...new Set(representativeContacts.map(({ person }) => person!.id)),
  ]);
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
      const createResult = (await coreClient.mutation({
        createInboxConversation: {
          __args: {
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
          id: true,
        },
      } as never)) as unknown as {
        createInboxConversation?: { id?: string | null } | null;
      };

      conversationId = createResult.createInboxConversation?.id ?? undefined;

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
      await coreClient.mutation({
        updateInboxConversation: {
          __args: {
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
                      Math.max(0, existing?.unreadCount ?? 0) +
                      newIncomingCount,
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
          id: true,
        },
      } as never);
      updatedConversations += 1;
    }

    for (const association of missingMessages) {
      const providerMessageKey = buildProviderMessageKey(association);
      const sender = getSenderParticipant(association);

      await coreClient.mutation({
        createInboxMessage: {
          __args: {
            data: {
              name: getSubject(association).slice(0, 255),
              providerMessageKey,
              direction: isIncoming(association) ? 'INBOUND' : 'OUTBOUND',
              type: 'TEXT',
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
          id: true,
        },
      } as never);

      existingMessageKeys.add(providerMessageKey);
      createdMessages += 1;
    }
  }

  return {
    eligibleChannels: channels.length,
    importedThreads: groups.length,
    createdConversations,
    updatedConversations,
    createdMessages,
  };
};
