import { Injectable } from '@nestjs/common';

import {
  createHmac,
  randomUUID,
  timingSafeEqual,
  createHash,
} from 'node:crypto';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import {
  EVOLUTION_SEND_CONFIRMATION_TTL_MS,
  EVOLUTION_SEND_TEXT_MAX_LENGTH,
  EVOLUTION_SERVICE_WINDOW_MS,
} from 'src/modules/inbox/constants/inbox-evolution.constants';
import { EvolutionHttpService } from 'src/modules/inbox/services/evolution-http.service';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { type SendEvolutionTextResult } from 'src/modules/inbox/types/inbox-evolution.types';
import { normalizePhone } from 'src/modules/inbox/utils/evolution-payload.util';

type ConfirmationPayload = {
  conversationId: string;
  textHash: string;
  requestId: string;
  workspaceId: string;
  workspaceMemberId: string;
  expiresAt: string;
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
    ) as Partial<ConfirmationPayload>;

    if (
      typeof parsed.conversationId !== 'string' ||
      typeof parsed.textHash !== 'string' ||
      typeof parsed.requestId !== 'string' ||
      typeof parsed.workspaceId !== 'string' ||
      typeof parsed.workspaceMemberId !== 'string' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null;
    }

    return parsed as ConfirmationPayload;
  } catch {
    return null;
  }
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

