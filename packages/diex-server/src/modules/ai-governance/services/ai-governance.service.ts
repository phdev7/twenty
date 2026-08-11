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
  type AiActionCustomWriteSetEntry,
} from 'src/modules/ai-governance/types/ai-action-policy';
import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { CreateRecordService } from 'src/engine/core-modules/record-crud/services/create-record.service';
import { UpdateRecordService } from 'src/engine/core-modules/record-crud/services/update-record.service';
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
import { MoreThan } from 'typeorm';

const DAY_MS = 86_400_000;
const STALE_AI_ACTION_EXECUTION_MS = 15 * 60 * 1000;

const TASK_ACTION_TYPES = new Set([
  AiActionType.QUALIFY,
  AiActionType.FOLLOW_UP,
  AiActionType.RISK_MITIGATION,
  AiActionType.CS_INTERVENTION,
  AiActionType.EXPANSION,
]);
const IMMUTABLE_CUSTOM_FIELD_NAMES = new Set([
  '__proto__',
  'constructor',
  'createdAt',
  'createdBy',
  'deletedAt',
  'id',
  'position',
  'prototype',
  'updatedAt',
  'updatedBy',
]);

const UNSAFE_CUSTOM_FIELD_TYPES = new Set([
  'ACTOR',
  'MORPH_RELATION',
  'POSITION',
  'RELATION',
  'TS_VECTOR',
  'UUID',
]);

const CORE_OBJECTS_REQUIRING_NATIVE_ACTION = new Set([
  'aiAction',
  'company',
  'diexWorkspaceContext',
  'inboxConversation',
  'inboxMessage',
  'opportunity',
  'person',
  'task',
  'workspaceArchitectureArtifact',
  'workspaceMember',
]);

const readMarkdown = (value: { markdown?: string | null } | null): string =>
  value?.markdown?.trim() ?? '';

