import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { WhatsAppConsentStatus } from 'src/fields/person-whatsapp-consent-status.field';
import {
  EVOLUTION_SEND_TEXT_ROUTE,
  SEND_EVOLUTION_TEXT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/evolution.constants';
import {
  InboxConversationChannel,
  InboxConversationProvider,
  InboxConversationStatus,
  InboxMessageDirection,
} from 'src/modules/inbox/objects/inbox-conversation.object';
import {
  InboxMessageDeliveryStatus,
  InboxMessageType,
} from 'src/modules/inbox/objects/inbox-message.object';
import {
  getAuthenticatedRequestIdentity,
  getCurrentWorkspaceId,
} from 'src/modules/inbox/utils/evolution-environment';
import { normalizePhone } from 'src/modules/inbox/utils/evolution-payload';
import { safeEvolutionFetch } from 'src/modules/inbox/utils/safe-evolution-fetch';
import { resolveWhatsappProvisioning } from 'src/modules/inbox/utils/whatsapp-provisioning';

type SendTextRequest = {
  conversationId?: unknown;
  text?: unknown;
  previewOnly?: unknown;
  confirmSend?: unknown;
  confirmationToken?: unknown;
};

type ConversationForSend = {
  id: string;
  provider: string;
  channel: string;
  contactHandle: string | null;
  unreadCount: number | null;
  firstRespondedAt: string | null;
  person: {
    id: string;
    whatsappConsentStatus: string | null;
    doNotContact: boolean | null;
  } | null;
};

type SendableConversation = {
  destination: string;
  lastInboundAt: string | null;
};

// WhatsApp's customer service window. Answering someone who wrote first is a
// reply, not outreach, and asking an operator to register consent before they
// can answer a live customer would make the inbox unusable.
const SERVICE_WINDOW_MS = 24 * 60 * 60_000;

type ConfirmationPayload = {
  conversationId: string;
  textHash: string;
  requestId: string;
  workspaceId: string;
  userId: string;
  userWorkspaceId: string;
  expiresAt: string;
};

type SendTextResult =
  | {
      previewOnly: true;
      conversationId: string;
      destination: string;
      textPreview: string;
      expiresAt: string;
      confirmationToken: string;
      message: string;
    }
  | {
      previewOnly: false;
      sent: boolean;
      conversationId: string;
      inboxMessageId?: string;
      providerMessageKey?: string;
      sentAt?: string;
      message: string;
    };

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const encodeConfirmationToken = (
  payload: ConfirmationPayload,
  secret: string,
): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
};

const decodeConfirmationToken = (
  token: string,
  secret: string,
): ConfirmationPayload | null => {
  const [encodedPayload, providedSignature] = token.split('.');

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as unknown;

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('conversationId' in parsed) ||
      !('textHash' in parsed) ||
      !('requestId' in parsed) ||
      !('workspaceId' in parsed) ||
      !('userId' in parsed) ||
      !('userWorkspaceId' in parsed) ||
      !('expiresAt' in parsed) ||
      typeof parsed.conversationId !== 'string' ||
      typeof parsed.textHash !== 'string' ||
      typeof parsed.requestId !== 'string' ||
      typeof parsed.workspaceId !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.userWorkspaceId !== 'string' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null;
    }

    return {
      conversationId: parsed.conversationId,
      textHash: parsed.textHash,
      requestId: parsed.requestId,
      workspaceId: parsed.workspaceId,
      userId: parsed.userId,
      userWorkspaceId: parsed.userWorkspaceId,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
};

// Both reads answer the same question — may this text be sent — so they go out
// together instead of adding a round trip to every send and every preview.
const loadConversationForSend = async (
  client: CoreApiClient,
  conversationId: string,
): Promise<{
  conversation: ConversationForSend;
  lastInboundAt: string | null;
}> => {
  const [conversationResult, inboundResult] = await Promise.all([
    client.query({
      inboxConversation: {
        __args: { filter: { id: { eq: conversationId } } },
        id: true,
        provider: true,
        channel: true,
        contactHandle: true,
        unreadCount: true,
        firstRespondedAt: true,
        person: {
          id: true,
          whatsappConsentStatus: true,
          doNotContact: true,
        },
      },
    }) as Promise<{ inboxConversation?: ConversationForSend | null }>,
    client.query({
      inboxMessages: {
        __args: {
          filter: {
            inboxConversationId: { eq: conversationId },
            direction: { eq: InboxMessageDirection.INBOUND },
          },
          first: 1,
          orderBy: [{ sentAt: 'DescNullsLast' }],
        },
        edges: { node: { sentAt: true } },
      },
    }) as Promise<{
      inboxMessages?: {
        edges?: Array<{ node?: { sentAt?: string | null } | null }>;
      };
    }>,
  ]);

  if (!conversationResult.inboxConversation?.id) {
    throw new Error('A conversa da inbox não foi encontrada.');
  }

  return {
    conversation: conversationResult.inboxConversation,
    lastInboundAt:
      inboundResult.inboxMessages?.edges?.[0]?.node?.sentAt ?? null,
  };
};

