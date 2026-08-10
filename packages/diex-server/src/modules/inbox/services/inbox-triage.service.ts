import { Injectable } from '@nestjs/common';

import { AgentAsyncExecutorService } from 'src/engine/metadata-modules/ai/ai-agent-execution/services/agent-async-executor.service';
import { AgentEntity } from 'src/engine/metadata-modules/ai/ai-agent/entities/agent.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { InjectWorkspaceScopedRepository } from 'src/engine/diex-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { type WorkspaceScopedRepository } from 'src/engine/diex-orm/workspace-scoped-repository/workspace-scoped-repository';
import { STANDARD_AGENT } from 'src/engine/workspace-manager/diex-standard-application/constants/standard-agent.constant';
import {
  AiActionStatus,
  AiActionType,
} from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';
import { AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import {
  CommercialSignalSource,
  CommercialSignalStatus,
  CommercialSignalType,
} from 'src/modules/commercial-intelligence/standard-objects/commercial-signal.standard-object-definition';
import { CommercialSignalWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/commercial-signal.workspace-entity';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';

type TriageInput = {
  conversationId: string;
  registerSignal?: boolean;
  proposeReply?: boolean;
  userWorkspaceId?: string | null;
};

export type InboxTriageResult = {
  conversationId: string;
  summary: string;
  intent: string;
  sentiment: string;
  urgency: number;
  signalType: CommercialSignalType | null;
  signalStrength: number;
  confidence: number;
  evidence: string;
  recommendedAction: string;
  suggestedReply: string;
  commercialSignalId?: string;
  aiActionId?: string;
  message: string;
};

type TriageConversation = {
  id: string;
  name: string | null;
  channel: string | null;
  provider: string | null;
  status: string | null;
  priority: string | null;
  contactHandle: string | null;
  lastMessageAt: string | null;
  person: {
    id: string;
    name: { firstName: string | null; lastName: string | null } | null;
    buyingRole: string | null;
    buyingIntent: string | null;
  } | null;
  company: {
    id: string;
    name: string | null;
    icpFit: string | null;
  } | null;
  opportunity: {
    id: string;
    name: string | null;
    stage: string | null;
    commercialScore: number | null;
    dealRisk: string | null;
    nextCommercialAction: string | null;
    nextCommercialActionAt: Date | null;
  } | null;
};

type TriageMessage = {
  id: string;
  direction: string | null;
  messageType: string | null;
  body: string | null;
  transcription: string | null;
  transcriptionStatus: string | null;
  sentAt: string | null;
  senderDisplayName: string | null;
  isInternalNote: boolean | null;
};

type TriageContext = {
  conversation: TriageConversation;
  messages: TriageMessage[];
  agent: AgentEntity;
};

type AiOperatingContext = Awaited<
  ReturnType<WorkspaceArchitectureService['getAiOperatingContext']>
>;

const TRIAGE_AGENT_UNIVERSAL_IDENTIFIER =
  STANDARD_AGENT.diexInboxTriage.universalIdentifier;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const readString = (record: Record<string, unknown>, key: string): string =>
  typeof record[key] === 'string' ? record[key].trim() : '';

const readNumber = (
  record: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
): number => {
  const value =
    typeof record[key] === 'number' ? record[key] : Number(record[key]);

  return Number.isFinite(value) ? clamp(value, minimum, maximum) : minimum;
};

const readBoolean = (record: Record<string, unknown>, key: string): boolean =>
  record[key] === true;

const asSignalType = (value: string): CommercialSignalType | null =>
  Object.values(CommercialSignalType).includes(value as CommercialSignalType)
    ? (value as CommercialSignalType)
    : null;

const buildPrompt = (
  { conversation, messages }: Pick<TriageContext, 'conversation' | 'messages'>,
  operatingContext: AiOperatingContext,
): string => {
  const safeMessages = messages.map((message) => ({
    id: message.id,
    direction: message.direction,
    messageType: message.messageType,
    sentAt: message.sentAt,
    senderDisplayName: message.senderDisplayName,
    isInternalNote: message.isInternalNote,
    body: message.body?.slice(0, 2_000) ?? null,
    transcription: message.transcription?.slice(0, 2_000) ?? null,
    transcriptionStatus: message.transcriptionStatus,
  }));

  return [
    'Analise o pacote fechado abaixo. Ele já está limitado ao workspace atual.',
    'Não execute nenhuma ação. Produza somente a saída estruturada solicitada.',
    'Use o contexto operacional compilado como fonte de verdade para intenção, oferta, ICP, regras, objeções e próxima ação. Se uma informação estiver em unresolvedInformation, sinalize a lacuna e não invente. Respeite forbiddenClaims e não faça promessas fora do contexto aprovado.',
    'Em mensagens de áudio, transcription com transcriptionStatus DONE é a fala do cliente: trate como fala dele e cite como fala. Quando o status não é DONE, ninguém leu o áudio ainda, mas o operador consegue ouvi-lo na inbox: não invente o conteúdo e não trate a mensagem como vazia. Nesse caso recommended_action é o operador abrir o áudio antes de responder, e suggested_reply é uma mensagem curta que faça sentido sem conhecer o conteúdo do áudio, sem pedir que o cliente repita por escrito o que já falou.',
    JSON.stringify({
      operatingContext: {
        contextVersion: operatingContext.contextVersion,
        goal: operatingContext.goal,
        commercialContext: operatingContext.commercialContext,
        operationProfile: operatingContext.operationProfile,
        operationManifest: operatingContext.operationManifest,
        policy: operatingContext.policy,
        pages: operatingContext.pageOverrides.slice(0, 30),
      },
      conversation,
      messages: safeMessages,
    }),
  ].join('\n\n');
};

@Injectable()
export class InboxTriageService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly agentAsyncExecutorService: AgentAsyncExecutorService,
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
    @InjectWorkspaceScopedRepository(AgentEntity)
    private readonly agentRepository: WorkspaceScopedRepository<AgentEntity>,
  ) {}

  async triage({
    workspaceId,
    conversationId,
    registerSignal = false,
    proposeReply = false,
    userWorkspaceId,
  }: TriageInput & { workspaceId: string }): Promise<InboxTriageResult> {
    const normalizedConversationId = conversationId.trim();

    if (!normalizedConversationId) {
      throw new Error('conversationId é obrigatório.');
    }

    const authContext = buildSystemAuthContext(workspaceId);
    const context =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const [conversationRepository, messageRepository] = await Promise.all(
            [
              this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
                workspaceId,
                InboxConversationWorkspaceEntity,
                { shouldBypassPermissionChecks: true },
              ),
              this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
                workspaceId,
                InboxMessageWorkspaceEntity,
                { shouldBypassPermissionChecks: true },
              ),
            ],
          );

          const [conversation, messages] = await Promise.all([
            conversationRepository.findOne({
              where: { id: normalizedConversationId },
              relations: { person: true, company: true, opportunity: true },
            }),
            messageRepository.find({
              where: { inboxConversationId: normalizedConversationId },
              order: { sentAt: 'DESC' },
              take: 80,
            }),
          ]);
          const agent = await this.agentRepository.findOne(workspaceId, {
            where: { universalIdentifier: TRIAGE_AGENT_UNIVERSAL_IDENTIFIER },
          });

          if (!conversation) {
            throw new Error('A conversa da inbox não foi encontrada.');
          }

          if (!agent) {
            throw new Error(
              'O agente standard de triagem da inbox não está disponível.',
            );
          }

          if (messages.length === 0) {
            throw new Error(
              'A conversa ainda não possui mensagens para análise.',
            );
          }

          return {
            conversation: {
              id: conversation.id,
              name: conversation.name,
              channel: conversation.channel,
              provider: conversation.provider,
              status: conversation.status,
              priority: conversation.priority,
              contactHandle: conversation.contactHandle,
              lastMessageAt: conversation.lastMessageAt,
              person: conversation.person
                ? {
                    id: conversation.person.id,
                    name: conversation.person.name,
                    buyingRole: conversation.person.buyingRole,
                    buyingIntent: conversation.person.buyingIntent,
                  }
                : null,
              company: conversation.company
                ? {
                    id: conversation.company.id,
                    name: conversation.company.name,
                    icpFit: conversation.company.icpFit,
                  }
                : null,
              opportunity: conversation.opportunity
                ? {
                    id: conversation.opportunity.id,
                    name: conversation.opportunity.name,
                    stage: conversation.opportunity.stage,
                    commercialScore: conversation.opportunity.commercialScore,
                    dealRisk: conversation.opportunity.dealRisk,
                    nextCommercialAction:
                      conversation.opportunity.nextCommercialAction,
                    nextCommercialActionAt:
                      conversation.opportunity.nextCommercialActionAt,
                  }
                : null,
            },
            messages: messages.reverse().map((message) => ({
              id: message.id,
              direction: message.direction,
              messageType: message.messageType,
              body: message.body,
              transcription: message.transcription,
              transcriptionStatus: message.transcriptionStatus,
              sentAt: message.sentAt,
              senderDisplayName: message.senderDisplayName,
              isInternalNote: message.isInternalNote,
            })),
            agent,
          } satisfies TriageContext;
        },
        authContext,
      );

    const operatingContext =
      await this.workspaceArchitectureService.getAiOperatingContext(workspaceId);
    const execution = await this.agentAsyncExecutorService.executeAgent({
      agent: context.agent,
      userPrompt: buildPrompt(context, operatingContext),
      workspaceId,
      userWorkspaceId,
      // The specialized prompt already carries the full context and the
      // conversation evidence. Avoid adding the compiled context a second time.
      operatingContextPrompt: '',
    });
    const result = execution.result as Record<string, unknown>;
    const summary = readString(result, 'summary');
    const intent = readString(result, 'intent');
    const sentiment = readString(result, 'sentiment');
    const urgency = readNumber(result, 'urgency', 1, 5);
    const signalType = asSignalType(readString(result, 'signal_type'));
    const signalStrength = readNumber(result, 'signal_strength', 1, 5);
    const confidence = readNumber(result, 'confidence', 0, 100);
    const evidence = readString(result, 'evidence');
    const recommendedAction = readString(result, 'recommended_action');
    const suggestedReply = readString(result, 'suggested_reply');
    const latestMessageId = context.messages[context.messages.length - 1]?.id;
    const contextVersion = operatingContext.contextVersion;

    let commercialSignalId: string | undefined;
    let aiActionId: string | undefined;

    if (
      registerSignal &&
      readBoolean(result, 'should_register_signal') &&
      signalType &&
      latestMessageId
    ) {
      commercialSignalId = await this.upsertCommercialSignal({
        workspaceId,
        conversation: context.conversation,
        latestMessageId,
        signalType,
        signalStrength,
        confidence,
        evidence,
        recommendedAction,
        authContext,
      });
    }

    if (
      proposeReply &&
      readBoolean(result, 'should_propose_reply') &&
      suggestedReply &&
      latestMessageId
    ) {
      aiActionId = await this.upsertAiAction({
        workspaceId,
        conversation: context.conversation,
        latestMessageId,
        confidence,
        summary,
        evidence,
        suggestedReply,
        commercialSignalId,
        contextVersion,
        authContext,
      });
    }

    return {
      conversationId: normalizedConversationId,
      summary,
      intent,
      sentiment,
      urgency,
      signalType,
      signalStrength,
      confidence,
      evidence,
      recommendedAction,
      suggestedReply,
      commercialSignalId,
      aiActionId,
      message:
        'Análise concluída com dados da conversa. Nenhuma mensagem foi enviada.',
    };
  }

  private async upsertCommercialSignal({
    workspaceId,
    conversation,
    latestMessageId,
    signalType,
    signalStrength,
    confidence,
    evidence,
    recommendedAction,
    authContext,
  }: {
    workspaceId: string;
    conversation: TriageConversation;
    latestMessageId: string;
    signalType: CommercialSignalType;
    signalStrength: number;
    confidence: number;
    evidence: string;
    recommendedAction: string;
    authContext: ReturnType<typeof buildSystemAuthContext>;
  }): Promise<string> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<CommercialSignalWorkspaceEntity>(
            workspaceId,
            CommercialSignalWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );
        const sourceReference = `inbox:${conversation.id}:${latestMessageId}:${signalType}`;
        const existing = await repository.findOne({
          where: { sourceReference },
        });
        const data = {
          name: `${signalType}: ${conversation.name || 'Conversa da inbox'}`.slice(
            0,
            250,
          ),
          signalType,
          source:
            conversation.channel === 'WHATSAPP'
              ? CommercialSignalSource.WHATSAPP
              : CommercialSignalSource.EMAIL,
          status: CommercialSignalStatus.NEW,
          strength: `RATING_${Math.round(signalStrength)}`,
          confidence: Math.round(confidence),
          evidence: { markdown: evidence, blocknote: null },
          recommendedAction: { markdown: recommendedAction, blocknote: null },
          capturedAt: new Date(),
          sourceReference,
          personId: conversation.person?.id ?? null,
          companyId: conversation.company?.id ?? null,
          opportunityId: conversation.opportunity?.id ?? null,
        };

        const saved = await repository.save(
          existing ? Object.assign(existing, data) : repository.create(data),
        );

        return saved.id;
      },
      authContext,
    );
  }

  private async upsertAiAction({
    workspaceId,
    conversation,
    latestMessageId,
    confidence,
    summary,
    evidence,
    suggestedReply,
    commercialSignalId,
    contextVersion,
    authContext,
  }: {
    workspaceId: string;
    conversation: TriageConversation;
    latestMessageId: string;
    confidence: number;
    summary: string;
    evidence: string;
    suggestedReply: string;
    commercialSignalId?: string;
    contextVersion: string;
    authContext: ReturnType<typeof buildSystemAuthContext>;
  }): Promise<string> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<AiActionWorkspaceEntity>(
            workspaceId,
            AiActionWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );
        const idempotencyKey = `inbox-reply:${conversation.id}:${latestMessageId}`;
        const existing = await repository.findOne({
          where: { idempotencyKey },
          select: ['id'],
        });

        if (existing) {
          return existing.id;
        }

        const saved = await repository.save(
          repository.create({
            name: `Revisar resposta para ${conversation.name || 'contato'}`,
            actionType: AiActionType.REPLY,
            status: AiActionStatus.PENDING_APPROVAL,
            confidence: Math.round(confidence),
            rationale: {
              markdown: `${summary}\n\nEvidência: ${evidence}`,
              blocknote: null,
            },
            proposedAction: { markdown: suggestedReply, blocknote: null },
            requestedAt: new Date(),
            requiresApproval: true,
            idempotencyKey,
            commercialSignalId: commercialSignalId ?? null,
            inboxConversationId: conversation.id,
            opportunityId: conversation.opportunity?.id ?? null,
            contextVersion,
          }),
        );

        return saved.id;
      },
      authContext,
    );
  }
}