const readCustomWriteSet = (
  value: Record<string, unknown> | undefined,
): AiActionCustomWriteSetEntry | undefined => {
  if (
    value?.resourceType !== 'CUSTOM_OBJECT' ||
    typeof value.objectName !== 'string' ||
    (value.operation !== 'CREATE' && value.operation !== 'UPDATE') ||
    !Array.isArray(value.fields) ||
    !value.fields.every((field) => typeof field === 'string') ||
    typeof value.payload !== 'object' ||
    value.payload === null ||
    Array.isArray(value.payload) ||
    value.approvalClass !== 'HUMAN_APPROVAL' ||
    (value.resourceId !== null && typeof value.resourceId !== 'string')
  ) {
    return undefined;
  }

  const fields = [...new Set(value.fields)];
  const payload = value.payload as Record<string, unknown>;

  if (
    fields.length === 0 ||
    fields.length !== value.fields.length ||
    Object.keys(payload).length !== fields.length ||
    !fields.every((field) =>
      Object.prototype.hasOwnProperty.call(payload, field),
    )
  ) {
    return undefined;
  }

  return {
    resourceType: 'CUSTOM_OBJECT',
    resourceId: value.resourceId,
    objectName: value.objectName,
    operation: value.operation,
    fields,
    payload,
    approvalClass: 'HUMAN_APPROVAL',
  };
};

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
    const start = getMinutesSinceMidnight(
      workspacePolicy.operatingWindow.start,
    );
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
  customObject?: {
    objectName: string;
    recordId?: string;
    operation: 'CREATE' | 'UPDATE';
    fields: Record<string, unknown>;
  };
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
    private readonly cacheLockService: CacheLockService,
    private readonly createRecordService: CreateRecordService,
    private readonly updateRecordService: UpdateRecordService,
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

  async review({
    workspaceId,
    workspaceMemberId,
    actionId,
    decision,
    note,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    actionId: string;
    decision: 'APPROVED' | 'REJECTED';
    note: string;
  }) {
    if (!actionId) {
      throw new BadRequestException('Informe a ação de IA que será revisada.');
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const actionRepository =
          await this.globalWorkspaceOrmManager.getRepository<AiActionWorkspaceEntity>(
            workspaceId,
            AiActionWorkspaceEntity,
          );
        const action = await actionRepository.findOne({
          where: { id: actionId },
        });

        if (!action) {
          throw new NotFoundException('A ação de IA não foi encontrada.');
        }

        if (action.status !== AiActionStatus.PENDING_APPROVAL) {
          throw new BadRequestException(
            'Esta ação não está mais aguardando aprovação.',
          );
        }

        const normalizedNote =
          note.trim() ||
          (decision === 'APPROVED'
            ? 'Proposta aprovada manualmente no Centro de IA.'
            : 'Proposta rejeitada manualmente no Centro de IA.');
        const updateResult = await actionRepository.update(
          {
            id: action.id,
            status: AiActionStatus.PENDING_APPROVAL,
          } as never,
          {
            status:
              decision === 'APPROVED'
                ? AiActionStatus.APPROVED
                : AiActionStatus.REJECTED,
            approvedAt: decision === 'APPROVED' ? new Date() : null,
            reviewerId: workspaceMemberId,
            approvalNotes: {
              markdown: normalizedNote,
              blocknote: null,
            },
          } as never,
        );

        if (updateResult.affected !== 1) {
          throw new BadRequestException(
            'A ação foi revisada por outra pessoa antes desta decisão.',
          );
        }

        return {
          success: true,
          actionId: action.id,
          status: decision,
          reviewerId: workspaceMemberId,
          message:
            decision === 'APPROVED'
              ? 'Proposta aprovada. Nenhum efeito foi executado.'
              : 'Proposta rejeitada e registrada na trilha de governança.',
        };
      },
      authContext,
    );
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
    if (input.customObject) {
      if (input.type === AiActionType.REPLY) {
        return {
          success: false,
          status: AiActionStatus.REJECTED,
          message:
            'Uma resposta externa não pode misturar alteração de registro adaptativo.',
        };
      }

      const customObjectError = await this.validateCustomActionContract(
        input.workspaceId,
        input.customObject,
      );

      if (customObjectError) {
        return {
          success: false,
          status: AiActionStatus.REJECTED,
          message: customObjectError,
        };
      }
    }

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
      (
        await this.workspaceArchitectureService.getAiOperatingContext(
          input.workspaceId,
        )
      ).contextVersion;

    return this.cacheLockService.withLock(
      () =>
        this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
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
              const sameProposal =
                existing.name === name &&
                existing.actionType === input.type &&
                readMarkdown(existing.rationale) === rationale &&
                readMarkdown(existing.proposedAction) === proposedAction &&
                existing.contextVersion === contextVersion &&
                existing.commercialSignalId ===
                  (input.commercialSignalId?.trim() || null) &&
                JSON.stringify(existing.writeSet ?? []) ===
                  JSON.stringify(writeSet);

              if (!sameProposal) {
                return {
                  success: false,
                  status: AiActionStatus.REJECTED,
                  message:
                    'A chave de idempotência já pertence a outra proposta. Gere uma nova chave para este escopo.',
                };
              }

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
        }, authContext),
      `diex:ai-proposals:${input.workspaceId}`,
      { ttl: 15_000, maxRetries: 100 },
    );
  }

  private async validateCustomActionContract(
    workspaceId: string,
    customObject: NonNullable<ProposeAiActionInput['customObject']>,
  ): Promise<string | null> {
    const objectName = customObject.objectName.trim();

    if (!objectName) {
      return 'A ação adaptativa exige o objeto operacional de destino.';
    }

    if (customObject.operation === 'UPDATE' && !customObject.recordId?.trim()) {
      return 'Uma ação adaptativa de atualização exige o registro de destino.';
    }

    if (customObject.operation === 'CREATE' && customObject.recordId) {
      return 'Uma ação adaptativa de criação não pode apontar para um registro existente.';
    }

    const architecture =
      await this.workspaceArchitectureService.inspectWorkspaceArchitecture(
        workspaceId,
      );
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const normalizedObjectName = normalize(objectName);
    const object = architecture.objects.find(
      ({ nameSingular, namePlural, labelSingular }) =>
        [nameSingular, namePlural, labelSingular].some(
          (candidate) => normalize(candidate) === normalizedObjectName,
        ),
    );

    if (!object) {
      return `O objeto adaptativo ${objectName} não existe neste workspace.`;
    }

    if (CORE_OBJECTS_REQUIRING_NATIVE_ACTION.has(object.nameSingular)) {
      return `O objeto ${object.labelSingular} exige uma ação nativa do Diex e não pode usar o executor adaptativo.`;
    }

    if (!object.isCustom) {
      return `O objeto ${object.labelSingular} é nativo do Diex e exige um executor próprio para preservar suas regras operacionais.`;
    }

    const requestedFields = Object.keys(customObject.fields);
    if (requestedFields.length === 0 || requestedFields.length > 20) {
      return 'A ação adaptativa exige entre 1 e 20 campos explícitos.';
    }

    const sensitiveFieldTokens = [
      'password',
      'token',
      'secret',
      'apikey',
      'credential',
      'authorization',
      'privatekey',
      'qrcode',
      'diagnosis',
      'diagnostico',
      'prescription',
      'prescricao',
      'health',
      'saude',
    ];
    const unknownField = requestedFields.find((fieldName) => {
      const field = object.fields.find(({ name }) => name === fieldName);

      return (
        !field ||
        IMMUTABLE_CUSTOM_FIELD_NAMES.has(field.name) ||
        UNSAFE_CUSTOM_FIELD_TYPES.has(String(field.type)) ||
        sensitiveFieldTokens.some((token) =>
          normalize(`${field.name} ${field.label}`).includes(token),
        )
      );
    });

    return unknownField
      ? `O campo adaptativo ${unknownField} não está publicado ou não é permitido para ações da IA.`
      : null;
  }

  private async getPipelineStageOptions(workspaceId: string) {
    const architecture =
      await this.workspaceArchitectureService.inspectWorkspaceArchitecture(
        workspaceId,
      );
    const opportunityObject = architecture.objects.find(
      ({ nameSingular }) => nameSingular === 'opportunity',
    );
    const stageField = opportunityObject?.fields.find(
      ({ name }) => name === 'stage',
    );
    const workspaceOptions = (stageField?.options ?? [])
      .filter(
        (option) =>
          typeof option.value === 'string' && option.value.trim().length > 0,
      )
      .map((option, index) => ({
        value: option.value.trim(),
        label:
          typeof option.label === 'string' && option.label.trim().length > 0
            ? option.label.trim()
            : option.value.trim(),
        position: typeof option.position === 'number' ? option.position : index,
      }))
      .sort((left, right) => left.position - right.position);

    return workspaceOptions;
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
                  : Array.isArray(action.writeSet) &&
                      action.writeSet.some(
                        (entry) => entry.resourceType === 'CUSTOM_OBJECT',
                      )
                    ? 'CUSTOM_OBJECT'
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
            const delivery =
              action.actionType === AiActionType.REPLY
                ? await this.evolutionSendTextService
                    .reconcileApprovedAiReply({
                      workspaceId: input.workspaceId,
                      aiActionId: action.id,
                    })
                    .catch(() => null)
                : null;

            if (delivery?.status === 'SENT') {
              const receipt = `Resposta externa confirmada pelo recibo da inbox em ${new Date().toISOString()}.`;
              await actionRepository.update(action.id, {
                status: AiActionStatus.EXECUTED,
                executedAt: new Date(),
                executionReceipt: { markdown: receipt, blocknote: null },
                failureReason: null,
              } as never);

              return {
                mode: 'APPLY',
                supported: true,
                executionKind: 'EXTERNAL_REPLY',
                actionId: action.id,
                executed: true,
                alreadyExecuted: false,
                externalMessage: delivery,
                receipt,
                message:
                  'A resposta já havia sido aceita pelo canal e foi reconciliada sem novo envio.',
              };
            }

            if (delivery?.status === 'QUEUED') {
              return {
                mode: 'PREVIEW',
                supported: false,
                actionId: action.id,
                blockedReason: 'provider_receipt_pending',
                message:
                  'O provedor ainda não confirmou a entrega. A ação permanece aguardando reconciliação e não será duplicada.',
              };
            }

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
        const pipelineStageOptions = isPipelineUpdate
          ? await this.getPipelineStageOptions(input.workspaceId)
          : [];
        const targetStageOption = pipelineStageOptions.find(
          ({ value }) => value === targetStage,
        );
        const currentStageOption = pipelineStageOptions.find(
          ({ value }) => value === targetOpportunity?.stage,
        );
        const writeSet = Array.isArray(action.writeSet) ? action.writeSet : [];
        const customWriteSetEntries = writeSet.filter(
          (entry) => entry.resourceType === 'CUSTOM_OBJECT',
        );
        const rawCustomWriteSet = customWriteSetEntries[0];
        const customWriteSet = readCustomWriteSet(rawCustomWriteSet);
        const hasInvalidCustomWriteSet =
          customWriteSetEntries.length > 0 &&
          (customWriteSetEntries.length !== 1 || customWriteSet === undefined);
        const isCustomObjectAction = customWriteSet !== undefined;
        const hasOpportunityScope = writeSet.some(
          (entry) =>
            entry.resourceType === 'OPPORTUNITY' &&
            entry.resourceId === action.opportunityId,
        );

        if (hasInvalidCustomWriteSet) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: 'invalid_custom_write_scope',
            message:
              'O escopo adaptativo foi alterado ou está inválido. Gere uma nova proposta para aprovação.',
          };
        }

        if (customWriteSet && writeSet.length !== 1) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: 'mixed_write_scope',
            message:
              'Uma ação adaptativa não pode misturar alterações nativas no mesmo escopo.',
          };
        }

        if (customWriteSet) {
          const customObjectError = await this.validateCustomActionContract(
            input.workspaceId,
            {
              objectName: customWriteSet.objectName,
              recordId: customWriteSet.resourceId ?? undefined,
              operation: customWriteSet.operation,
              fields: customWriteSet.payload,
            },
          );

          if (customObjectError) {
            return {
              mode: 'PREVIEW',
              supported: false,
              actionId: action.id,
              blockedReason: 'custom_contract_changed',
              message: customObjectError,
            };
          }
        }

        if (action.opportunityId && !hasOpportunityScope && !customWriteSet) {
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
        if (isPipelineUpdate && pipelineStageOptions.length === 0) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: 'pipeline_without_published_stages',
            message:
              'O workspace não possui etapas de pipeline publicadas. Aprove a arquitetura ou configure as etapas antes de executar esta ação.',
          };
        }
        if (
          !isPipelineUpdate &&
          !isExternalReply &&
          !TASK_ACTION_TYPES.has(action.actionType as AiActionType) &&
          !isCustomObjectAction
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
              label: currentStageOption?.label ?? targetOpportunity?.stage,
              position: currentStageOption?.position ?? -1,
            },
            stageOptions: pipelineStageOptions,
            message: 'Escolha a etapa de destino antes de confirmar.',
          };
        }
        if (isPipelineUpdate && !targetStageOption) {
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
                  label: currentStageOption?.label ?? targetOpportunity?.stage,
                  position: currentStageOption?.position ?? -1,
                },
                targetStage: {
                  value: targetStage,
                  label: targetStageOption?.label ?? targetStage,
                  position: targetStageOption?.position ?? -1,
                },
              },
              stageOptions: pipelineStageOptions,
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

          if (customWriteSet) {
            return {
              mode: 'PREVIEW',
              supported: true,
              executionKind: 'CUSTOM_OBJECT',
              actionId: action.id,
              customObject: {
                objectName: customWriteSet.objectName,
                recordId: customWriteSet.resourceId,
                operation: customWriteSet.operation,
                fields: customWriteSet.fields,
              },
              confirmationToken: confirmation.token,
              expiresAt: confirmation.expiresAt,
              message:
                'Prévia da alteração adaptativa gerada. Nenhum registro foi alterado antes da confirmação.',
            };
          }

          return {
            mode: 'PREVIEW',
            supported: true,
            executionKind: 'TASK',
            actionId: action.id,
            task: {
              id: action.executionTaskId ?? null,
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
            message: `A execução está fora da janela operacional da IA (${workspacePolicy.operatingWindow.start}-${workspacePolicy.operatingWindow.end}, ${workspacePolicy.operatingWindow.timezone}). A ação continua aprovada para a próxima janela.`,
          };
        }

        if (isExternalReply && !input.workspaceMemberId) {
          throw new BadRequestException(
            'A resposta externa exige um membro autenticado do workspace.',
          );
        }

        const quotaReservation = await this.cacheLockService.withLock(
          async () => {
            const executionWindowStart = new Date(
              Date.now() -
                (isExternalReply ? DAY_MS : AI_ACTION_EXECUTION_WINDOW_MS),
            );
            const actionTypeFilter = isExternalReply
              ? { actionType: AiActionType.REPLY }
              : {};
            const recentExecutionCount = await actionRepository.count({
              where: [
                {
                  ...actionTypeFilter,
                  status: AiActionStatus.EXECUTING,
                  executionStartedAt: MoreThan(executionWindowStart),
                },
                {
                  ...actionTypeFilter,
                  status: AiActionStatus.EXECUTED,
                  executedAt: MoreThan(executionWindowStart),
                },
              ] as never,
            });
            const executionLimit = isExternalReply
              ? workspacePolicy.limits.maxExternalMessagesPerDay
              : policy.maxExecutionsPerHour;

            if (recentExecutionCount >= executionLimit) {
              return { allowed: false as const, claimResult: null };
            }

            const claimResult = await actionRepository.update(
              { id: action.id, status: AiActionStatus.APPROVED } as never,
              {
                status: AiActionStatus.EXECUTING,
                executionStartedAt: new Date(),
                attemptCount: (action.attemptCount ?? 0) + 1,
              } as never,
            );

            return { allowed: true as const, claimResult };
          },
          `diex:ai-executions:${input.workspaceId}:${isExternalReply ? 'external-day' : 'internal-hour'}`,
          { ttl: 15_000, maxRetries: 100 },
        );

        if (!quotaReservation.allowed) {
          return {
            mode: 'PREVIEW',
            supported: false,
            actionId: action.id,
            blockedReason: isExternalReply
              ? 'external_message_daily_limit'
              : 'execution_rate_limit',
            message: isExternalReply
              ? 'O limite diário de mensagens externas foi atingido. A ação continua aprovada e será reavaliada no próximo período.'
              : 'O limite horário de execuções da IA foi atingido. A ação continua aprovada e será reavaliada na próxima janela.',
          };
        }

        if (quotaReservation.claimResult?.affected !== 1) {
          throw new BadRequestException(
            'Esta ação já foi assumida por outro executor ou deixou de estar aprovada.',
          );
        }

        let task: TaskWorkspaceEntity | null = null;
        let pipelineChange: Record<string, unknown> | null = null;
        let externalMessage: Record<string, unknown> | null = null;
        let customObjectChange: Record<string, unknown> | null = null;

        try {
          if (isExternalReply) {
            const sendResult =
              await this.evolutionSendTextService.sendApprovedAiReply({
                workspaceId: input.workspaceId,
                workspaceMemberId: input.workspaceMemberId ?? '',
                conversationId:
                  action.inboxConversationId ??
                  action.inboxConversation?.id ??
                  '',
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
            const sourceStageOption = pipelineStageOptions.find(
              ({ value }) => value === sourceStage,
            );
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
                label: sourceStageOption?.label ?? sourceStage,
                position: sourceStageOption?.position ?? -1,
              },
              targetStage: {
                value: targetStage,
                label: targetStageOption?.label ?? targetStage,
                position: targetStageOption?.position ?? -1,
              },
            };
          } else if (customWriteSet) {
            const customResult =
              customWriteSet.operation === 'UPDATE'
                ? await this.updateRecordService.execute({
                    objectName: customWriteSet.objectName,
                    objectRecordId: customWriteSet.resourceId ?? '',
                    objectRecord: customWriteSet.payload,
                    fieldsToUpdate: customWriteSet.fields,
                    authContext,
                    slimResponse: true,
                  })
                : await this.createRecordService.execute({
                    objectName: customWriteSet.objectName,
                    objectRecord: customWriteSet.payload,
                    authContext,
                    slimResponse: true,
                  });

            if (!customResult.success) {
              throw new BadRequestException(
                customResult.error ??
                  `Não foi possível executar a ação no objeto ${customWriteSet.objectName}.`,
              );
            }

            customObjectChange = {
              objectName: customWriteSet.objectName,
              recordId:
                customWriteSet.resourceId ??
                (customResult.result as { id?: string } | undefined)?.id ??
                null,
              operation: customWriteSet.operation,
              fields: customWriteSet.fields,
              result: customResult.result ?? null,
            };
          } else {
            const taskRepository =
              await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
                input.workspaceId,
                'task',
              );
            const taskLegacyDiexId = `DIEX_AI_ACTION_TASK:${action.id}`;
            task = action.executionTaskId
              ? await taskRepository.findOne({
                  where: { id: action.executionTaskId },
                })
              : null;
            task ??= await taskRepository.findOne({
              where: { legacyDiexId: taskLegacyDiexId },
            });
            if (!task) {
              await taskRepository.upsert(
                {
                  legacyDiexId: taskLegacyDiexId,
                  title: action.name ?? 'Ação de IA',
                  bodyV2: { markdown: proposedAction, blocknote: null },
                  dueAt: new Date(Date.now() + DAY_MS),
                  status: 'TODO',
                  assigneeId: action.reviewerId,
                  diexSuccessPlanId: action.successPlanId,
                  diexInboxConversationId: action.inboxConversationId,
                } as never,
                ['legacyDiexId'],
              );
              task = await taskRepository.findOne({
                where: { legacyDiexId: taskLegacyDiexId },
              });
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

          const customOperationLabel = customWriteSet
            ? `Registro de ${customWriteSet.objectName} ${customWriteSet.operation === 'CREATE' ? 'criado' : 'atualizado'}`
            : null;
          const receipt = `${isExternalReply ? 'Resposta de WhatsApp enviada' : isPipelineUpdate ? 'Pipeline atualizado' : (customOperationLabel ?? 'Tarefa criada')} em ${new Date().toISOString()} por aprovação humana. Contexto operacional: ${action.contextVersion ?? 'não informado'}.`;
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
                : customWriteSet
                  ? 'CUSTOM_OBJECT'
                  : 'TASK',
            actionId: action.id,
            executed: true,
            alreadyExecuted: false,
            task,
            pipelineChange,
            externalMessage,
            customObjectChange,
            receipt,
            contextVersion: action.contextVersion ?? null,
            message: isExternalReply
              ? 'Resposta enviada pelo WhatsApp e execução registrada na trilha de governança.'
              : isPipelineUpdate
                ? 'Etapa da oportunidade atualizada e execução registrada.'
                : customWriteSet
                  ? `Registro adaptativo ${customWriteSet.operation === 'CREATE' ? 'criado' : 'atualizado'} e execução registrada na trilha de governança.`
                  : 'Tarefa criada e execução registrada na trilha de governança.',
          };
        } catch (error) {
          const failureMessage =
            error instanceof Error
              ? error.message
              : 'Falha desconhecida durante a execução.';

          if (isExternalReply) {
            const delivery = await this.evolutionSendTextService
              .reconcileApprovedAiReply({
                workspaceId: input.workspaceId,
                aiActionId: action.id,
              })
              .catch(() => null);

            if (delivery?.status === 'SENT') {
              const receipt = `Resposta externa confirmada pelo recibo da inbox em ${new Date().toISOString()}.`;

              await actionRepository.update(action.id, {
                status: AiActionStatus.EXECUTED,
                executedAt: new Date(),
                executionReceipt: { markdown: receipt, blocknote: null },
                failureReason: null,
              } as never);

              return {
                mode: 'APPLY',
                supported: true,
                executionKind: 'EXTERNAL_REPLY',
                actionId: action.id,
                executed: true,
                alreadyExecuted: false,
                externalMessage: delivery,
                receipt,
                message:
                  'A resposta foi confirmada pela inbox e registrada sem novo envio.',
              };
            }

            if (delivery?.status === 'QUEUED') {
              await actionRepository.update(action.id, {
                failureReason: {
                  markdown: failureMessage,
                  blocknote: null,
                },
                executionReceipt: {
                  markdown: `Entrega externa aguardando confirmação desde ${new Date().toISOString()}.`,
                  blocknote: null,
                },
              } as never);

              return {
                mode: 'PREVIEW',
                supported: false,
                actionId: action.id,
                executed: false,
                blockedReason: 'provider_receipt_pending',
                message:
                  'O envio permanece aguardando confirmação do WhatsApp. Nenhuma mensagem duplicada será iniciada.',
              };
            }
          }

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
