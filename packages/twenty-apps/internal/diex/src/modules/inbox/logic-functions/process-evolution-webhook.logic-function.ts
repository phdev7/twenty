import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { WhatsAppConsentStatus } from 'src/fields/person-whatsapp-consent-status.field';
import { PROCESS_EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/evolution.constants';
import {
  InboxConversationChannel,
  InboxConversationPriority,
  InboxConversationProvider,
  InboxConversationStatus,
} from 'src/modules/inbox/objects/inbox-conversation.object';
import {
  buildMessagePreview,
  extractEvolutionInstanceName,
  normalizeEvolutionMessages,
  normalizeEvolutionStatuses,
  normalizePhone,
  type NormalizedEvolutionMessage,
  type NormalizedEvolutionStatus,
} from 'src/modules/inbox/utils/evolution-payload';
import {
  getEvolutionConfiguration,
  normalizeEvolutionInstanceName,
  readBooleanEnvironmentValue,
  readResponseSlaMinutes,
} from 'src/modules/inbox/utils/evolution-environment';

type PersonMatch = {
  id: string;
  companyId: string | null;
};

type InboxConversationRecord = {
  id: string;
  unreadCount: number | null;
  firstRespondedAt: string | null;
  personId: string | null;
  companyId: string | null;
  opportunityId: string | null;
};

type ProcessEvolutionWebhookResult = {
  received: number;
  createdMessages: number;
  duplicateMessages: number;
  updatedStatuses: number;
  ignored: number;
};

const getEdges = <TNode>(
  connection:
    | {
        edges?: Array<{ node?: TNode | null } | null> | null;
      }
    | null
    | undefined,
): TNode[] =>
  connection?.edges
    ?.map((edge) => edge?.node)
    .filter((node): node is TNode => node !== null && node !== undefined) ?? [];

const splitDisplayName = (
  displayName: string | null,
): { firstName: string; lastName: string } => {
  const normalizedName = displayName?.trim() || 'Contato WhatsApp';
  const [firstName, ...lastNameParts] = normalizedName.split(/\s+/);

  return {
    firstName: firstName || 'Contato',
    lastName: lastNameParts.join(' '),
  };
};

const buildPhonesValue = (normalizedPhone: string) => ({
  primaryPhoneNumber: `+${normalizedPhone}`,
  primaryPhoneCountryCode: '',
  primaryPhoneCallingCode: '',
  additionalPhones: null,
});

const readPersonMatch = (
  person:
    | {
        id?: string | null;
        company?: { id?: string | null } | null;
      }
    | null
    | undefined,
): PersonMatch | null =>
  person?.id
    ? {
        id: person.id,
        companyId: person.company?.id ?? null,
      }
    : null;

const findPersonByNormalizedPhone = async (
  client: CoreApiClient,
  normalizedPhone: string,
): Promise<PersonMatch | null> => {
  const exactResult = (await client.query({
    people: {
      __args: {
        filter: {
          whatsappNormalizedPhone: { eq: normalizedPhone },
        },
        first: 2,
      },
      edges: {
        node: {
          id: true,
          company: { id: true },
        },
      },
    },
  })) as {
    people?: {
      edges?: Array<{
        node?: {
          id?: string | null;
          company?: { id?: string | null } | null;
        } | null;
      }>;
    };
  };
  const exactPeople = getEdges(exactResult.people);

  if (exactPeople.length === 1) {
    return readPersonMatch(exactPeople[0]);
  }

  const suffix = normalizedPhone.slice(-8);
  const fallbackResult = (await client.query({
    people: {
      __args: {
        filter: {
          phones: {
            primaryPhoneNumber: { like: `%${suffix}%` },
          },
        },
        first: 50,
      },
      edges: {
        node: {
          id: true,
          phones: { primaryPhoneNumber: true },
          company: { id: true },
        },
      },
    },
  })) as {
    people?: {
      edges?: Array<{
        node?: {
          id?: string | null;
          phones?: { primaryPhoneNumber?: string | null } | null;
          company?: { id?: string | null } | null;
        } | null;
      }>;
    };
  };
  const fallbackPeople = getEdges(fallbackResult.people).filter(
    (person) =>
      normalizePhone(person.phones?.primaryPhoneNumber ?? undefined) ===
      normalizedPhone,
  );

  if (fallbackPeople.length !== 1) {
    return null;
  }

  const match = readPersonMatch(fallbackPeople[0]);

  if (match) {
    try {
      await client.mutation({
        updatePerson: {
          __args: {
            id: match.id,
            data: {
              whatsappNormalizedPhone: normalizedPhone,
            },
          },
          id: true,
        },
      });
    } catch {
      // A uniqueness conflict means another record already owns this number.
      // The inbox keeps the conversation unlinked instead of guessing.
      return null;
    }
  }

  return match;
};

const createPersonFromInboundMessage = async (
  client: CoreApiClient,
  message: NormalizedEvolutionMessage,
): Promise<PersonMatch | null> => {
  if (!message.normalizedPhone || message.direction !== 'INBOUND') {
    return null;
  }

  const { createPerson } = await client.mutation({
    createPerson: {
      __args: {
        data: {
          name: splitDisplayName(message.senderDisplayName),
          phones: buildPhonesValue(message.normalizedPhone),
          whatsappNormalizedPhone: message.normalizedPhone,
          whatsappConsentStatus: WhatsAppConsentStatus.UNKNOWN,
          doNotContact: false,
        },
      },
      id: true,
      company: { id: true },
    },
  });

  return readPersonMatch(createPerson);
};

const resolvePerson = async (
  client: CoreApiClient,
  message: NormalizedEvolutionMessage,
): Promise<PersonMatch | null> => {
  if (!message.normalizedPhone) {
    return null;
  }

  const existingPerson = await findPersonByNormalizedPhone(
    client,
    message.normalizedPhone,
  );

  if (existingPerson) {
    return existingPerson;
  }

  if (!readBooleanEnvironmentValue('AUTO_CREATE_WHATSAPP_CONTACTS', false)) {
    return null;
  }

  try {
    return await createPersonFromInboundMessage(client, message);
  } catch {
    return findPersonByNormalizedPhone(client, message.normalizedPhone);
  }
};

const resolveUniqueOpportunityId = async (
  client: CoreApiClient,
  person: PersonMatch | null,
): Promise<string | null> => {
  if (!person) {
    return null;
  }

  const filters: Array<Record<string, unknown>> = [
    { pointOfContactId: { eq: person.id } },
  ];

  if (person.companyId) {
    filters.push({ companyId: { eq: person.companyId } });
  }

  const result = (await client.query({
    opportunities: {
      __args: {
        filter: { or: filters },
        first: 3,
      },
      edges: {
        node: { id: true },
      },
    },
  })) as {
    opportunities?: {
      edges?: Array<{ node?: { id?: string | null } | null }>;
    };
  };
  const opportunityIds = [
    ...new Set(
      getEdges(result.opportunities)
        .map((opportunity) => opportunity.id)
        .filter((id): id is string => typeof id === 'string'),
    ),
  ];

  return opportunityIds.length === 1 ? opportunityIds[0] : null;
};

const findInboxConversation = async (
  client: CoreApiClient,
  providerThreadKey: string,
): Promise<InboxConversationRecord | null> => {
  const result = (await client.query({
    inboxConversations: {
      __args: {
        filter: { providerThreadKey: { eq: providerThreadKey } },
        first: 1,
      },
      edges: {
        node: {
          id: true,
          unreadCount: true,
          firstRespondedAt: true,
          personId: true,
          companyId: true,
          opportunityId: true,
        },
      },
    },
  })) as {
    inboxConversations?: {
      edges?: Array<{
        node?: InboxConversationRecord | null;
      }>;
    };
  };

  return getEdges(result.inboxConversations)[0] ?? null;
};

const createInboxConversation = async (
  client: CoreApiClient,
  message: NormalizedEvolutionMessage,
): Promise<InboxConversationRecord> => {
  const person = await resolvePerson(client, message);
  const opportunityId = await resolveUniqueOpportunityId(client, person);
  const firstResponseDueAt =
    message.direction === 'INBOUND'
      ? new Date(
          new Date(message.sentAt).getTime() +
            readResponseSlaMinutes() * 60_000,
        ).toISOString()
      : undefined;
  const name =
    message.senderDisplayName?.trim() ||
    (message.normalizedPhone
      ? `WhatsApp +${message.normalizedPhone}`
      : message.remoteJid);

  const { createInboxConversation: createdConversation } =
    await client.mutation({
      createInboxConversation: {
        __args: {
          data: {
            name,
            providerThreadKey: message.providerThreadKey,
            channel: InboxConversationChannel.WHATSAPP,
            provider: InboxConversationProvider.EVOLUTION,
            status: InboxConversationStatus.OPEN,
            priority: InboxConversationPriority.NORMAL,
            contactHandle: message.contactHandle,
            unreadCount: 0,
            lastMessagePreview: buildMessagePreview(message),
            lastMessageDirection: message.direction,
            lastMessageAt: message.sentAt,
            firstResponseDueAt,
            firstRespondedAt:
              message.direction === 'OUTBOUND' ? message.sentAt : undefined,
            personId: person?.id,
            companyId: person?.companyId ?? undefined,
            opportunityId: opportunityId ?? undefined,
            metadata: {
              provider: 'evolution',
              instanceName: message.instanceName,
              remoteJid: message.remoteJid,
            },
          },
        },
        id: true,
        unreadCount: true,
        firstRespondedAt: true,
        personId: true,
        companyId: true,
        opportunityId: true,
      },
    });

  if (!createdConversation?.id) {
    throw new Error(
      'Evolution message could not create an inbox conversation.',
    );
  }

  return {
    id: createdConversation.id,
    unreadCount: createdConversation.unreadCount ?? 0,
    firstRespondedAt: createdConversation.firstRespondedAt ?? null,
    personId: createdConversation.personId ?? null,
    companyId: createdConversation.companyId ?? null,
    opportunityId: createdConversation.opportunityId ?? null,
  };
};

const resolveConversation = async (
  client: CoreApiClient,
  message: NormalizedEvolutionMessage,
): Promise<InboxConversationRecord> => {
  const existingConversation = await findInboxConversation(
    client,
    message.providerThreadKey,
  );

  if (existingConversation) {
    return existingConversation;
  }

  try {
    return await createInboxConversation(client, message);
  } catch (error) {
    const conversationCreatedByAnotherDelivery = await findInboxConversation(
      client,
      message.providerThreadKey,
    );

    if (conversationCreatedByAnotherDelivery) {
      return conversationCreatedByAnotherDelivery;
    }

    throw error;
  }
};

const inboxMessageExists = async (
  client: CoreApiClient,
  providerMessageKey: string,
): Promise<boolean> => {
  const result = (await client.query({
    inboxMessages: {
      __args: {
        filter: { providerMessageKey: { eq: providerMessageKey } },
        first: 1,
      },
      edges: {
        node: { id: true },
      },
    },
  })) as {
    inboxMessages?: {
      edges?: Array<{ node?: { id?: string | null } | null }>;
    };
  };

  return getEdges(result.inboxMessages).some(
    (message) => typeof message.id === 'string',
  );
};

const createInboxMessage = async (
  client: CoreApiClient,
  conversation: InboxConversationRecord,
  message: NormalizedEvolutionMessage,
): Promise<boolean> => {
  if (await inboxMessageExists(client, message.providerMessageKey)) {
    return false;
  }

  try {
    await client.mutation({
      createInboxMessage: {
        __args: {
          data: {
            name: buildMessagePreview(message),
            providerMessageKey: message.providerMessageKey,
            direction: message.direction,
            type: message.type,
            body: message.body ?? undefined,
            deliveryStatus: message.deliveryStatus,
            sentAt: message.sentAt,
            senderHandle: message.contactHandle,
            senderDisplayName: message.senderDisplayName ?? undefined,
            isInternalNote: false,
            inboxConversationId: conversation.id,
            providerPayloadFingerprint: message.payloadFingerprint,
            metadata: {
              provider: 'evolution',
              eventName: message.eventName,
              instanceName: message.instanceName,
              remoteJid: message.remoteJid,
            },
          },
        },
        id: true,
      },
    });

    return true;
  } catch (error) {
    if (await inboxMessageExists(client, message.providerMessageKey)) {
      return false;
    }

    throw error;
  }
};

const updateConversationAfterMessage = async (
  client: CoreApiClient,
  conversation: InboxConversationRecord,
  message: NormalizedEvolutionMessage,
): Promise<void> => {
  const isInbound = message.direction === 'INBOUND';
  const isFirstOutboundReply =
    message.direction === 'OUTBOUND' && !conversation.firstRespondedAt;

  await client.mutation({
    updateInboxConversation: {
      __args: {
        id: conversation.id,
        data: {
          status: isInbound ? InboxConversationStatus.OPEN : undefined,
          snoozedUntil: isInbound ? null : undefined,
          unreadCount: isInbound
            ? Math.max(0, conversation.unreadCount ?? 0) + 1
            : (conversation.unreadCount ?? 0),
          lastMessagePreview: buildMessagePreview(message),
          lastMessageDirection: message.direction,
          lastMessageAt: message.sentAt,
          firstRespondedAt: isFirstOutboundReply ? message.sentAt : undefined,
          personId: conversation.personId ?? undefined,
          companyId: conversation.companyId ?? undefined,
          opportunityId: conversation.opportunityId ?? undefined,
        },
      },
      id: true,
    },
  });
};

const ingestMessage = async (
  client: CoreApiClient,
  message: NormalizedEvolutionMessage,
): Promise<'CREATED' | 'DUPLICATE'> => {
  if (await inboxMessageExists(client, message.providerMessageKey)) {
    return 'DUPLICATE';
  }

  const conversation = await resolveConversation(client, message);
  const wasCreated = await createInboxMessage(client, conversation, message);

  if (!wasCreated) {
    return 'DUPLICATE';
  }

  await updateConversationAfterMessage(client, conversation, message);

  return 'CREATED';
};

const updateDeliveryStatus = async (
  client: CoreApiClient,
  status: NormalizedEvolutionStatus,
): Promise<boolean> => {
  const result = (await client.query({
    inboxMessages: {
      __args: {
        filter: { providerMessageKey: { eq: status.providerMessageKey } },
        first: 1,
      },
      edges: {
        node: { id: true },
      },
    },
  })) as {
    inboxMessages?: {
      edges?: Array<{ node?: { id?: string | null } | null }>;
    };
  };
  const messageId = getEdges(result.inboxMessages)[0]?.id;

  if (!messageId) {
    return false;
  }

  await client.mutation({
    updateInboxMessage: {
      __args: {
        id: messageId,
        data: { deliveryStatus: status.deliveryStatus },
      },
      id: true,
    },
  });

  return true;
};

export const processEvolutionWebhookHandler = async (
  payload: Record<string, unknown>,
): Promise<ProcessEvolutionWebhookResult> => {
  const configuration = getEvolutionConfiguration();
  const payloadInstanceName = extractEvolutionInstanceName(payload);

  if (
    !payloadInstanceName ||
    normalizeEvolutionInstanceName(payloadInstanceName) !==
      normalizeEvolutionInstanceName(configuration.instanceName)
  ) {
    throw new Error(
      'Evolution payload does not match this workspace instance.',
    );
  }

  const client = new CoreApiClient();
  const messages = normalizeEvolutionMessages(payload);
  const statuses = normalizeEvolutionStatuses(payload);
  let createdMessages = 0;
  let duplicateMessages = 0;
  let updatedStatuses = 0;

  for (const message of messages) {
    const result = await ingestMessage(client, message);

    if (result === 'CREATED') {
      createdMessages += 1;
    } else {
      duplicateMessages += 1;
    }
  }

  for (const status of statuses) {
    if (await updateDeliveryStatus(client, status)) {
      updatedStatuses += 1;
    }
  }

  return {
    received: messages.length + statuses.length,
    createdMessages,
    duplicateMessages,
    updatedStatuses,
    ignored:
      messages.length === 0 && statuses.length === 0
        ? 1
        : statuses.length - updatedStatuses,
  };
};

export default defineLogicFunction({
  universalIdentifier:
    PROCESS_EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'process-diex-evolution-webhook',
  description:
    'Creates idempotent inbox conversations and messages, links CRM context and updates delivery status inside the resolved workspace.',
  timeoutSeconds: 30,
  handler: processEvolutionWebhookHandler,
});
