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
  normalizeEvolutionInstanceName,
  readBooleanEnvironmentValue,
  readResponseSlaMinutes,
} from 'src/modules/inbox/utils/evolution-environment';
import { executeInboxAutomations } from 'src/modules/inbox/utils/inbox-automation';
import { resolveWhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';

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

type DefaultInboxTeam = {
  id: string;
  routingStrategy: string;
  defaultResponseSlaMinutes: number | null;
  memberships: Array<{
    id: string;
    role: string;
    workspaceMemberId: string;
  }>;
};

type InboxTeamAssignment = {
  teamId: string;
  assigneeId: string | null;
  responseSlaMinutes: number;
};

type ProcessEvolutionWebhookResult = {
  received: number;
  createdMessages: number;
  duplicateMessages: number;
  updatedStatuses: number;
  automationsApplied: number;
  automationWarnings: string[];
  ignored: number;
};

type IngestMessageResult = {
  status: 'CREATED' | 'DUPLICATE';
  automationsApplied: number;
  automationWarnings: string[];
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

// WhatsApp hands over one string of international digits. The CRM phone field
// stores the calling code apart from the national number, and a number saved
// without that split is unusable for dialing, filtering and dedup.
const CALLING_CODES: Array<{ callingCode: string; countryCode: string }> = [
  { callingCode: '598', countryCode: 'UY' },
  { callingCode: '595', countryCode: 'PY' },
  { callingCode: '591', countryCode: 'BO' },
  { callingCode: '351', countryCode: 'PT' },
  { callingCode: '55', countryCode: 'BR' },
  { callingCode: '54', countryCode: 'AR' },
  { callingCode: '56', countryCode: 'CL' },
  { callingCode: '57', countryCode: 'CO' },
  { callingCode: '52', countryCode: 'MX' },
  { callingCode: '51', countryCode: 'PE' },
  { callingCode: '49', countryCode: 'DE' },
  { callingCode: '44', countryCode: 'GB' },
  { callingCode: '39', countryCode: 'IT' },
  { callingCode: '34', countryCode: 'ES' },
  { callingCode: '33', countryCode: 'FR' },
  { callingCode: '1', countryCode: 'US' },
];

const buildPhonesValue = (normalizedPhone: string) => {
  const match = CALLING_CODES.find(
    ({ callingCode }) =>
      normalizedPhone.startsWith(callingCode) &&
      normalizedPhone.length - callingCode.length >= 8,
  );

  if (!match) {
    return {
      primaryPhoneNumber: normalizedPhone,
      primaryPhoneCountryCode: '',
      primaryPhoneCallingCode: '',
      additionalPhones: null,
    };
  }

  return {
    primaryPhoneNumber: normalizedPhone.slice(match.callingCode.length),
    primaryPhoneCountryCode: match.countryCode,
    primaryPhoneCallingCode: `+${match.callingCode}`,
    additionalPhones: null,
  };
};

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
  // A stored number may or may not carry the calling code, so a national
  // number is accepted as long as it is the tail of the WhatsApp one. An
  // ambiguous suffix leaves more than one candidate and links nobody.
  const fallbackPeople = getEdges(fallbackResult.people).filter((person) => {
    const storedPhone = normalizePhone(
      person.phones?.primaryPhoneNumber ?? undefined,
    );

    return (
      storedPhone !== null &&
      (storedPhone === normalizedPhone || normalizedPhone.endsWith(storedPhone))
    );
  });

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

  if (!readBooleanEnvironmentValue('AUTO_CREATE_WHATSAPP_CONTACTS', true)) {
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

const resolveDefaultInboxTeam = async (
  client: CoreApiClient,
): Promise<DefaultInboxTeam | null> => {
  const result = (await client.query({
    inboxTeams: {
      __args: {
        filter: {
          status: { eq: 'ACTIVE' },
          isDefault: { eq: true },
        },
        first: 1,
        orderBy: [{ name: 'AscNullsLast' }],
      },
      edges: {
        node: {
          id: true,
          routingStrategy: true,
          defaultResponseSlaMinutes: true,
          memberships: {
            edges: {
              node: {
                id: true,
                memberRole: true,
                isActive: true,
                workspaceMemberId: true,
              },
            },
          },
        },
      },
    },
  } as never)) as unknown as {
    inboxTeams?: {
      edges?: Array<{
        node?: {
          id?: string | null;
          routingStrategy?: string | null;
          defaultResponseSlaMinutes?: number | null;
          memberships?: {
            edges?: Array<{
              node?: {
                id?: string | null;
                role?: string | null;
                isActive?: boolean | null;
                workspaceMemberId?: string | null;
              } | null;
            }>;
          } | null;
        } | null;
      }>;
    };
  };
  const team = getEdges(result.inboxTeams)[0];

  if (!team?.id) {
    return null;
  }

  return {
    id: team.id,
    routingStrategy: team.routingStrategy ?? 'MANUAL',
    defaultResponseSlaMinutes: team.defaultResponseSlaMinutes ?? null,
    memberships: getEdges(team.memberships)
      .filter(
        (
          membership,
        ): membership is {
          id: string;
          role: string;
          isActive: true;
          workspaceMemberId: string;
        } =>
          membership.isActive === true &&
          typeof membership.id === 'string' &&
          typeof membership.workspaceMemberId === 'string',
      )
      .map((membership) => ({
        id: membership.id,
        role: membership.role ?? 'MEMBER',
        workspaceMemberId: membership.workspaceMemberId,
      })),
  };
};

const resolveInboxTeamAssignment = async (
  client: CoreApiClient,
): Promise<InboxTeamAssignment | null> => {
  const team = await resolveDefaultInboxTeam(client);

  if (!team) {
    return null;
  }

  const responseSlaMinutes =
    typeof team.defaultResponseSlaMinutes === 'number' &&
    team.defaultResponseSlaMinutes > 0
      ? team.defaultResponseSlaMinutes
      : readResponseSlaMinutes();

  if (team.routingStrategy !== 'BALANCED' || team.memberships.length === 0) {
    return {
      teamId: team.id,
      assigneeId: null,
      responseSlaMinutes,
    };
  }

  const conversationsResult = (await client.query({
    inboxConversations: {
      __args: {
        filter: {
          inboxTeamId: { eq: team.id },
        },
        first: 500,
      },
      edges: {
        node: {
          id: true,
          status: true,
          assigneeId: true,
        },
      },
    },
  } as never)) as unknown as {
    inboxConversations?: {
      edges?: Array<{
        node?: {
          id?: string | null;
          status?: string | null;
          assigneeId?: string | null;
        } | null;
      }>;
    };
  };
  const loadByMemberId = new Map(
    team.memberships.map(({ workspaceMemberId }) => [workspaceMemberId, 0]),
  );

  for (const conversation of getEdges(conversationsResult.inboxConversations)) {
    if (
      conversation.status === InboxConversationStatus.RESOLVED ||
      !conversation.assigneeId ||
      !loadByMemberId.has(conversation.assigneeId)
    ) {
      continue;
    }

    loadByMemberId.set(
      conversation.assigneeId,
      (loadByMemberId.get(conversation.assigneeId) ?? 0) + 1,
    );
  }

  const selectedMembership = [...team.memberships].sort((left, right) => {
    const loadDifference =
      (loadByMemberId.get(left.workspaceMemberId) ?? 0) -
      (loadByMemberId.get(right.workspaceMemberId) ?? 0);

    if (loadDifference !== 0) {
      return loadDifference;
    }

    if (left.role !== right.role) {
      return left.role === 'LEAD' ? -1 : 1;
    }

    return left.id.localeCompare(right.id);
  })[0];

  return {
    teamId: team.id,
    assigneeId: selectedMembership?.workspaceMemberId ?? null,
    responseSlaMinutes,
  };
};

const createInboxConversation = async (
  client: CoreApiClient,
  message: NormalizedEvolutionMessage,
): Promise<InboxConversationRecord> => {
  const person = await resolvePerson(client, message);
  const opportunityId = await resolveUniqueOpportunityId(client, person);
  const teamAssignment = await resolveInboxTeamAssignment(client);
  const firstResponseDueAt =
    message.direction === 'INBOUND'
      ? new Date(
          new Date(message.sentAt).getTime() +
            (teamAssignment?.responseSlaMinutes ?? readResponseSlaMinutes()) *
              60_000,
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
            inboxTeamId: teamAssignment?.teamId,
            assigneeId: teamAssignment?.assigneeId ?? undefined,
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
): Promise<{
  conversation: InboxConversationRecord;
  created: boolean;
}> => {
  const existingConversation = await findInboxConversation(
    client,
    message.providerThreadKey,
  );

  if (existingConversation) {
    return {
      conversation: existingConversation,
      created: false,
    };
  }

  try {
    return {
      conversation: await createInboxConversation(client, message),
      created: true,
    };
  } catch (error) {
    const conversationCreatedByAnotherDelivery = await findInboxConversation(
      client,
      message.providerThreadKey,
    );

    if (conversationCreatedByAnotherDelivery) {
      return {
        conversation: conversationCreatedByAnotherDelivery,
        created: false,
      };
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
            messageType: message.type,
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
): Promise<IngestMessageResult> => {
  if (await inboxMessageExists(client, message.providerMessageKey)) {
    return {
      status: 'DUPLICATE',
      automationsApplied: 0,
      automationWarnings: [],
    };
  }

  const { conversation, created: conversationCreated } =
    await resolveConversation(client, message);
  const wasCreated = await createInboxMessage(client, conversation, message);

  if (!wasCreated) {
    return {
      status: 'DUPLICATE',
      automationsApplied: 0,
      automationWarnings: [],
    };
  }

  await updateConversationAfterMessage(client, conversation, message);

  if (message.direction !== 'INBOUND') {
    return {
      status: 'CREATED',
      automationsApplied: 0,
      automationWarnings: [],
    };
  }

  try {
    const automationResult = await executeInboxAutomations({
      client,
      conversationId: conversation.id,
      trigger: conversationCreated
        ? 'CONVERSATION_CREATED'
        : 'INBOUND_MESSAGE_CREATED',
      triggerKey: message.providerMessageKey,
      messageBody: message.body,
    });

    return {
      status: 'CREATED',
      automationsApplied: automationResult.applied,
      automationWarnings: automationResult.warnings,
    };
  } catch (error) {
    return {
      status: 'CREATED',
      automationsApplied: 0,
      automationWarnings: [
        error instanceof Error
          ? error.message
          : 'Inbox automation could not be evaluated.',
      ],
    };
  }
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
  const configuration = resolveWhatsappProvisioning();
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
  let automationsApplied = 0;
  const automationWarnings: string[] = [];

  for (const message of messages) {
    const result = await ingestMessage(client, message);

    if (result.status === 'CREATED') {
      createdMessages += 1;
    } else {
      duplicateMessages += 1;
    }

    automationsApplied += result.automationsApplied;
    automationWarnings.push(...result.automationWarnings);
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
    automationsApplied,
    automationWarnings,
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
  timeoutSeconds: 60,
  handler: processEvolutionWebhookHandler,
});
