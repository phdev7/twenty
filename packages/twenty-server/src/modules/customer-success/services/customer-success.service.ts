import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { In, Not } from 'typeorm';

import {
  AiActionStatus,
  AiActionType,
} from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';
import { AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import {
  CommercialSignalStatus,
  CommercialSignalType,
} from 'src/modules/commercial-intelligence/standard-objects/commercial-signal.standard-object-definition';
import { CommercialSignalWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/commercial-signal.workspace-entity';
import {
  assessCustomerHealth,
  type CustomerHealthInput,
  type CustomerHealthResult,
} from 'src/modules/customer-success/tools/assess-customer-health.tool';
import { SuccessMilestoneWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-milestone.workspace-entity';
import { SuccessPlanWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-plan.workspace-entity';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import {
  issueConfirmationToken,
  verifyConfirmationToken,
} from 'src/modules/diex/utils/confirmation-token.util';

const DAY_MS = 86_400_000;
const readMarkdown = (
  value: { markdown?: string | null } | null,
): string | null => value?.markdown?.trim() || null;

const daysSince = (
  value: Date | string | null | undefined,
): number | undefined => {
  if (!value) return undefined;
  const timestamp = Date.parse(String(value));

  return Number.isFinite(timestamp)
    ? Math.max(0, Math.floor((Date.now() - timestamp) / DAY_MS))
    : undefined;
};

const daysUntil = (
  value: Date | string | null | undefined,
): number | undefined => {
  if (!value) return undefined;
  const timestamp = Date.parse(String(value));

  return Number.isFinite(timestamp)
    ? Math.ceil((timestamp - Date.now()) / DAY_MS)
    : undefined;
};

const ratingToNumber = (
  value: string | null | undefined,
): number | undefined => {
  const match = value?.match(/^RATING_([1-5])$/);

  return match ? Number(match[1]) : undefined;
};

const readName = (value: unknown): string | null => {
  if (typeof value === 'string') return value.trim() || null;
  const name = value as {
    firstName?: string | null;
    lastName?: string | null;
  } | null;

  return (
    [name?.firstName, name?.lastName].filter(Boolean).join(' ').trim() || null
  );
};

const toDate = (value: string, field: string): Date => {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} deve ser uma data ISO válida.`);
  }

  return date;
};

export type CustomerSuccessReviewOptions = {
  workspaceId: string;
  successPlanId: string;
  updateSuccessPlan: boolean;
  proposeAction: boolean;
};

export type CustomerSuccessReviewResult = {
  successPlanId: string;
  health: CustomerHealthResult;
  summary: string;
  riskLevel: CustomerHealthResult['health'];
  confidence: number;
  facts: string;
  gaps: string;
  intervention: string;
  nextReviewAt: string;
  successPlanUpdated: boolean;
  aiActionId?: string;
  message: string;
};

export type CustomerSuccessHandoffInput = {
  workspaceId: string;
  opportunityId: string;
  ownerId: string;
  renewalDate: string;
  recurringRevenueMicros: number;
  currencyCode: string;
  objectives: string;
  successCriteria: string;
  previewOnly: boolean;
  confirmCreate: boolean;
  confirmationToken?: string;
};

export type CustomerSuccessMilestoneInput = {
  workspaceId: string;
  milestoneId: string;
  action: 'START' | 'BLOCK' | 'COMPLETE';
  outcome: string;
  evidence: string;
  impact: string;
  previewOnly: boolean;
  confirmUpdate: boolean;
  confirmationToken?: string;
};

@Injectable()
export class CustomerSuccessService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async review(
    options: CustomerSuccessReviewOptions,
  ): Promise<CustomerSuccessReviewResult> {
    const authContext = buildSystemAuthContext(options.workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const planRepository =
          await this.globalWorkspaceOrmManager.getRepository<SuccessPlanWorkspaceEntity>(
            options.workspaceId,
            SuccessPlanWorkspaceEntity,
          );
        const plan = await planRepository.findOne({
          where: { id: options.successPlanId },
          relations: {
            milestones: true,
            company: true,
            opportunity: true,
            owner: true,
          },
        });

        if (!plan) {
          throw new NotFoundException('O plano de sucesso não foi encontrado.');
        }

        const milestoneRepository =
          await this.globalWorkspaceOrmManager.getRepository<SuccessMilestoneWorkspaceEntity>(
            options.workspaceId,
            SuccessMilestoneWorkspaceEntity,
          );
        const milestones = await milestoneRepository.find({
          where: { successPlanId: plan.id },
          order: { dueAt: 'ASC' },
        });
        const signalRepository =
          await this.globalWorkspaceOrmManager.getRepository<CommercialSignalWorkspaceEntity>(
            options.workspaceId,
            CommercialSignalWorkspaceEntity,
          );
        const signals = plan.companyId
          ? await signalRepository.find({
              where: {
                companyId: plan.companyId,
                status: Not(
                  In([
                    CommercialSignalStatus.ACTIONED,
                    CommercialSignalStatus.DISMISSED,
                  ]),
                ),
              },
              order: { capturedAt: 'DESC' },
              take: 100,
            })
          : [];
        const conversationRepository =
          await this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
            options.workspaceId,
            'inboxConversation',
          );
        const conversations = plan.companyId
          ? await conversationRepository.find({
              where: { companyId: plan.companyId },
              order: { lastMessageAt: 'DESC' },
              take: 20,
            })
          : [];

        const activeSignals = signals.filter(
          (signal) =>
            signal.signalType !== CommercialSignalType.ENGAGEMENT &&
            signal.strength !== 'RATING_1',
        );
        const lastConversation = conversations[0];
        const health = assessCustomerHealth({
          onboardingCompleted: plan.lifecycle === 'ONBOARDING' ? false : true,
          activeUseRating: ratingToNumber(plan.activeUseRating),
          valueEvidenceRating: ratingToNumber(plan.valueEvidenceRating),
          daysSinceLastMeaningfulContact: daysSince(
            lastConversation?.lastMessageAt,
          ),
          daysUntilRenewal: daysUntil(plan.renewalDate),
          openBlockedMilestones: milestones.filter(
            (item) => item.status === 'BLOCKED',
          ).length,
          unresolvedCriticalSignals: activeSignals.filter(
            (signal) =>
              signal.signalType === CommercialSignalType.RISK ||
              signal.signalType === CommercialSignalType.CHURN_RISK,
          ).length,
          expansionSignal: plan.expansionSignal ?? undefined,
        });
        const generatedAt = new Date();
        const nextReviewAt = new Date(
          generatedAt.getTime() + 30 * DAY_MS,
        ).toISOString();
        const facts = [
          `Plano: ${plan.name ?? plan.id}.`,
          `Marcos bloqueados: ${milestones.filter((item) => item.status === 'BLOCKED').length}.`,
          `Sinais ativos: ${activeSignals.length}.`,
          lastConversation?.lastMessageAt
            ? `Último contato: ${lastConversation.lastMessageAt}.`
            : 'Não há contato recente registrado.',
        ].join(' ');
        const gaps =
          health.gaps.length > 0
            ? health.gaps.join('; ')
            : 'Nenhuma lacuna estrutural detectada.';
        const intervention =
          health.riskReasons.length > 0
            ? health.riskReasons.join('; ')
            : health.recommendation;
        let aiActionId: string | undefined;
        let successPlanUpdated = false;

        if (options.updateSuccessPlan) {
          await planRepository.update(plan.id, {
            health: health.health,
            healthScore: health.score,
            nextReviewAt: new Date(nextReviewAt),
            executiveSummary: { markdown: facts, blocknote: null },
            risks: { markdown: intervention, blocknote: null },
          } as never);
          successPlanUpdated = true;
        }

        if (
          options.proposeAction &&
          (health.health === 'CRITICAL' || health.health === 'ATTENTION')
        ) {
          const actionRepository =
            await this.globalWorkspaceOrmManager.getRepository<AiActionWorkspaceEntity>(
              options.workspaceId,
              AiActionWorkspaceEntity,
            );
          const idempotencyKey = `diex:customer-success-review:${plan.id}:${generatedAt.toISOString().slice(0, 10)}`;
          const existing = await actionRepository.findOne({
            where: { idempotencyKey },
          });

          if (existing) {
            aiActionId = existing.id;
          } else {
            const action = actionRepository.create({
              name: `Intervenção de CS — ${plan.name ?? plan.id}`,
              actionType: AiActionType.CS_INTERVENTION,
              status: AiActionStatus.PENDING_APPROVAL,
              confidence: health.completeness,
              rationale: { markdown: facts, blocknote: null },
              proposedAction: {
                markdown: health.recommendation,
                blocknote: null,
              },
              requestedAt: generatedAt,
              requiresApproval: true,
              idempotencyKey,
              successPlanId: plan.id,
            } as never);
            const saved = (await actionRepository.save(
              action as unknown as AiActionWorkspaceEntity,
            )) as unknown as AiActionWorkspaceEntity;
            aiActionId = saved.id;
          }
        }

        return {
          successPlanId: plan.id,
          health,
          summary: `${health.health}: ${health.score}/100. ${health.recommendation}`,
          riskLevel: health.health,
          confidence: health.completeness,
          facts,
          gaps,
          intervention,
          nextReviewAt,
          successPlanUpdated,
          ...(aiActionId ? { aiActionId } : {}),
          message: options.updateSuccessPlan
            ? aiActionId
              ? 'Saúde atualizada e proposta enviada para aprovação humana.'
              : 'Saúde e próxima revisão atualizadas sem efeito externo.'
            : 'Prévia concluída sem alterar o plano.',
        };
      },
      authContext,
    );
  }

  async handoff(
    input: CustomerSuccessHandoffInput,
  ): Promise<Record<string, unknown>> {
    const authContext = buildSystemAuthContext(input.workspaceId);
    const opportunityId = input.opportunityId.trim();

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const opportunityRepository =
          await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
            input.workspaceId,
            OpportunityWorkspaceEntity,
          );
        const opportunity = await opportunityRepository.findOne({
          where: { id: opportunityId },
          relations: { company: true, pointOfContact: true, diexOffer: true },
        });

        if (!opportunity) {
          throw new NotFoundException('A oportunidade não foi encontrada.');
        }
        if (!opportunity.companyId) {
          return {
            mode: 'PREVIEW',
            supported: false,
            opportunityId,
            blockedReason:
              'Vincule uma empresa à oportunidade antes de iniciar o handoff.',
            message: 'Handoff bloqueado: oportunidade sem empresa.',
          };
        }

        const planRepository =
          await this.globalWorkspaceOrmManager.getRepository<SuccessPlanWorkspaceEntity>(
            input.workspaceId,
            SuccessPlanWorkspaceEntity,
          );
        const existingPlan = await planRepository.findOne({
          where: { opportunityId },
        });
        const renewalDate = toDate(input.renewalDate, 'renewalDate');
        const recurringRevenueMicros = Number.isFinite(
          input.recurringRevenueMicros,
        )
          ? Math.max(0, Math.round(input.recurringRevenueMicros))
          : 0;
        const planId = existingPlan?.id ?? `diex-success-plan:${opportunityId}`;
        const fingerprint = `${opportunityId}:${input.ownerId}:${renewalDate.toISOString()}:${recurringRevenueMicros}:${input.objectives}:${input.successCriteria}`;
        const confirmation = issueConfirmationToken({
          workspaceId: input.workspaceId,
          scope: 'handoff',
          fingerprint,
        });
        const startDate = new Date().toISOString();
        const nextReviewAt = new Date(Date.now() + 7 * DAY_MS).toISOString();
        const milestoneDefinitions = [
          {
            key: 'onboarding',
            name: 'Onboarding e plano de sucesso',
            category: 'ONBOARDING',
            days: 14,
          },
          {
            key: 'value',
            name: 'Primeira evidência de valor',
            category: 'VALUE',
            days: 30,
          },
          {
            key: 'adoption',
            name: 'Adoção operacional validada',
            category: 'ADOPTION',
            days: 45,
          },
        ];
        const preview = {
          opportunity: {
            id: opportunity.id,
            name: opportunity.name,
            companyId: opportunity.companyId,
            companyName:
              readName(opportunity.company?.name) ?? opportunity.companyId,
            ...(opportunity.pointOfContactId
              ? { contactId: opportunity.pointOfContactId }
              : {}),
            ...(readName(opportunity.pointOfContact?.name)
              ? { contactName: readName(opportunity.pointOfContact?.name) }
              : {}),
            ...(opportunity.diexOffer?.name
              ? { offerName: opportunity.diexOffer.name }
              : {}),
          },
          plan: {
            id: planId,
            name: `Plano de sucesso — ${opportunity.name}`,
            owner: { id: input.ownerId },
            startDate,
            renewalDate: renewalDate.toISOString(),
            nextReviewAt,
            recurringRevenueMicros,
            currencyCode: input.currencyCode.trim() || 'BRL',
            objectives: input.objectives.trim(),
            successCriteria: input.successCriteria.trim(),
          },
          milestones: milestoneDefinitions.map((milestone) => ({
            id: `diex-customer-success-milestone:${opportunity.id}:${milestone.key}`,
            name: milestone.name,
            category: milestone.category,
            dueAt: new Date(Date.now() + milestone.days * DAY_MS).toISOString(),
          })),
          task: {
            id: `diex-customer-success-handoff-task:${opportunity.id}`,
            title: `Kickoff de Customer Success — ${opportunity.name}`,
            dueAt: nextReviewAt,
            assignee: { id: input.ownerId },
          },
          warnings: [
            ...(existingPlan
              ? [
                  'Já existe um plano para esta oportunidade; a confirmação atualizará o mesmo registro.',
                ]
              : []),
            ...(opportunity.stage !== 'CUSTOMER'
              ? ['A oportunidade ainda não está na etapa CUSTOMER.']
              : []),
          ],
        };

        if (input.previewOnly || !input.confirmCreate) {
          return {
            mode: 'PREVIEW',
            supported: true,
            opportunityId,
            preview,
            confirmationToken: confirmation.token,
            expiresAt: confirmation.expiresAt,
            message: 'Prévia do handoff gerada sem criar registros.',
          };
        }

        if (
          !verifyConfirmationToken({
            token: input.confirmationToken,
            workspaceId: input.workspaceId,
            scope: 'handoff',
            fingerprint,
          })
        ) {
          throw new BadRequestException(
            'Token de confirmação do handoff inválido ou expirado. Gere uma nova prévia.',
          );
        }

        const plan = (existingPlan ??
          planRepository.create({
            id: planId,
          } as never)) as SuccessPlanWorkspaceEntity;
        Object.assign(plan, {
          name: preview.plan.name,
          lifecycle: 'ONBOARDING',
          health: 'UNKNOWN',
          healthScore: 0,
          recurringRevenue: {
            amountMicros: recurringRevenueMicros,
            currencyCode: preview.plan.currencyCode,
          },
          startDate: new Date(startDate),
          renewalDate,
          nextReviewAt: new Date(nextReviewAt),
          objectives: { markdown: preview.plan.objectives, blocknote: null },
          successCriteria: {
            markdown: preview.plan.successCriteria,
            blocknote: null,
          },
          companyId: opportunity.companyId,
          primaryContactId: opportunity.pointOfContactId,
          opportunityId,
          ownerId: input.ownerId,
        });
        const savedPlan = (await planRepository.save(
          plan as SuccessPlanWorkspaceEntity,
        )) as SuccessPlanWorkspaceEntity;
        const milestoneRepository =
          await this.globalWorkspaceOrmManager.getRepository<SuccessMilestoneWorkspaceEntity>(
            input.workspaceId,
            SuccessMilestoneWorkspaceEntity,
          );
        let milestonesCreated = 0;
        for (const milestone of preview.milestones) {
          const existing = await milestoneRepository.findOne({
            where: { id: milestone.id },
          });
          if (existing) continue;
          await milestoneRepository.save(
            milestoneRepository.create({
              id: milestone.id,
              name: milestone.name,
              category: milestone.category,
              status: 'PLANNED',
              dueAt: new Date(milestone.dueAt),
              successPlanId: savedPlan.id,
            } as never),
          );
          milestonesCreated += 1;
        }
        const taskRepository =
          await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
            input.workspaceId,
            'task',
          );
        const taskId = preview.task.id;
        const existingTask = await taskRepository.findOne({
          where: { id: taskId },
        });
        if (!existingTask) {
          await taskRepository.save(
            taskRepository.create({
              id: taskId,
              title: preview.task.title,
              status: 'TODO',
              dueAt: new Date(preview.task.dueAt),
              assigneeId: input.ownerId,
              diexSuccessPlanId: savedPlan.id,
            } as never),
          );
        }

        return {
          mode: 'APPLY',
          supported: true,
          opportunityId,
          created: true,
          alreadyCreated: Boolean(existingPlan),
          successPlanId: savedPlan.id,
          taskId,
          milestonesCreated,
          milestonesExpected: preview.milestones.length,
          warnings: preview.warnings,
          receipt: `Handoff confirmado em ${new Date().toISOString()}.`,
          message: existingPlan
            ? 'Plano de sucesso existente atualizado e handoff reconciliado.'
            : 'Plano de sucesso criado e handoff comercial registrado.',
        };
      },
      authContext,
    );
  }

  async updateMilestone(
    input: CustomerSuccessMilestoneInput,
  ): Promise<Record<string, unknown>> {
    const authContext = buildSystemAuthContext(input.workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const milestoneRepository =
          await this.globalWorkspaceOrmManager.getRepository<SuccessMilestoneWorkspaceEntity>(
            input.workspaceId,
            SuccessMilestoneWorkspaceEntity,
          );
        const milestone = await milestoneRepository.findOne({
          where: { id: input.milestoneId },
          relations: { successPlan: true },
        });

        if (!milestone || !milestone.successPlanId || !milestone.successPlan) {
          throw new NotFoundException('O marco de sucesso não foi encontrado.');
        }
        if (!['START', 'BLOCK', 'COMPLETE'].includes(input.action)) {
          throw new BadRequestException('Ação de marco inválida.');
        }

        const previousStatus = milestone.status ?? 'PLANNED';
        const nextStatus =
          input.action === 'START'
            ? 'IN_PROGRESS'
            : input.action === 'BLOCK'
              ? 'BLOCKED'
              : 'COMPLETED';
        const generatedAt = new Date();
        const fingerprint = `${milestone.id}:${previousStatus}:${nextStatus}:${input.outcome}:${input.evidence}:${input.impact}`;
        const confirmation = issueConfirmationToken({
          workspaceId: input.workspaceId,
          scope: 'milestone',
          fingerprint,
        });
        const plan = milestone.successPlan;
        const nextHealth =
          nextStatus === 'BLOCKED' ? 'CRITICAL' : (plan.health ?? 'UNKNOWN');
        const preview = {
          generatedAt: generatedAt.toISOString(),
          milestone: {
            id: milestone.id,
            name: milestone.name ?? 'Marco sem nome',
            category: milestone.category ?? undefined,
            dueAt: milestone.dueAt?.toISOString(),
            previousStatus,
            nextStatus,
            ...(input.outcome.trim() ? { outcome: input.outcome.trim() } : {}),
            ...(input.evidence.trim()
              ? { evidence: input.evidence.trim() }
              : {}),
            ...(input.impact.trim() ? { impact: input.impact.trim() } : {}),
            ...(nextStatus === 'COMPLETED'
              ? { completedAt: generatedAt.toISOString() }
              : {}),
          },
          successPlan: {
            id: plan.id,
            name: plan.name,
            previousLifecycle: plan.lifecycle ?? undefined,
            nextLifecycle:
              nextStatus === 'COMPLETED'
                ? 'VALUE_DELIVERY'
                : (plan.lifecycle ?? undefined),
            previousHealth: plan.health ?? undefined,
            nextHealth,
            nextReviewAt:
              plan.nextReviewAt?.toISOString() ??
              new Date(Date.now() + 30 * DAY_MS).toISOString(),
            ...(nextStatus === 'BLOCKED'
              ? {
                  risks:
                    readMarkdown(plan.risks) ??
                    `Marco bloqueado: ${milestone.name ?? milestone.id}.`,
                }
              : {}),
            ...(input.evidence.trim()
              ? { valueEvidenceRating: plan.valueEvidenceRating ?? undefined }
              : {}),
            ...(plan.expansionSignal !== null &&
            plan.expansionSignal !== undefined
              ? { expansionSignal: plan.expansionSignal }
              : {}),
          },
          effects: [
            `Atualizar o marco para ${nextStatus}.`,
            ...(nextStatus === 'BLOCKED'
              ? ['Registrar o risco no plano de sucesso.']
              : []),
            ...(nextStatus === 'COMPLETED'
              ? ['Registrar a data de conclusão.']
              : []),
          ],
          warnings: input.evidence.trim()
            ? []
            : ['Nenhuma evidência foi informada.'],
        };

        if (input.previewOnly || !input.confirmUpdate) {
          return {
            mode: 'PREVIEW',
            supported: true,
            milestoneId: input.milestoneId,
            preview,
            confirmationToken: confirmation.token,
            expiresAt: confirmation.expiresAt,
            message: 'Prévia do marco gerada sem alterar registros.',
          };
        }
        if (
          !verifyConfirmationToken({
            token: input.confirmationToken,
            workspaceId: input.workspaceId,
            scope: 'milestone',
            fingerprint,
          })
        ) {
          throw new BadRequestException(
            'Token de confirmação do marco inválido ou expirado. Gere uma nova prévia.',
          );
        }

        await milestoneRepository.update(milestone.id, {
          status: nextStatus,
          completedAt: nextStatus === 'COMPLETED' ? generatedAt : null,
          ...(input.outcome.trim()
            ? { outcome: { markdown: input.outcome.trim(), blocknote: null } }
            : {}),
          ...(input.evidence.trim()
            ? { evidence: { markdown: input.evidence.trim(), blocknote: null } }
            : {}),
          ...(input.impact.trim() ? { impact: input.impact.trim() } : {}),
        } as never);
        if (nextStatus === 'BLOCKED' || nextStatus === 'COMPLETED') {
          const planRepository =
            await this.globalWorkspaceOrmManager.getRepository<SuccessPlanWorkspaceEntity>(
              input.workspaceId,
              SuccessPlanWorkspaceEntity,
            );
          await planRepository.update(plan.id, {
            health: nextHealth,
            healthScore: nextStatus === 'BLOCKED' ? 0 : plan.healthScore,
            lifecycle: preview.successPlan.nextLifecycle,
            risks: preview.successPlan.risks
              ? { markdown: preview.successPlan.risks, blocknote: null }
              : undefined,
          } as never);
        }

        return {
          mode: 'APPLY',
          supported: true,
          milestoneId: input.milestoneId,
          successPlanId: plan.id,
          milestoneUpdated: true,
          warnings: preview.warnings,
          receipt: `Marco atualizado em ${generatedAt.toISOString()}.`,
          message: 'Marco de sucesso atualizado e plano sincronizado.',
        };
      },
      authContext,
    );
  }

  async assess(input: CustomerHealthInput): Promise<CustomerHealthResult> {
    return assessCustomerHealth(input);
  }
}