const assertConversationCanSend = ({
  conversation,
  lastInboundAt,
}: {
  conversation: ConversationForSend;
  lastInboundAt: string | null;
}): SendableConversation => {
  if (
    conversation.provider !== InboxConversationProvider.EVOLUTION ||
    conversation.channel !== InboxConversationChannel.WHATSAPP
  ) {
    throw new Error('Esta conversa não está conectada ao WhatsApp.');
  }

  if (conversation.person?.doNotContact) {
    throw new Error(
      'Este contato está marcado como "não contatar" e não pode receber mensagens.',
    );
  }

  const lastInboundTime = lastInboundAt
    ? Date.parse(lastInboundAt)
    : Number.NaN;
  const isWithinServiceWindow =
    Number.isFinite(lastInboundTime) &&
    Date.now() - lastInboundTime <= SERVICE_WINDOW_MS;

  if (
    !isWithinServiceWindow &&
    conversation.person?.whatsappConsentStatus !==
      WhatsAppConsentStatus.OPTED_IN
  ) {
    throw new Error(
      'O contato não escreve há mais de 24 horas. Para reabrir a conversa, marque o consentimento de WhatsApp como autorizado no cadastro da pessoa.',
    );
  }

  const destination = normalizePhone(conversation.contactHandle ?? undefined);

  if (!destination) {
    throw new Error('A conversa não possui um número de WhatsApp válido.');
  }

  return { destination, lastInboundAt };
};

const findInboxMessageByProviderKey = async (
  client: CoreApiClient,
  providerMessageKey: string,
): Promise<{ id: string; deliveryStatus: string | null } | null> => {
  const result = (await client.query({
    inboxMessages: {
      __args: {
        filter: { providerMessageKey: { eq: providerMessageKey } },
        first: 1,
      },
      edges: {
        node: {
          id: true,
          deliveryStatus: true,
        },
      },
    },
  })) as {
    inboxMessages?: {
      edges?: Array<{
        node?: {
          id?: string | null;
          deliveryStatus?: string | null;
        } | null;
      }>;
    };
  };
  const message = result.inboxMessages?.edges?.[0]?.node;

  return message?.id
    ? {
        id: message.id,
        deliveryStatus: message.deliveryStatus ?? null,
      }
    : null;
};

const readExternalMessageId = (payload: unknown): string | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const candidates = [root.key, root.message, root.data];

  for (const candidate of candidates) {
    if (typeof candidate !== 'object' || candidate === null) {
      continue;
    }

    const record = candidate as Record<string, unknown>;

    if (typeof record.id === 'string' && record.id.trim()) {
      return record.id.trim();
    }

    if (typeof record.key === 'object' && record.key !== null) {
      const nestedId = (record.key as Record<string, unknown>).id;

      if (typeof nestedId === 'string' && nestedId.trim()) {
        return nestedId.trim();
      }
    }
  }

  return typeof root.id === 'string' && root.id.trim() ? root.id.trim() : null;
};

const createQueuedInboxMessage = async ({
  client,
  conversationId,
  text,
  destination,
  providerMessageKey,
  requestId,
  sentAt,
}: {
  client: CoreApiClient;
  conversationId: string;
  text: string;
  destination: string;
  providerMessageKey: string;
  requestId: string;
  sentAt: string;
}): Promise<string> => {
  const { createInboxMessage } = await client.mutation({
    createInboxMessage: {
      __args: {
        data: {
          name: text.slice(0, 250),
          providerMessageKey,
          direction: InboxMessageDirection.OUTBOUND,
          messageType: InboxMessageType.TEXT,
          body: text,
          deliveryStatus: InboxMessageDeliveryStatus.QUEUED,
          sentAt,
          senderHandle: destination,
          isInternalNote: false,
          inboxConversationId: conversationId,
          metadata: {
            provider: 'evolution',
            requestId,
            sendState: 'prepared',
          },
        },
      },
      id: true,
    },
  });

  if (!createInboxMessage?.id) {
    throw new Error('A mensagem de saída não pôde ser registrada na inbox.');
  }

  return createInboxMessage.id;
};