@Injectable()
export class EvolutionSendTextService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly evolutionHttpService: EvolutionHttpService,
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
  ) {}

  async sendText({
    workspaceId,
    workspaceMemberId,
    conversationId,
    text,
    previewOnly,
    confirmSend,
    confirmationToken,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    conversationId: string;
    text: string;
    previewOnly: boolean;
    confirmSend?: boolean;
    confirmationToken?: string;
  }): Promise<SendEvolutionTextResult> {
    if (!conversationId || !text) {
      throw new Error('Informe a conversa e o texto da mensagem.');
    }

    if (text.length > EVOLUTION_SEND_TEXT_MAX_LENGTH) {
      throw new Error(
        `Mensagens de texto do WhatsApp são limitadas a ${EVOLUTION_SEND_TEXT_MAX_LENGTH} caracteres.`,
      );
    }

    const configuration =
      await this.evolutionProvisioningService.resolveProvisioning(workspaceId);
    const authContext = buildSystemAuthContext(workspaceId);

    const { destination } =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        () => this.assertConversationCanSend(workspaceId, conversationId),
        authContext,
      );

    if (previewOnly) {
      const confirmation: ConfirmationPayload = {
        conversationId,
        textHash: sha256(text),
        requestId: randomUUID(),
        workspaceId,
        workspaceMemberId,
        expiresAt: new Date(
          Date.now() + EVOLUTION_SEND_CONFIRMATION_TTL_MS,
        ).toISOString(),
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
        message:
          'Revise o texto exato e confirme explicitamente antes do envio.',
      };
    }

    if (confirmSend !== true || typeof confirmationToken !== 'string') {
      throw new Error('A confirmação explícita de envio é obrigatória.');
    }

    const confirmation = decodeConfirmationToken(
      confirmationToken,
      configuration.webhookSecret,
    );

    if (
      !confirmation ||
      confirmation.conversationId !== conversationId ||
      confirmation.textHash !== sha256(text) ||
      confirmation.workspaceId !== workspaceId ||
      confirmation.workspaceMemberId !== workspaceMemberId ||
      new Date(confirmation.expiresAt).getTime() <= Date.now()
    ) {
      throw new Error('A confirmação de envio é inválida ou expirou.');
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.executeConfirmedSend({
          workspaceId,
          conversationId,
          destination,
          text,
          confirmation,
          configuration,
        }),
      authContext,
    );
  }

  private async assertConversationCanSend(
    workspaceId: string,
    conversationId: string,
  ): Promise<{ destination: string; lastInboundAt: string | null }> {
    const conversationRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
        workspaceId,
        InboxConversationWorkspaceEntity,
      );
    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
      );
    const conversation = await conversationRepository.findOne({
      where: { id: conversationId },
      relations: { person: true },
    });

    if (!conversation) {
      throw new Error('A conversa da inbox não foi encontrada.');
    }

    if (
      conversation.provider !== 'EVOLUTION' ||
      conversation.channel !== 'WHATSAPP'
    ) {
      throw new Error('Esta conversa não está conectada ao WhatsApp.');
    }

    if (conversation.person?.doNotContact) {
      throw new Error(
        'Este contato está marcado como "não contatar" e não pode receber mensagens.',
      );
    }

    const lastInboundMessage = await messageRepository.findOne({
      where: { inboxConversationId: conversationId, direction: 'INBOUND' },
      order: { sentAt: 'DESC' },
      select: { sentAt: true },
    });
    const lastInboundTime = lastInboundMessage?.sentAt
      ? Date.parse(lastInboundMessage.sentAt)
      : Number.NaN;
    const isWithinServiceWindow =
      Number.isFinite(lastInboundTime) &&
      Date.now() - lastInboundTime <= EVOLUTION_SERVICE_WINDOW_MS;

    if (
      !isWithinServiceWindow &&
      conversation.person?.whatsappConsentStatus !== 'OPTED_IN'
    ) {
      throw new Error(
        'O contato não escreve há mais de 24 horas. Para reabrir a conversa, marque o consentimento de WhatsApp como autorizado no cadastro da pessoa.',
      );
    }

    const destination = normalizePhone(conversation.contactHandle ?? undefined);

    if (!destination) {
      throw new Error('A conversa não possui um número de WhatsApp válido.');
    }

    return { destination, lastInboundAt: lastInboundMessage?.sentAt ?? null };
  }

  private async findInboxMessageByProviderKey(
    workspaceId: string,
    providerMessageKey: string,
    requestId?: string,
  ): Promise<{ id: string; deliveryStatus: string | null } | null> {
    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
      );

    const query = messageRepository
      .createQueryBuilder('message')
      .where('message.providerMessageKey = :providerMessageKey', {
        providerMessageKey,
      });

    if (requestId) {
      query.orWhere('message.metadata @> :requestMetadata', {
        requestMetadata: JSON.stringify({ requestId }),
      });
    }

    return query.getOne();
  }

  private async executeConfirmedSend({
    workspaceId,
    conversationId,
    destination,
    text,
    confirmation,
    configuration,
  }: {
    workspaceId: string;
    conversationId: string;
    destination: string;
    text: string;
    confirmation: ConfirmationPayload;
    configuration: Awaited<
      ReturnType<EvolutionProvisioningService['resolveProvisioning']>
    >;
  }): Promise<SendEvolutionTextResult> {
    const pendingProviderKey = `${configuration.instanceName}:pending:${confirmation.requestId}`;
    const existingAttempt = await this.findInboxMessageByProviderKey(
      workspaceId,
      pendingProviderKey,
      confirmation.requestId,
    );

    if (existingAttempt) {
      return {
        previewOnly: false,
        sent: existingAttempt.deliveryStatus === 'SENT',
        conversationId,
        inboxMessageId: existingAttempt.id,
        providerMessageKey: pendingProviderKey,
        message:
          'Esta confirmação já foi processada. Nenhuma mensagem duplicada foi enviada.',
      };
    }

    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
      );
    const conversationRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
        workspaceId,
        InboxConversationWorkspaceEntity,
      );
    const sentAt = new Date().toISOString();
    let inserted;

    try {
      inserted = await messageRepository.insert({
        name: text.slice(0, 250),
        providerMessageKey: pendingProviderKey,
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        body: text,
        deliveryStatus: 'QUEUED',
        sentAt,
        senderHandle: destination,
        isInternalNote: false,
        inboxConversationId: conversationId,
        metadata: {
          provider: 'evolution',
          requestId: confirmation.requestId,
          sendState: 'prepared',
        },
      });
    } catch (error) {
      const concurrentAttempt = await this.findInboxMessageByProviderKey(
        workspaceId,
        pendingProviderKey,
        confirmation.requestId,
      );

      if (concurrentAttempt) {
        return {
          previewOnly: false,
          sent: concurrentAttempt.deliveryStatus === 'SENT',
          conversationId,
          inboxMessageId: concurrentAttempt.id,
          providerMessageKey: pendingProviderKey,
          message:
            'Esta confirmação já foi processada. Nenhuma mensagem duplicada foi enviada.',
        };
      }

      throw error;
    }
    const inboxMessageId = inserted.identifiers[0]?.id as string | undefined;

    if (!inboxMessageId) {
      throw new Error('A mensagem de saída não pôde ser registrada na inbox.');
    }

    let response: Response;

    try {
      response = await this.evolutionHttpService.request({
        baseUrl: configuration.baseUrl,
        path: `/message/sendText/${encodeURIComponent(configuration.instanceName)}`,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          apikey: configuration.apiKey,
        },
        body: JSON.stringify({ number: destination, text, linkPreview: true }),
      });
    } catch {
      await messageRepository.update(inboxMessageId, {
        deliveryStatus: 'FAILED',
        metadata: {
          provider: 'evolution',
          requestId: confirmation.requestId,
          providerStatus: 0,
          sendState: 'failed',
        },
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
      await messageRepository.update(inboxMessageId, {
        deliveryStatus: 'FAILED',
        metadata: {
          provider: 'evolution',
          requestId: confirmation.requestId,
          providerStatus: response.status,
          sendState: 'failed',
        },
      });

      throw new Error(
        `O WhatsApp recusou a mensagem (HTTP ${response.status}). Verifique o status do canal antes de tentar de novo.`,
      );
    }

    const externalMessageId = readExternalMessageId(responsePayload);
    const providerMessageKey = externalMessageId
      ? `${configuration.instanceName}:${externalMessageId}`
      : pendingProviderKey;

    const conversation = await conversationRepository.findOne({
      where: { id: conversationId },
      select: { firstRespondedAt: true },
    });

    // The provider already accepted the text, so the receipt and the
    // conversation header describe the same settled fact and neither has to
    // wait for the other.
    await Promise.all([
      messageRepository.update(inboxMessageId, {
        providerMessageKey,
        deliveryStatus: 'SENT',
        metadata: {
          provider: 'evolution',
          requestId: confirmation.requestId,
          providerStatus: response.status,
          sendState: 'accepted',
        },
      }),
      conversationRepository.update(conversationId, {
        status: 'OPEN',
        snoozedUntil: null,
        unreadCount: 0,
        lastMessagePreview: text.slice(0, 250),
        lastMessageDirection: 'OUTBOUND',
        lastMessageAt: sentAt,
        firstRespondedAt: conversation?.firstRespondedAt ?? sentAt,
      }),
    ]);

    return {
      previewOnly: false,
      sent: true,
      conversationId,
      inboxMessageId,
      providerMessageKey,
      sentAt,
      message: 'Mensagem aceita pelo WhatsApp e registrada na inbox.',
    };
  }
}
