import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'node:crypto';

import {
  AiActionStatus,
  AiActionType,
} from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';
import { AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

const DAY_MS = 86_400_000;

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

const tokenFor = (
  workspaceId: string,
  actionId: string,
  fingerprint: string,
): string =>
  createHash('sha256')
    .update(`${workspaceId}:ai-action:${actionId}:${fingerprint}`)
    .digest('hex');

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
};

export type ProposeAiActionResult = {
  success: boolean;
  aiActionId?: string;
  status: AiActionStatus;
  message: string;
};

export type ExecuteAiActionInput = {
  workspaceId: string;
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
  ) {}

  async propose(input: ProposeAiActionInput): Promise<ProposeAiActionResult> {
    const name = input.name.trim();
    const rationale = input.rationale.trim();
    const proposedAction = input.proposedAction.trim();

    if (!name || !rationale || !proposedAction) {
      return {
        success: false,
        status: AiActionStatus.DRAFT,
        message:
          'Título, justificativa e ação proposta são obrigatórios para criar uma ação revisável.',
      };
    }

    const authContext = buildSystemAuthContext(input.workspaceId);

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
          requiresApproval: true,
          opportunityId: input.opportunityId?.trim() || undefined,
          commercialSignalId: input.commercialSignalId?.trim() || undefined,
          successPlanId: input.successPlanId?.trim() || undefined,
          reviewerId: input.reviewerId?.trim() || undefined,
          inboxConversationId: input.inboxConversationId?.trim() || undefined,
          idempotencyKey,
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
              action.actionType === AiActionType.PIPELINE_UPDATE
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
        if (action.status !== AiActionStatus.APPROVED) {
          throw new BadRequestException(
            'Somente ações aprovadas podem ser executadas.',
          );
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

        const fingerprint = `${action.status}:${targetStage}:${proposedAction}`;
        const confirmationToken = tokenFor(
          input.workspaceId,
          action.id,
          fingerprint,
        );
        const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();

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
              confirmationToken,
              expiresAt,
              message:
                'Prévia de atualização do pipeline gerada sem alterar o CRM.',
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
            confirmationToken,
            expiresAt,
            message: 'Prévia da tarefa gerada sem alterar o CRM.',
          };
        }

        if (input.confirmationToken !== confirmationToken) {
          throw new BadRequestException(
            'Token de confirmação inválido ou expirado. Gere uma nova prévia.',
          );
        }

        let task: TaskWorkspaceEntity | null = null;
        let pipelineChange: Record<string, unknown> | null = null;
        if (isPipelineUpdate && targetOpportunity) {
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

        const receipt = `${isPipelineUpdate ? 'Pipeline atualizado' : 'Tarefa criada'} em ${new Date().toISOString()} por aprovação humana.`;
        await actionRepository.update(action.id, {
          status: AiActionStatus.EXECUTED,
          executedAt: new Date(),
          executionReceipt: { markdown: receipt, blocknote: null },
        } as never);

        return {
          mode: 'APPLY',
          supported: true,
          executionKind: isPipelineUpdate ? 'PIPELINE_UPDATE' : 'TASK',
          actionId: action.id,
          executed: true,
          alreadyExecuted: false,
          task,
          pipelineChange,
          receipt,
          message: isPipelineUpdate
            ? 'Etapa da oportunidade atualizada e execução registrada.'
            : 'Tarefa criada e execução registrada na trilha de governança.',
        };
      },
      authContext,
    );
  }
}