const updateOutboundInboxMessage = async ({
  client,
  inboxMessageId,
  providerMessageKey,
  deliveryStatus,
  requestId,
  providerStatus,
}: {
  client: CoreApiClient;
  inboxMessageId: string;
  providerMessageKey: string;
  deliveryStatus: InboxMessageDeliveryStatus;
  requestId: string;
  providerStatus: number;
}): Promise<void> => {
  await client.mutation({
    updateInboxMessage: {
      __args: {
        id: inboxMessageId,
        data: {
          providerMessageKey,
          deliveryStatus,
          metadata: {
            provider: 'evolution',
            requestId,
            providerStatus,
            sendState:
              deliveryStatus === InboxMessageDeliveryStatus.SENT
                ? 'accepted'
                : 'failed',
          },
        },
      },
      id: true,
    },
  });
};

const executeConfirmedSend = async ({
  client,
  conversation,
  destination,
  text,
  confirmation,
}: {
  client: CoreApiClient;
  conversation: ConversationForSend;
  destination: string;
  text: string;
  confirmation: ConfirmationPayload;
}): Promise<SendTextResult> => {
  const configuration = resolveWhatsappProvisioning();
  const pendingProviderKey = `${configuration.instanceName}:pending:${confirmation.requestId}`;
  const existingAttempt = await findInboxMessageByProviderKey(
    client,
    pendingProviderKey,
  );

  if (existingAttempt) {
    return {
      previewOnly: false,
      sent: existingAttempt.deliveryStatus === InboxMessageDeliveryStatus.SENT,
      conversationId: conversation.id,
      inboxMessageId: existingAttempt.id,
      providerMessageKey: pendingProviderKey,
      message:
        'Esta confirmação já foi processada. Nenhuma mensagem duplicada foi enviada.',
    };
  }

  const sentAt = new Date().toISOString();
  const inboxMessageId = await createQueuedInboxMessage({
    client,
    conversationId: conversation.id,
    text,
    destination,
    providerMessageKey: pendingProviderKey,
    requestId: confirmation.requestId,
    sentAt,
  });
  let response: Response;

  try {
    response = await safeEvolutionFetch({
      baseUrl: configuration.baseUrl,
      path: `/message/sendText/${encodeURIComponent(configuration.instanceName)}`,
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        apikey: configuration.apiKey,
      },
      body: JSON.stringify({
        number: destination,
        text,
        linkPreview: true,
      }),
    });
  } catch {
    await updateOutboundInboxMessage({
      client,
      inboxMessageId,
      providerMessageKey: pendingProviderKey,
      deliveryStatus: InboxMessageDeliveryStatus.FAILED,
      requestId: confirmation.requestId,
      providerStatus: 0,
    });

    throw new Error(
      'O WhatsApp não respondeu pela rota de infraestrutura aprovada.',
    );
  }
  const responseText = await response.text().catch(() => '');
  let responsePayload: unknown = null;

  if (responseText) {
    try {
      responsePayload = JSON.parse(responseText) as unknown;
    } catch {
      responsePayload = null;
    }
  }

  if (!response.ok) {
    await updateOutboundInboxMessage({
      client,
      inboxMessageId,
      providerMessageKey: pendingProviderKey,
      deliveryStatus: InboxMessageDeliveryStatus.FAILED,
      requestId: confirmation.requestId,
      providerStatus: response.status,
    });

    throw new Error(
      `O WhatsApp recusou a mensagem (HTTP ${response.status}). Verifique o status do canal antes de tentar de novo.`,
    );
  }

  const externalMessageId = readExternalMessageId(responsePayload);
  const providerMessageKey = externalMessageId
    ? `${configuration.instanceName}:${externalMessageId}`
    : pendingProviderKey;

  // The provider already accepted the text, so the receipt and the conversation
  // header describe the same settled fact and neither has to wait for the other.
  await Promise.all([
    updateOutboundInboxMessage({
      client,
      inboxMessageId,
      providerMessageKey,
      deliveryStatus: InboxMessageDeliveryStatus.SENT,
      requestId: confirmation.requestId,
      providerStatus: response.status,
    }),
    client.mutation({
      updateInboxConversation: {
        __args: {
          id: conversation.id,
          data: {
            status: InboxConversationStatus.OPEN,
            snoozedUntil: null,
            unreadCount: 0,
            lastMessagePreview: text.slice(0, 250),
            lastMessageDirection: InboxMessageDirection.OUTBOUND,
            lastMessageAt: sentAt,
            firstRespondedAt: conversation.firstRespondedAt ?? sentAt,
          },
        },
        id: true,
      },
    }),
  ]);

  return {
    previewOnly: false,
    sent: true,
    conversationId: conversation.id,
    inboxMessageId,
    providerMessageKey,
    sentAt,
    message: 'Mensagem aceita pelo WhatsApp e registrada na inbox.',
  };
};

