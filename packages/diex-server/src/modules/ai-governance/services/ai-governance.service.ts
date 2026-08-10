import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AiActionRiskLevel,
  AiActionStatus,
  AiActionType,
} from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';
import { AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import {
  AI_ACTION_EXECUTION_WINDOW_MS,
  AI_ACTION_PROPOSAL_WINDOW_MS,
  buildAiActionWriteSet,
  getAiActionPolicy,
} from 'src/modules/ai-governance/types/ai-action-policy';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { EvolutionSendTextService } from 'src/modules/inbox/services/evolution-send-text.service';
import {
  issueConfirmationToken,
  verifyConfirmationToken,
} from 'src/modules/diex/utils/confirmation-token.util';
import {
  type WorkspaceAiPolicy,
  type WorkspaceAiPolicyUpdate,
} from 'src/modules/workspace-architecture/types/workspace-ai-policy.schema';
import { In, MoreThan } from 'typeorm';

const DAY_MS = 86_400_000;
const STALE_AI_ACTION_EXECUTION_MS = 15 * 60 * 1000;

const TASK_ACTION_TYPES = new Set([
  AiActionType.QUALIFY,
  AiActionType.FOLLOW_UP,
  AiActionType.RISK_MITIGATION,
  AiActionType.CS_INTERVENTION,
  AiActionType.EXPANSION,
]);
const PIPELINE_STAGES = [
  'NEW',
  'SCREENING',
  'MEETING',
  'DIAGNOSIS_COMPLETE',
  'PROPOSAL',
  'NEGOTIATION',
  'CUSTOMER',
  'LOST',
];

const readMarkdown = (value: { markdown?: string | null } | null): string =>
  value?.markdown?.trim() ?? '';

const getMinutesSinceMidnight = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
};

const isWithinOperatingWindow = (
  workspacePolicy: WorkspaceAiPolicy,
  now = new Date(),
): boolean => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: workspacePolicy.operatingWindow.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const hour = parts.find(({ type }) => type === 'hour')?.value;
    const minute = parts.find(({ type }) => type === 'minute')?.value;

    if (!hour || !minute) {
      return false;
    }

    const current = Number(hour) * 60 + Number(minute);
    const start = getMinutesSinceMidnight(workspacePolicy.operatingWindow.start);
    const end = getMinutesSinceMidnight(workspacePolicy.operatingWindow.end);

    if (start === end) {
      return true;
    }

    return start <= end
      ? current >= start && current < end
      : current >= start || current < end;
  } catch {
    return false;
  }
};

const getEffectiveAiPolicy = (
  actionPolicy: ReturnType<typeof getAiActionPolicy>,
  workspacePolicy: WorkspaceAiPolicy,
) => ({
  ...actionPolicy,
  version: `${actionPolicy.version}:workspace-${workspacePolicy.version}`,
  maxProposalsPerHour: Math.min(
    actionPolicy.maxProposalsPerHour,
    workspacePolicy.limits.maxProposalsPerHour,
  ),
  maxExecutionsPerHour: Math.min(
    actionPolicy.maxExecutionsPerHour,
    workspacePolicy.limits.maxExecutionsPerHour,
  ),
});

export type ProposeAiActionInput = {
  workspaceId: string;
  name: string;
  type: AiActionType;
  confidence?: number;
  rationale: string;
  proposedAction: string;
  opportunityId?: string;
  commercialSignalId?: string;
  successPlanId?: string;
  reviewerId?: string;
  inboxConversationId?: string;
  idempotencyKey?: string;
  contextVersion?: string;
};

export type ProposeAiActionResult = {
  success: boolean;
  aiActionId?: string;
  status: AiActionStatus;
  message: string;
};

export type ExecuteAiActionInput = {
  workspaceId: string;
  workspaceMemberId?: string;
  actionId: string;
  previewOnly: boolean;
  confirmExecute: boolean;
  confirmationToken?: string;
  targetStage?: string;
};

