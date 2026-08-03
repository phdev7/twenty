import { Injectable, Logger } from '@nestjs/common';

import { createHash } from 'node:crypto';

import { ILike } from 'typeorm';
import { FieldActorSource } from 'twenty-shared/types';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { InboxAutomationEvaluationService } from 'src/modules/inbox/services/inbox-automation-evaluation.service';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { InboxTeamWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team.workspace-entity';
import {
  type IngestMessageResult,
  type InboxMessageDirection,
  type NormalizedEvolutionMessage,
  type NormalizedEvolutionStatus,
  type ProcessEvolutionWebhookResult,
} from 'src/modules/inbox/types/inbox-evolution.types';
import {
  type InboxAutomationEvaluationMetadata,
  type InboxAutomationTriggerValue,
} from 'src/modules/inbox/types/inbox-automation.types';
import {
  buildMessagePreview,
  extractEvolutionInstanceName,
  normalizeEvolutionMessages,
  normalizeEvolutionStatuses,
  normalizePhone,
} from 'src/modules/inbox/utils/evolution-payload.util';
import {
  buildPhonesValue,
  splitDisplayName,
} from 'src/modules/inbox/utils/inbox-contact-phone.util';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

type PersonMatch = {
  id: string;
  companyId: string | null;
};

type InboxConversationRecord = {
  id: string;
  unreadCount: number | null;
  firstRespondedAt: string | null;
  lastMessageAt: string | null;
  lastMessageDirection: string | null;
  personId: string | null;
  companyId: string | null;
  opportunityId: string | null;
  metadata: Record<string, unknown> | null;
};

type ExistingInboxMessageRecord = {
  id: string;
  inboxConversationId: string | null;
  direction: InboxMessageDirection;
  sentAt: string | null;
  metadata: Record<string, unknown> | null;
};

type InboxTeamAssignment = {
  teamId: string;
  assigneeId: string | null;
  responseSlaMinutes: number;
};

type IngestionRepositories = {
  conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>;
  messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>;
  personRepository: WorkspaceRepository<PersonWorkspaceEntity>;
  opportunityRepository: WorkspaceRepository<OpportunityWorkspaceEntity>;
  teamRepository: WorkspaceRepository<InboxTeamWorkspaceEntity>;
};

@Injectable()
export class EvolutionIngestionService {
  private readonly logger = new Logger(EvolutionIngestionService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
    private readonly inboxAutomationEvaluationService: InboxAutomationEvaluationService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  private readDefaultResponseSlaMinutes(): number {
    const configured = this.twentyConfigService.get(
      'DIEX_INBOX_DEFAULT_RESPONSE_SLA_MINUTES',
    );
    const parsed = Number(configured ?? 60);

    if (!Number.isFinite(parsed)) {
      return 60;
    }

    return Math.min(10_080, Math.max(1, Math.round(parsed)));
  }

  async getRepositories(workspaceId: string): Promise<IngestionRepositories> {
    const [
      conversationRepository,
      messageRepository,
      personRepository,
      opportunityRepository,
      teamRepository,
    ] = await Promise.all([
      this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
        workspaceId,
        InboxConversationWorkspaceEntity,
      ),
      this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
      ),
      this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
        workspaceId,
        PersonWorkspaceEntity,
      ),
      this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
        workspaceId,
        OpportunityWorkspaceEntity,
      ),
      this.globalWorkspaceOrmManager.getRepository<InboxTeamWorkspaceEntity>(
        workspaceId,
        InboxTeamWorkspaceEntity,
      ),
    ]);

    return {
      conversationRepository,
      messageRepository,
      personRepository,
      opportunityRepository,
      teamRepository,
    };
  }

  async processWebhookPayload({
    workspaceId,
    payload,
  }: {
    workspaceId: string;
    payload: Record<string, unknown>;
  }): Promise<ProcessEvolutionWebhookResult> {
    const configuration =
      await this.evolutionProvisioningService.resolveProvisioning(workspaceId);

    this.evolutionProvisioningService.assertPayloadMatchesInstance({
      payloadInstanceName: extractEvolutionInstanceName(payload),
      configuration,
    });

    const messages = normalizeEvolutionMessages(payload);
    const statuses = normalizeEvolutionStatuses(payload);
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repositories = await this.getRepositories(workspaceId);
        let createdMessages = 0;
        let duplicateMessages = 0;
        let updatedStatuses = 0;
        let automationsApplied = 0;
        const automationWarnings: string[] = [];

        for (const message of messages) {
          const result = await this.ingestMessage({
            workspaceId,
            repositories,
            message,
          });

          if (result.status === 'CREATED') {
            createdMessages += 1;
          } else {
            duplicateMessages += 1;
          }

          automationsApplied += result.automationsApplied;
          automationWarnings.push(...result.automationWarnings);
        }

        for (const status of statuses) {
          if (
            await this.updateDeliveryStatus(
              repositories.messageRepository,
              status,
            )
          ) {
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
      },
      authContext,
    );
  }

  async ingestMessage({
    workspaceId,
    repositories,
    message,
  }: {
    workspaceId: string;
    repositories: IngestionRepositories;
    message: NormalizedEvolutionMessage;
  }): Promise<IngestMessageResult> {
    const existingMessage = await this.findInboxMessage(
      repositories.messageRepository,
      message.providerMessageKey,
    );

    if (existingMessage) {
      return this.repairDuplicateMessage({
        workspaceId,
        repositories,
        message,
        existingMessage,
      });
    }

    const { conversation, created: conversationCreated } =
      await this.resolveConversation({
        repositories,
        message,
      });
    const automationTrigger: InboxAutomationTriggerValue | undefined =
      message.direction === 'INBOUND'
        ? conversationCreated
          ? 'CONVERSATION_CREATED'
          : 'INBOUND_MESSAGE_CREATED'
        : undefined;
    const createdMessageId = await this.createInboxMessage({
      workspaceId,
      messageRepository: repositories.messageRepository,
      conversation,
      message,
      automationTrigger,
    });

    if (!createdMessageId) {
      const persistedMessage = await this.findInboxMessage(
        repositories.messageRepository,
        message.providerMessageKey,
      );

      return persistedMessage
        ? this.repairDuplicateMessage({
            workspaceId,
            repositories,
            message,
            existingMessage: persistedMessage,
          })
        : {
            status: 'DUPLICATE',
            automationsApplied: 0,
            automationWarnings: [],
          };
    }

    await this.updateConversationAfterMessage({
      conversationRepository: repositories.conversationRepository,
      conversation,
      message,
    });

    if (message.direction !== 'INBOUND') {
      return {
        status: 'CREATED',
        messageId: createdMessageId,
        automationsApplied: 0,
        automationWarnings: [],
      };
    }

    try {
      await this.inboxAutomationEvaluationService.enqueue({
        workspaceId,
        messageId: createdMessageId,
        trigger: automationTrigger,
      });

      return {
        status: 'CREATED',
        messageId: createdMessageId,
        automationsApplied: 0,
        automationWarnings: [],
      };
    } catch (error) {
      return {
        status: 'CREATED',
        messageId: createdMessageId,
        automationsApplied: 0,
        automationWarnings: [
          error instanceof Error
            ? error.message
            : 'A automação da Inbox não pôde ser avaliada.',
        ],
      };
    }
  }

  private async repairDuplicateMessage({
    workspaceId,
    repositories,
    message,
    existingMessage,
  }: {
    workspaceId: string;
    repositories: IngestionRepositories;
    message: NormalizedEvolutionMessage;
    existingMessage: ExistingInboxMessageRecord;
  }): Promise<IngestMessageResult> {
    const existingConversation =
      (existingMessage.inboxConversationId
        ? await this.findInboxConversationById(
            repositories.conversationRepository,
            existingMessage.inboxConversationId,
          )
        : null) ??
      (await this.findInboxConversation(
        repositories.conversationRepository,
        message.providerThreadKey,
      ));
    const persistedMessage = {
      ...message,
      direction: existingMessage.direction,
      sentAt: existingMessage.sentAt ?? message.sentAt,
    } as NormalizedEvolutionMessage;

    if (existingConversation) {
      if (existingMessage.inboxConversationId !== existingConversation.id) {
        await repositories.messageRepository.update(existingMessage.id, {
          inboxConversationId: existingConversation.id,
        });
      }

      const linkedConversation = await this.linkConversationToPerson({
        repositories,
        conversation: existingConversation,
        message: persistedMessage,
      });

      await this.updateConversationAfterMessage({
        conversationRepository: repositories.conversationRepository,
        conversation: linkedConversation,
        message: persistedMessage,
      });
    }

    if (existingMessage.direction !== 'INBOUND') {
      return {
        status: 'DUPLICATE',
        messageId: existingMessage.id,
        automationsApplied: 0,
        automationWarnings: [],
      };
    }

    try {
      await this.inboxAutomationEvaluationService.enqueue({
        workspaceId,
        messageId: existingMessage.id,
        force: true,
      });

      return {
        status: 'DUPLICATE',
        messageId: existingMessage.id,
        automationsApplied: 0,
        automationWarnings: [],
      };
    } catch (error) {
      return {
        status: 'DUPLICATE',
        messageId: existingMessage.id,
        automationsApplied: 0,
        automationWarnings: [
          error instanceof Error
            ? error.message
            : 'A automação da Inbox não pôde ser reavaliada.',
        ],
      };
    }
  }

  private async findPersonByNormalizedPhone(
    personRepository: WorkspaceRepository<PersonWorkspaceEntity>,
    normalizedPhone: string,
  ): Promise<PersonMatch | null> {
    const exactPeople = await personRepository.find({
      where: { whatsappNormalizedPhone: normalizedPhone },
      take: 2,
    });

    if (exactPeople.length === 1) {
      return {
        id: exactPeople[0].id,
        companyId: exactPeople[0].companyId,
      };
    }

    const suffix = normalizedPhone.slice(-8);
    const fallbackCandidates = await personRepository.find({
      where: {
        phones: { primaryPhoneNumber: ILike(`%${suffix}%`) },
      },
      take: 50,
    });
    // A stored number may or may not carry the calling code, so a national
    // number is accepted as long as it is the tail of the WhatsApp one. An
    // ambiguous suffix leaves more than one candidate and links nobody.
    const fallbackPeople = fallbackCandidates.filter((person) => {
      const storedPhone = normalizePhone(
        person.phones?.primaryPhoneNumber ?? undefined,
      );

      return (
        storedPhone !== null &&
        (storedPhone === normalizedPhone ||
          normalizedPhone.endsWith(storedPhone))
      );
    });

    if (fallbackPeople.length !== 1) {
      return null;
    }

    const match = {
      id: fallbackPeople[0].id,
      companyId: fallbackPeople[0].companyId,
    };

    try {
      await personRepository.update(match.id, {
        whatsappNormalizedPhone: normalizedPhone,
      });
    } catch {
      // A uniqueness conflict means another record already owns this number.
      // The inbox keeps the conversation unlinked instead of guessing.
      return null;
    }

    return match;
  }

  private async createPersonFromInboundMessage(
    personRepository: WorkspaceRepository<PersonWorkspaceEntity>,
    message: NormalizedEvolutionMessage,
  ): Promise<PersonMatch | null> {
    if (!message.normalizedPhone || message.direction !== 'INBOUND') {
      return null;
    }

    const actor = {
      source: FieldActorSource.WEBHOOK,
      workspaceMemberId: null,
      name: 'Inbox WhatsApp',
      context: {},
    };
    const inserted = await personRepository.insert({
      name: splitDisplayName(message.senderDisplayName),
      phones: buildPhonesValue(message.normalizedPhone),
      whatsappNormalizedPhone: message.normalizedPhone,
      whatsappConsentStatus: 'UNKNOWN',
      doNotContact: false,
      createdBy: actor,
      updatedBy: actor,
    });
    const personId = inserted.identifiers[0]?.id as string | undefined;

    if (!personId) {
      return null;
    }

    const person = await personRepository.findOne({ where: { id: personId } });

    return { id: personId, companyId: person?.companyId ?? null };
  }

  private async resolvePerson(
    personRepository: WorkspaceRepository<PersonWorkspaceEntity>,
    message: NormalizedEvolutionMessage,
  ): Promise<PersonMatch | null> {
    if (!message.normalizedPhone) {
      return null;
    }

    const existingPerson = await this.findPersonByNormalizedPhone(
      personRepository,
      message.normalizedPhone,
    );

    if (existingPerson) {
      return existingPerson;
    }

    // A customer who writes is a lead, and the inbox is worth nothing if their
    // conversation hangs off nobody.
    try {
      return await this.createPersonFromInboundMessage(
        personRepository,
        message,
      );
    } catch (error) {
      // Losing the contact silently is how a conversation ends up orphaned with
      // nothing to explain it. Say so, then check whether a concurrent delivery
      // already created the person.
      this.logger.error(
        `Could not create the contact for ${message.normalizedPhone}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return this.findPersonByNormalizedPhone(
        personRepository,
        message.normalizedPhone,
      );
    }
  }

  private async resolveUniqueOpportunityId(
    opportunityRepository: WorkspaceRepository<OpportunityWorkspaceEntity>,
    person: PersonMatch | null,
  ): Promise<string | null> {
    if (!person) {
      return null;
    }

    const opportunities = await opportunityRepository.find({
      where: person.companyId
        ? [{ pointOfContactId: person.id }, { companyId: person.companyId }]
        : [{ pointOfContactId: person.id }],
      take: 3,
    });
    const opportunityIds = [
      ...new Set(opportunities.map((opportunity) => opportunity.id)),
    ];

    return opportunityIds.length === 1 ? opportunityIds[0] : null;
  }

  private async findInboxConversation(
    conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>,
    providerThreadKey: string,
  ): Promise<InboxConversationRecord | null> {
    const conversation = await conversationRepository.findOne({
      where: { providerThreadKey },
    });

    return conversation
      ? {
          id: conversation.id,
          unreadCount: conversation.unreadCount,
          firstRespondedAt: conversation.firstRespondedAt,
          lastMessageAt: conversation.lastMessageAt,
          lastMessageDirection: conversation.lastMessageDirection,
          personId: conversation.personId,
          companyId: conversation.companyId,
          opportunityId: conversation.opportunityId,
          metadata: conversation.metadata,
        }
      : null;
  }

  private async findInboxConversationById(
    conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>,
    conversationId: string,
  ): Promise<InboxConversationRecord | null> {
    const conversation = await conversationRepository.findOne({
      where: { id: conversationId },
    });

    return conversation
      ? {
          id: conversation.id,
          unreadCount: conversation.unreadCount,
          firstRespondedAt: conversation.firstRespondedAt,
          lastMessageAt: conversation.lastMessageAt,
          lastMessageDirection: conversation.lastMessageDirection,
          personId: conversation.personId,
          companyId: conversation.companyId,
          opportunityId: conversation.opportunityId,
          metadata: conversation.metadata,
        }
      : null;
  }

  private async resolveInboxTeamAssignment(
    repositories: IngestionRepositories,
  ): Promise<InboxTeamAssignment | null> {
    const team = await repositories.teamRepository.findOne({
      where: { status: 'ACTIVE', isDefault: true },
      relations: { memberships: true },
      order: { name: 'ASC' },
    });

    if (!team) {
      return null;
    }

    const memberships = (team.memberships ?? [])
      .filter(
        (membership) =>
          membership.isActive === true &&
          typeof membership.workspaceMemberId === 'string',
      )
      .map((membership) => ({
        id: membership.id,
        memberRole: membership.memberRole ?? 'MEMBER',
        workspaceMemberId: membership.workspaceMemberId as string,
      }));
    const responseSlaMinutes =
      typeof team.defaultResponseSlaMinutes === 'number' &&
      team.defaultResponseSlaMinutes > 0
        ? team.defaultResponseSlaMinutes
        : this.readDefaultResponseSlaMinutes();

    if (team.routingStrategy !== 'BALANCED' || memberships.length === 0) {
      return { teamId: team.id, assigneeId: null, responseSlaMinutes };
    }

    const conversations = await repositories.conversationRepository.find({
      where: { inboxTeamId: team.id },
      select: { id: true, status: true, assigneeId: true },
      take: 500,
    });
    const loadByMemberId = new Map(
      memberships.map(({ workspaceMemberId }) => [workspaceMemberId, 0]),
    );

    for (const conversation of conversations) {
      if (
        conversation.status === 'RESOLVED' ||
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

    const selectedMembership = [...memberships].sort((left, right) => {
      const loadDifference =
        (loadByMemberId.get(left.workspaceMemberId) ?? 0) -
        (loadByMemberId.get(right.workspaceMemberId) ?? 0);

      if (loadDifference !== 0) {
        return loadDifference;
      }

      if (left.memberRole !== right.memberRole) {
        return left.memberRole === 'LEAD' ? -1 : 1;
      }

      return left.id.localeCompare(right.id);
    })[0];

    return {
      teamId: team.id,
      assigneeId: selectedMembership?.workspaceMemberId ?? null,
      responseSlaMinutes,
    };
  }

  private async createInboxConversation({
    repositories,
    message,
  }: {
    repositories: IngestionRepositories;
    message: NormalizedEvolutionMessage;
  }): Promise<InboxConversationRecord> {
    // Routing does not depend on who the contact is, so it is resolved alongside
    // the person instead of after it.
    const [person, teamAssignment] = await Promise.all([
      this.resolvePerson(repositories.personRepository, message),
      this.resolveInboxTeamAssignment(repositories),
    ]);
    const opportunityId = await this.resolveUniqueOpportunityId(
      repositories.opportunityRepository,
      person,
    );
    const firstResponseDueAt =
      message.direction === 'INBOUND'
        ? new Date(
            new Date(message.sentAt).getTime() +
              (teamAssignment?.responseSlaMinutes ??
                this.readDefaultResponseSlaMinutes()) *
                60_000,
          ).toISOString()
        : null;
    const name =
      message.senderDisplayName?.trim() ||
      (message.normalizedPhone
        ? `WhatsApp +${message.normalizedPhone}`
        : message.remoteJid);
    const inserted = await repositories.conversationRepository.insert({
      name,
      providerThreadKey: message.providerThreadKey,
      channel: 'WHATSAPP',
      provider: 'EVOLUTION',
      status: 'OPEN',
      priority: 'NORMAL',
      contactHandle: message.contactHandle,
      unreadCount: 0,
      lastMessagePreview: buildMessagePreview(message),
      lastMessageDirection: message.direction,
      lastMessageAt: message.sentAt,
      firstResponseDueAt,
      firstRespondedAt:
        message.direction === 'OUTBOUND' ? message.sentAt : null,
      personId: person?.id ?? null,
      companyId: person?.companyId ?? null,
      opportunityId,
      inboxTeamId: teamAssignment?.teamId ?? null,
      assigneeId: teamAssignment?.assigneeId ?? null,
      metadata: {
        provider: 'evolution',
        instanceName: message.instanceName,
        remoteJid: message.remoteJid,
      },
    });
    const conversationId = inserted.identifiers[0]?.id as string | undefined;

    if (!conversationId) {
      throw new Error(
        'A mensagem da Evolution não pôde criar uma conversa na inbox.',
      );
    }

    return {
      id: conversationId,
      unreadCount: 0,
      firstRespondedAt:
        message.direction === 'OUTBOUND' ? message.sentAt : null,
      lastMessageAt: message.sentAt,
      lastMessageDirection: message.direction,
      personId: person?.id ?? null,
      companyId: person?.companyId ?? null,
      opportunityId,
      metadata: {
        provider: 'evolution',
        instanceName: message.instanceName,
        remoteJid: message.remoteJid,
      },
    };
  }

  // A conversation that started before the contact existed in the CRM would stay
  // orphaned forever, since only creation ever looked for a person. Every inbound
  // message is another chance to attach it to a lead.
  private async linkConversationToPerson({
    repositories,
    conversation,
    message,
  }: {
    repositories: IngestionRepositories;
    conversation: InboxConversationRecord;
    message: NormalizedEvolutionMessage;
  }): Promise<InboxConversationRecord> {
    if (conversation.personId || message.direction !== 'INBOUND') {
      return conversation;
    }

    const person = await this.resolvePerson(
      repositories.personRepository,
      message,
    );

    if (!person) {
      return conversation;
    }

    const opportunityId =
      conversation.opportunityId ??
      (await this.resolveUniqueOpportunityId(
        repositories.opportunityRepository,
        person,
      ));

    await repositories.conversationRepository.update(conversation.id, {
      personId: person.id,
      companyId: conversation.companyId ?? person.companyId,
      opportunityId,
    });

    return {
      ...conversation,
      personId: person.id,
      companyId: conversation.companyId ?? person.companyId,
      opportunityId,
    };
  }

  private async resolveConversation({
    repositories,
    message,
  }: {
    repositories: IngestionRepositories;
    message: NormalizedEvolutionMessage;
  }): Promise<{
    conversation: InboxConversationRecord;
    created: boolean;
  }> {
    const existingConversation = await this.findInboxConversation(
      repositories.conversationRepository,
      message.providerThreadKey,
    );

    if (existingConversation) {
      return {
        conversation: await this.linkConversationToPerson({
          repositories,
          conversation: existingConversation,
          message,
        }),
        created: false,
      };
    }

    try {
      return {
        conversation: await this.createInboxConversation({
          repositories,
          message,
        }),
        created: true,
      };
    } catch (error) {
      const conversationCreatedByAnotherDelivery =
        await this.findInboxConversation(
          repositories.conversationRepository,
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
  }

  private async findInboxMessage(
    messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>,
    providerMessageKey: string,
  ): Promise<ExistingInboxMessageRecord | null> {
    const message = await messageRepository.findOne({
      where: { providerMessageKey },
    });

    return message
      ? {
          id: message.id,
          inboxConversationId: message.inboxConversationId,
          direction: message.direction as InboxMessageDirection,
          sentAt: message.sentAt,
          metadata: message.metadata,
        }
      : null;
  }

  private async inboxMessageExists(
    messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>,
    providerMessageKey: string,
  ): Promise<boolean> {
    return Boolean(
      await this.findInboxMessage(messageRepository, providerMessageKey),
    );
  }

  private async createInboxMessage({
    workspaceId,
    messageRepository,
    conversation,
    message,
    automationTrigger,
  }: {
    workspaceId: string;
    messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>;
    conversation: InboxConversationRecord;
    message: NormalizedEvolutionMessage;
    automationTrigger?: InboxAutomationTriggerValue;
  }): Promise<string | null> {
    if (
      await this.inboxMessageExists(
        messageRepository,
        message.providerMessageKey,
      )
    ) {
      return null;
    }

    try {
      const automationEvaluation: InboxAutomationEvaluationMetadata | undefined =
        automationTrigger
          ? {
              evaluationId: createHash('sha256')
                .update(`${workspaceId}:${message.providerMessageKey}`)
                .digest('hex'),
              trigger: automationTrigger,
              status: 'queued',
              queuedAt: new Date().toISOString(),
              attempts: 0,
            }
          : undefined;
      const inserted = await messageRepository.insert({
        name: buildMessagePreview(message),
        providerMessageKey: message.providerMessageKey,
        direction: message.direction,
        messageType: message.type,
        body: message.body,
        deliveryStatus: message.deliveryStatus,
        sentAt: message.sentAt,
        senderHandle: message.contactHandle,
        senderDisplayName: message.senderDisplayName,
        isInternalNote: false,
        inboxConversationId: conversation.id,
        providerPayloadFingerprint: message.payloadFingerprint,
        metadata: {
          provider: 'evolution',
          eventName: message.eventName,
          instanceName: message.instanceName,
          remoteJid: message.remoteJid,
          ...(automationTrigger ? { automationTrigger } : {}),
          ...(automationEvaluation
            ? { automationEvaluation }
            : {}),
        },
      });

      return inserted.identifiers[0]?.id as string | null;
    } catch (error) {
      if (
        await this.inboxMessageExists(
          messageRepository,
          message.providerMessageKey,
        )
      ) {
        return null;
      }

      throw error;
    }
  }

  private async updateConversationAfterMessage({
    conversationRepository,
    conversation,
    message,
  }: {
    conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>;
    conversation: InboxConversationRecord;
    message: NormalizedEvolutionMessage;
  }): Promise<void> {
    const lastProcessedProviderMessageKey =
      conversation.metadata?.lastProcessedProviderMessageKey;

    if (lastProcessedProviderMessageKey === message.providerMessageKey) {
      return;
    }

    const currentMessageAt = conversation.lastMessageAt
      ? Date.parse(conversation.lastMessageAt)
      : Number.NaN;
    const nextMessageAt = Date.parse(message.sentAt);

    if (
      Number.isFinite(currentMessageAt) &&
      Number.isFinite(nextMessageAt) &&
      nextMessageAt < currentMessageAt
    ) {
      return;
    }

    const isInbound = message.direction === 'INBOUND';
    const isFirstOutboundReply =
      message.direction === 'OUTBOUND' && !conversation.firstRespondedAt;

    await conversationRepository.update(conversation.id, {
      ...(isInbound ? { status: 'OPEN', snoozedUntil: null } : {}),
      unreadCount: isInbound
        ? Math.max(0, conversation.unreadCount ?? 0) + 1
        : (conversation.unreadCount ?? 0),
      lastMessagePreview: buildMessagePreview(message),
      lastMessageDirection: message.direction,
      lastMessageAt: message.sentAt,
      ...(isFirstOutboundReply ? { firstRespondedAt: message.sentAt } : {}),
      ...(conversation.personId ? { personId: conversation.personId } : {}),
      ...(conversation.companyId ? { companyId: conversation.companyId } : {}),
      ...(conversation.opportunityId
        ? { opportunityId: conversation.opportunityId }
        : {}),
      metadata: {
        ...(conversation.metadata ?? {}),
        lastProcessedProviderMessageKey: message.providerMessageKey,
      },
    });
  }

  private async updateDeliveryStatus(
    messageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>,
    status: NormalizedEvolutionStatus,
  ): Promise<boolean> {
    const message = await messageRepository.findOne({
      where: { providerMessageKey: status.providerMessageKey },
      select: { id: true },
    });

    if (!message) {
      return false;
    }

    await messageRepository.update(message.id, {
      deliveryStatus: status.deliveryStatus,
    });

    return true;
  }
}

export { type IngestionRepositories };