export const sendEvolutionTextHandler = async (
  routePayload: RoutePayload<SendTextRequest>,
): Promise<SendTextResult> => {
  const requestIdentity = getAuthenticatedRequestIdentity(
    routePayload.userWorkspaceId,
  );

  const conversationId =
    typeof routePayload.body?.conversationId === 'string'
      ? routePayload.body.conversationId.trim()
      : '';
  const text =
    typeof routePayload.body?.text === 'string'
      ? routePayload.body.text.trim()
      : '';

  if (!conversationId || !text) {
    throw new Error('Informe a conversa e o texto da mensagem.');
  }

  if (text.length > 4_096) {
    throw new Error(
      'Mensagens de texto do WhatsApp são limitadas a 4096 caracteres.',
    );
  }

  const client = new CoreApiClient();
  const { conversation, lastInboundAt } = await loadConversationForSend(
    client,
    conversationId,
  );
  const { destination } = assertConversationCanSend({
    conversation,
    lastInboundAt,
  });
  const workspaceId = getCurrentWorkspaceId();
  const configuration = resolveWhatsappProvisioning();
  const previewOnly = routePayload.body?.previewOnly !== false;

  if (previewOnly) {
    const confirmation: ConfirmationPayload = {
      conversationId,
      textHash: sha256(text),
      requestId: randomUUID(),
      workspaceId,
      userId: requestIdentity.userId,
      userWorkspaceId: requestIdentity.userWorkspaceId,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    };

    return {
      previewOnly: true,
      conversationId,
      destination: `***${destination.slice(-4)}`,
      textPreview: text,
      expiresAt: confirmation.expiresAt,
      confirmationToken: encodeConfirmationToken(
        confirmation,
        configuration.webhookSecret,
      ),
      message: 'Revise o texto exato e confirme explicitamente antes do envio.',
    };
  }

  if (
    routePayload.body?.confirmSend !== true ||
    typeof routePayload.body.confirmationToken !== 'string'
  ) {
    throw new Error('A confirmação explícita de envio é obrigatória.');
  }

  const confirmation = decodeConfirmationToken(
    routePayload.body.confirmationToken,
    configuration.webhookSecret,
  );

  if (
    !confirmation ||
    confirmation.conversationId !== conversationId ||
    confirmation.textHash !== sha256(text) ||
    confirmation.workspaceId !== workspaceId ||
    confirmation.userId !== requestIdentity.userId ||
    confirmation.userWorkspaceId !== requestIdentity.userWorkspaceId ||
    new Date(confirmation.expiresAt).getTime() <= Date.now()
  ) {
    throw new Error('A confirmação de envio é inválida ou expirou.');
  }

  return executeConfirmedSend({
    client,
    conversation,
    destination,
    text,
    confirmation,
  });
};

export default defineLogicFunction({
  universalIdentifier: SEND_EVOLUTION_TEXT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'send-diex-evolution-text',
  description:
    'Previews and sends one consent-checked Evolution WhatsApp message after explicit confirmation, with an idempotent CRM receipt.',
  timeoutSeconds: 30,
  handler: sendEvolutionTextHandler,
  httpRouteTriggerSettings: {
    path: EVOLUTION_SEND_TEXT_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