@Injectable()
export class AiGovernanceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
    private readonly evolutionSendTextService: EvolutionSendTextService,
  ) {}

  async getWorkspaceAiPolicy(workspaceId: string) {
    return this.workspaceArchitectureService.getAiPolicy(workspaceId);
  }

  async updateWorkspaceAiPolicy({
    workspaceId,
    update,
  }: {
    workspaceId: string;
    update: WorkspaceAiPolicyUpdate;
  }) {
    return this.workspaceArchitectureService.updateAiPolicy({
      workspaceId,
      update,
    });
  }

  async propose(input: ProposeAiActionInput): Promise<ProposeAiActionResult> {
    const name = input.name.trim();
    const rationale = input.rationale.trim();
    const proposedAction = input.proposedAction.trim();
    const workspacePolicy = await this.workspaceArchitectureService.getAiPolicy(
      input.workspaceId,
    );
    const policy = getEffectiveAiPolicy(
      getAiActionPolicy(input.type),
      workspacePolicy,
    );
    const writeSet = buildAiActionWriteSet(input);

    if (!name || !rationale || !proposedAction) {
      return {
        success: false,
        status: AiActionStatus.DRAFT,
        message:
          'Título, justificativa e ação proposta são obrigatórios para criar uma ação revisável.',
      };
    }
    if (policy.riskLevel === AiActionRiskLevel.BLOCKED) {
      return {
        success: false,
        status: AiActionStatus.REJECTED,
        message: 'Este tipo de ação não está autorizado pela política da IA.',
      };
    }
    if (workspacePolicy.blockedActionTypes.includes(input.type)) {
      return {
        success: false,
        status: AiActionStatus.REJECTED,
        message:
          'Este tipo de ação foi bloqueado pelo administrador deste workspace.',
      };
    }

    const authContext = buildSystemAuthContext(input.workspaceId);
    const contextVersion =
      input.contextVersion?.trim() ||
      (await this.workspaceArchitectureService.getAiOperatingContext(
        input.workspaceId,
      )).contextVersion;

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const actionRepository =
          await this.globalWorkspaceOrmManager.getRepository<AiActionWorkspaceEntity>(
            input.workspaceId,
            AiActionWorkspaceEntity,
        );
        const idempotencyKey = input.idempotencyKey?.trim() || undefined;

        if (idempotencyKey) {
          const existing = await actionRepository.findOne({
            where: { idempotencyKey },
          });
          if (existing) {
            return {
              success: true,
              aiActionId: existing.id,
              status:
                (existing.status as AiActionStatus) ??
                AiActionStatus.PENDING_APPROVAL,
              message:
                'A mesma evidência já possui uma ação registrada. Nenhuma duplicata foi criada.',
            };
          }
        }

        const recentProposalCount = await actionRepository.count({
          where: {
            createdAt: MoreThan(
              new Date(Date.now() - AI_ACTION_PROPOSAL_WINDOW_MS),
            ),
          } as never,
        });
        if (recentProposalCount >= policy.maxProposalsPerHour) {
          return {
            success: false,
            status: AiActionStatus.PENDING_APPROVAL,
            message:
              'O limite horário de propostas da IA foi atingido. Aguarde a próxima janela antes de gerar novas ações.',
          };
        }

        let estimatedCreditsUsed = 0;

        if (input.type !== AiActionType.REPLY) {
          const dailyActions = await actionRepository.find({
            where: {
              createdAt: MoreThan(new Date(Date.now() - DAY_MS)),
            } as never,
            select: { estimatedCostCredits: true } as never,
          });
          estimatedCreditsUsed = dailyActions.reduce(
            (total, action) => total + (action.estimatedCostCredits ?? 0),
            0,
          );
        }

        if (
          input.type !== AiActionType.REPLY &&
          estimatedCreditsUsed + policy.estimatedCostCredits >
            workspacePolicy.limits.maxEstimatedCreditsPerDay
        ) {
          return {
            success: false,
            status: AiActionStatus.PENDING_APPROVAL,
            message:
              'O limite diário estimado de créditos da IA foi atingido neste workspace. A operação continua disponível, mas uma nova ação exige revisão do administrador.',
          };
        }

        const action = actionRepository.create({
          name,
          actionType: input.type,
          status: AiActionStatus.PENDING_APPROVAL,
          confidence:
            input.confidence === undefined
              ? undefined
              : Math.min(100, Math.max(0, input.confidence)),
          rationale: { markdown: rationale, blocknote: null },
          proposedAction: { markdown: proposedAction, blocknote: null },
          requestedAt: new Date(),
          requiresApproval: policy.requiresApproval,
          opportunityId: input.opportunityId?.trim() || undefined,
          commercialSignalId: input.commercialSignalId?.trim() || undefined,
          successPlanId: input.successPlanId?.trim() || undefined,
          reviewerId: input.reviewerId?.trim() || undefined,
          inboxConversationId: input.inboxConversationId?.trim() || undefined,
          idempotencyKey,
          contextVersion,
          riskLevel: policy.riskLevel,
          writeSet,
          expiresAt: new Date(Date.now() + policy.expiryMs),
          policyVersion: policy.version,
          estimatedCostCredits: policy.estimatedCostCredits,
        } as never);
        const saved = (await actionRepository.save(
          action as unknown as AiActionWorkspaceEntity,
        )) as unknown as AiActionWorkspaceEntity;

        return {
          success: true,
          aiActionId: saved.id,
          status: AiActionStatus.PENDING_APPROVAL,
          message:
            'Ação registrada como aguardando aprovação. Nenhum efeito externo foi executado.',
        };
      },
      authContext,
    );
  }

  async execute(input: ExecuteAiActionInput): Promise<Record<string, unknown>> {
    const authContext = buildSystemAuthContext(input.workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const actionRepository =
          await this.globalWorkspaceOrmManager.getRepository<AiActionWorkspaceEntity>(
            input.workspaceId,
            AiActionWorkspaceEntity,
          );
        const action = await actionRepository.findOne({
          where: { id: input.actionId },
          relations: {
            opportunity: true,
            successPlan: true,
            customerRenewal: true,
            executionTask: true,
            inboxConversation: true,
          },
        });

        if (!action) {
          throw new NotFoundException('A ação de IA não foi encontrada.');
        }
        if (action.status === AiActionStatus.EXECUTED) {
          return {
            mode: 'APPLY',
            supported: true,
            executionKind:
              action.actionType === AiActionType.REPLY
                ? 'EXTERNAL_REPLY'
                : action.actionType === AiActionType.PIPELINE_UPDATE
                  ? 'PIPELINE_UPDATE'
                  : 'TASK',
            actionId: action.id,
            executed: true,
            alreadyExecuted: true,
            task: action.executionTask ?? null,
            pipelineChange: null,
            receipt: readMarkdown(action.executionReceipt),
            message:
              'Esta ação já foi executada; nenhum efeito duplicado foi aplicado.',
          };
        }
        if (action.status === AiActionStatus.EXECUTING) {
          const executionStartedAt = action.executionStartedAt?.getTime() ?? 0;

          if (
            executionStartedAt > 0 &&
            executionStartedAt + STALE_AI_ACTION_EXECUTION_MS <= Date.now()
          ) {
            await actionRepository.update(action.id, {
              status: AiActionStatus.FAILED,
              failureReason: {
                markdown:
                  'A execução ficou sem recibo por tempo excessivo e foi encerrada para impedir uma ação presa ou duplicada. Gere uma nova proposta após verificar o CRM.',
                blocknote: null,
              },
            } as never);

            return {
              mode: 'PREVIEW',
              supported: false,
              actionId: action.id,
              blockedReason: 'stale_execution_recovered',
              message:
                'A execução anterior foi recuperada como falha. Nenhuma nova alteração foi iniciada.',
            };
          }

          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason:
              'Esta ação já está em execução. Aguarde o recibo final antes de tentar novamente.',
            message: 'Execução em andamento; nenhuma duplicata foi iniciada.',
          };
        }
        if (action.status !== AiActionStatus.APPROVED) {
          throw new BadRequestException(
            'Somente ações aprovadas podem ser executadas.',
          );
        }

        const workspacePolicy =
          await this.workspaceArchitectureService.getAiPolicy(
            input.workspaceId,
          );
        const policy = getEffectiveAiPolicy(
          getAiActionPolicy(action.actionType as AiActionType),
          workspacePolicy,
        );
        if (
          action.riskLevel === AiActionRiskLevel.BLOCKED ||
          policy.riskLevel === AiActionRiskLevel.BLOCKED ||
          workspacePolicy.blockedActionTypes.includes(
            action.actionType as AiActionType,
          )
        ) {
          throw new BadRequestException(
            'A política atual bloqueia a execução desta ação de IA.',
          );
        }
        if (
          action.actionType === AiActionType.REPLY &&
          (!action.inboxConversation?.channel ||
            action.inboxConversation.channel !== 'WHATSAPP' ||
            !workspacePolicy.allowedChannels.includes(
              action.inboxConversation.channel,
            ))
        ) {
          throw new BadRequestException(
            'O canal da conversa não está autorizado pela política da IA deste workspace.',
          );
        }
        if (action.expiresAt && action.expiresAt.getTime() <= Date.now()) {
          await actionRepository.update(action.id, {
            status: AiActionStatus.FAILED,
            failureReason: {
              markdown:
                'A aprovação expirou. Gere uma nova proposta com o contexto atual.',
              blocknote: null,
            },
          } as never);

          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: 'proposal_expired',
            message:
              'A proposta expirou e foi encerrada. Gere uma nova proposta para manter o escopo seguro.',
          };
        }
        if ((action.attemptCount ?? 0) >= policy.maxAttempts) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: 'max_attempts_reached',
            message:
              'O limite de tentativas desta ação foi atingido. Gere uma nova proposta após revisar a falha.',
          };
        }

        if (action.contextVersion) {
          const currentContextVersion = (
            await this.workspaceArchitectureService.getAiOperatingContext(
              input.workspaceId,
            )
          ).contextVersion;

          if (currentContextVersion !== action.contextVersion) {
            await actionRepository.update(action.id, {
              status: AiActionStatus.FAILED,
              failureReason: {
                markdown:
                  'O contexto operacional mudou depois da aprovação. A ação exige nova proposta.',
                blocknote: null,
              },
            } as never);

            return {
              mode: 'PREVIEW',
              supported: false,
              actionId: action.id,
              blockedReason:
                'O contexto operacional mudou depois da aprovação. Gere uma nova proposta e aprove-a novamente antes de executar.',
              actionContextVersion: action.contextVersion,
              currentContextVersion,
              message: 'Execução bloqueada por contexto desatualizado.',
            };
          }
        }

        const opportunityRepository =
          await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
            input.workspaceId,
            'opportunity',
          );
        const targetOpportunity = action.opportunityId
          ? await opportunityRepository.findOne({
              where: { id: action.opportunityId },
            })
          : null;
        const proposedAction = readMarkdown(action.proposedAction);
        const targetStage = input.targetStage?.trim() || '';
        const isPipelineUpdate =
          action.actionType === AiActionType.PIPELINE_UPDATE;
        const isExternalReply = action.actionType === AiActionType.REPLY;
        const writeSet = Array.isArray(action.writeSet) ? action.writeSet : [];
        const hasOpportunityScope = writeSet.some(
          (entry) =>
            entry.resourceType === 'OPPORTUNITY' &&
            entry.resourceId === action.opportunityId,
        );

        if (action.opportunityId && !hasOpportunityScope) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: 'write_scope_mismatch',
            message:
              'A oportunidade alvo não está no escopo aprovado para esta ação.',
          };
        }

        if (isPipelineUpdate && !targetOpportunity) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason:
              'A ação de pipeline não possui oportunidade vinculada.',
            message: 'Execução bloqueada: oportunidade não encontrada.',
          };
        }
        if (
          !isPipelineUpdate &&
          !isExternalReply &&
          !TASK_ACTION_TYPES.has(action.actionType as AiActionType)
        ) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason:
              'Este tipo de ação não possui executor nativo seguro.',
            message: 'Ação mantida na fila para execução manual.',
          };
        }

        if (isPipelineUpdate && !targetStage) {
          return {
            mode: 'PREVIEW',
            supported: true,
            executionKind: 'PIPELINE_UPDATE',
            actionId: action.id,
            requiresTargetStage: true,
            opportunity: {
              id: targetOpportunity?.id,
              name: targetOpportunity?.name,
            },
            currentStage: {
              value: targetOpportunity?.stage,
              label: targetOpportunity?.stage,
              position: 0,
            },
            stageOptions: PIPELINE_STAGES.map((value, position) => ({
              value,
              label: value,
              position,
            })),
            message: 'Escolha a etapa de destino antes de confirmar.',
          };
        }
        if (isPipelineUpdate && !PIPELINE_STAGES.includes(targetStage)) {
          throw new BadRequestException('Etapa de destino não permitida.');
        }

        const fingerprint = [
          action.status,
          targetStage,
          proposedAction,
          action.policyVersion ?? policy.version,
          action.expiresAt?.toISOString() ?? '',
          JSON.stringify(action.writeSet ?? []),
        ].join(':');
        const confirmation = issueConfirmationToken({
          workspaceId: input.workspaceId,
          scope: `ai-action:${action.id}`,
          fingerprint,
        });

        if (input.previewOnly || !input.confirmExecute) {
          if (isPipelineUpdate) {
            return {
              mode: 'PREVIEW',
              supported: true,
              executionKind: 'PIPELINE_UPDATE',
              actionId: action.id,
              requiresTargetStage: false,
              pipelineChange: {
                opportunity: {
                  id: targetOpportunity?.id,
                  name: targetOpportunity?.name,
                },
                sourceStage: {
                  value: targetOpportunity?.stage,
                  label: targetOpportunity?.stage,
                  position: 0,
                },
                targetStage: {
                  value: targetStage,
                  label: targetStage,
                  position: PIPELINE_STAGES.indexOf(targetStage),
                },
              },
              stageOptions: PIPELINE_STAGES.map((value, position) => ({
                value,
                label: value,
                position,
              })),
              confirmationToken: confirmation.token,
              expiresAt: confirmation.expiresAt,
              message:
                'Prévia de atualização do pipeline gerada sem alterar o CRM.',
            };
          }

          if (isExternalReply) {
            return {
              mode: 'PREVIEW',
              supported: true,
              executionKind: 'EXTERNAL_REPLY',
              actionId: action.id,
              externalMessage: {
                channel: 'WHATSAPP',
                conversationId:
                  action.inboxConversationId ?? action.inboxConversation?.id,
                textPreview: proposedAction,
              },
              confirmationToken: confirmation.token,
              expiresAt: confirmation.expiresAt,
              message:
                'Prévia da resposta de WhatsApp gerada. A mensagem só será enviada após a aprovação explícita desta ação.',
            };
          }

          const taskId =
            action.executionTaskId ?? `diex-ai-action-task:${action.id}`;
          return {
            mode: 'PREVIEW',
            supported: true,
            executionKind: 'TASK',
            actionId: action.id,
            task: {
              id: taskId,
              title: action.name ?? 'Ação de IA',
              dueAt: new Date(Date.now() + DAY_MS).toISOString(),
              assignee: action.reviewerId
                ? { id: action.reviewerId }
                : { id: '' },
              targets: [
                ...(action.opportunityId
                  ? [
                      {
                        id: action.opportunityId,
                        label: 'Oportunidade',
                        objectNameSingular: 'opportunity' as const,
                      },
                    ]
                  : []),
                ...(action.successPlanId
                  ? [
                      {
                        id: action.successPlanId,
                        label: 'Plano de sucesso',
                        objectNameSingular: 'company' as const,
                      },
                    ]
                  : []),
              ],
              body: proposedAction,
            },
            confirmationToken: confirmation.token,
            expiresAt: confirmation.expiresAt,
            message: 'Prévia da tarefa gerada sem alterar o CRM.',
          };
        }

        if (
          !verifyConfirmationToken({
            token: input.confirmationToken,
            workspaceId: input.workspaceId,
            scope: `ai-action:${action.id}`,
            fingerprint,
          })
        ) {
          throw new BadRequestException(
            'Token de confirmação inválido ou expirado. Gere uma nova prévia.',
          );
        }

        if (
          !input.previewOnly &&
          input.confirmExecute &&
          !isWithinOperatingWindow(workspacePolicy)
        ) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: 'operating_window_closed',
            message:
              `A execução está fora da janela operacional da IA (${workspacePolicy.operatingWindow.start}-${workspacePolicy.operatingWindow.end}, ${workspacePolicy.operatingWindow.timezone}). A ação continua aprovada para a próxima janela.`,
          };
        }

        const recentExecutionCount = await actionRepository.count({
          where: {
            createdAt: MoreThan(
              new Date(
                Date.now() -
                  (isExternalReply
                    ? DAY_MS
                    : AI_ACTION_EXECUTION_WINDOW_MS),
              ),
            ),
            ...(isExternalReply
              ? { actionType: AiActionType.REPLY }
              : {}),
            status: In([AiActionStatus.EXECUTED, AiActionStatus.EXECUTING]),
          } as never,
        });
        const executionLimit = isExternalReply
          ? workspacePolicy.limits.maxExternalMessagesPerDay
          : policy.maxExecutionsPerHour;
        if (recentExecutionCount >= executionLimit) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: isExternalReply
              ? 'external_message_daily_limit'
              : 'execution_rate_limit',
            message:
              isExternalReply
                ? 'O limite diário de mensagens externas foi atingido. A ação continua aprovada e será reavaliada no próximo período.'
                : 'O limite horário de execuções da IA foi atingido. A ação continua aprovada e será reavaliada na próxima janela.',
          };
        }

        if (isExternalReply && !input.workspaceMemberId) {
          throw new BadRequestException(
            'A resposta externa exige um membro autenticado do workspace.',
          );
        }

        const claimResult = await actionRepository.update(
          { id: action.id, status: AiActionStatus.APPROVED } as never,
          {
            status: AiActionStatus.EXECUTING,
            executionStartedAt: new Date(),
            attemptCount: (action.attemptCount ?? 0) + 1,
          } as never,
        );

        if (claimResult.affected !== 1) {
          throw new BadRequestException(
            'Esta ação já foi assumida por outro executor ou deixou de estar aprovada.',
          );
        }

        let task: TaskWorkspaceEntity | null = null;
        let pipelineChange: Record<string, unknown> | null = null;
        let externalMessage: Record<string, unknown> | null = null;

        try {
          if (isExternalReply) {
            const sendResult =
              await this.evolutionSendTextService.sendApprovedAiReply({
                workspaceId: input.workspaceId,
                workspaceMemberId: input.workspaceMemberId ?? '',
                conversationId:
                  action.inboxConversationId ?? action.inboxConversation?.id ?? '',
                text: proposedAction,
                aiActionId: action.id,
              });

            if (!sendResult.sent) {
              throw new BadRequestException(
                sendResult.message ??
                  'O WhatsApp não confirmou o envio da resposta externa.',
              );
            }

            externalMessage = sendResult as unknown as Record<string, unknown>;
          } else if (isPipelineUpdate && targetOpportunity) {
            const sourceStage = targetOpportunity.stage;
            await opportunityRepository.update(targetOpportunity.id, {
              stage: targetStage,
            } as never);
            pipelineChange = {
              opportunity: {
                id: targetOpportunity.id,
                name: targetOpportunity.name,
              },
              sourceStage: {
                value: sourceStage,
                label: sourceStage,
                position: PIPELINE_STAGES.indexOf(sourceStage),
              },
              targetStage: {
                value: targetStage,
                label: targetStage,
                position: PIPELINE_STAGES.indexOf(targetStage),
              },
            };
          } else {
            const taskRepository =
              await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
                input.workspaceId,
                'task',
              );
            const taskId =
              action.executionTaskId ?? `diex-ai-action-task:${action.id}`;
            task = await taskRepository.findOne({ where: { id: taskId } });
            if (!task) {
              task = (await taskRepository.save(
                taskRepository.create({
                  id: taskId,
                  title: action.name ?? 'Ação de IA',
                  bodyV2: { markdown: proposedAction, blocknote: null },
                  dueAt: new Date(Date.now() + DAY_MS),
                  status: 'TODO',
                  assigneeId: action.reviewerId,
                  diexSuccessPlanId: action.successPlanId,
                  diexInboxConversationId: action.inboxConversationId,
                } as never),
              )) as unknown as TaskWorkspaceEntity;
            }
            if (!task) {
              throw new BadRequestException(
                'A tarefa de execução não pôde ser criada.',
              );
            }
            await actionRepository.update(action.id, {
              executionTaskId: task.id,
            } as never);
          }

          if (isPipelineUpdate && targetOpportunity) {
            const verifiedOpportunity = await opportunityRepository.findOne({
              where: { id: targetOpportunity.id },
            });

            if (verifiedOpportunity?.stage !== targetStage) {
              throw new BadRequestException(
                'A etapa da oportunidade não corresponde ao resultado esperado após a execução.',
              );
            }
          } else if (task) {
            const taskRepository =
              await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
                input.workspaceId,
                'task',
              );
            const verifiedTask = await taskRepository.findOne({
              where: { id: task.id },
            });

            if (!verifiedTask) {
              throw new BadRequestException(
                'O follow-up não foi encontrado após a execução da ação de IA.',
              );
            }
          }

          const receipt = `${isExternalReply ? 'Resposta de WhatsApp enviada' : isPipelineUpdate ? 'Pipeline atualizado' : 'Tarefa criada'} em ${new Date().toISOString()} por aprovação humana. Contexto operacional: ${action.contextVersion ?? 'não informado'}.`;
          await actionRepository.update(action.id, {
            status: AiActionStatus.EXECUTED,
            executedAt: new Date(),
            executionReceipt: { markdown: receipt, blocknote: null },
            failureReason: null,
          } as never);

          return {
            mode: 'APPLY',
            supported: true,
            executionKind: isExternalReply
              ? 'EXTERNAL_REPLY'
              : isPipelineUpdate
                ? 'PIPELINE_UPDATE'
                : 'TASK',
            actionId: action.id,
            executed: true,
            alreadyExecuted: false,
            task,
            pipelineChange,
            externalMessage,
            receipt,
            contextVersion: action.contextVersion ?? null,
            message: isExternalReply
              ? 'Resposta enviada pelo WhatsApp e execução registrada na trilha de governança.'
              : isPipelineUpdate
                ? 'Etapa da oportunidade atualizada e execução registrada.'
                : 'Tarefa criada e execução registrada na trilha de governança.',
          };
        } catch (error) {
          const failureMessage =
            error instanceof Error
              ? error.message
              : 'Falha desconhecida durante a execução.';
          await actionRepository.update(action.id, {
            status: AiActionStatus.FAILED,
            failureReason: { markdown: failureMessage, blocknote: null },
            executionReceipt: {
              markdown: `Execução interrompida em ${new Date().toISOString()}.`,
              blocknote: null,
            },
          } as never);
          throw error;
        }
      },
      authContext,
    );
  }
}
