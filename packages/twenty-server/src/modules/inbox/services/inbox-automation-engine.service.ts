import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { QueryFailedError } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { FieldActorSource } from 'twenty-shared/types';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { InboxAutomationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-automation.workspace-entity';
import { InboxConversationEventWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation-event.workspace-entity';
import { InboxConversationLabelWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation-label.workspace-entity';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { InboxLabelWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-label.workspace-entity';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import {
  type ExecuteInboxAutomationsResult,
  type InboxAutomationTriggerValue,
} from 'src/modules/inbox/types/inbox-automation.types';

// Ported from the legacy Diex inbox automation contract. The original ran
// against a GraphQL client from an app sandbox; this version runs the same
// decision/action logic directly against the workspace ORM. Business behavior
// is preserved intentionally, including the per-rule idempotency claim through
// the InboxConversationEvent unique name.

type ConversationSnapshot = {
  id: string;
  name: string;
  channel: string;
  status: string;
  priority: string;
  contactHandle: string | null;
  unreadCount: number | null;
  firstResponseDueAt: string | null;
  firstRespondedAt: string | null;
  followUpDueAt: string | null;
  assigneeId: string | null;
  inboxTeamId: string | null;
  personId: string | null;
  personName: string;
  companyId: string | null;
  companyName: string;
  opportunityId: string | null;
  opportunityName: string;
};

type TeamMembership = {
  id: string;
  memberRole: string | null;
  workspaceMemberId: string;
};

type Team = {
  id: string;
  name: string;
  status: string;
  routingStrategy: string;
  defaultResponseSlaMinutes: number | null;
  memberships: TeamMembership[];
};

type Label = {
  id: string;
  name: string;
  status: string;
  usageCount: number | null;
};

type AutomationRule = {
  id: string;
  name: string;
  channel: string;
  keywords: string | null;
  crmCondition: string;
  onlyIfUnassigned: boolean;
  targetConversationStatus: string;
  targetPriority: string;
  followUpDelayMinutes: number | null;
  taskTitleTemplate: string | null;
  taskDueDelayMinutes: number | null;
  internalNoteTemplate: string | null;
  stopAfterMatch: boolean;
  runCount: number | null;
  inboxLabel: Label | null;
  inboxTeam: Team | null;
  assigneeId: string | null;
};

type RenderResult = {
  text: string;
  unresolvedVariables: string[];
};

export type EvaluateInboxAutomationsInput = {
  workspaceId: string;
  conversationId: string;
  trigger: InboxAutomationTriggerValue;
  triggerKey: string;
  messageBody: string;
  occurredAt?: string;
};

const TEMPLATE_VARIABLE_PATTERN =
  /{{\s*([a-zA-Z0-9_.]+)(?:\s*\|\|\s*(['"])(.*?)\2)?\s*}}/g;

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

const stableHash = (value: string): string => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
};

const readPositiveMinutes = (
  value: number | null | undefined,
  fallback = 0,
): number => {
  const candidate =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  return candidate > 0 ? Math.min(Math.round(candidate), 2 * 365 * 24 * 60) : 0;
};

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error as unknown as { code?: string }).code === '23505';

@Injectable()
export class InboxAutomationEngineService {
  private readonly logger = new Logger(InboxAutomationEngineService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async evaluateInboxAutomations({
    workspaceId,
    conversationId,
    trigger,
    triggerKey,
    messageBody,
    occurredAt = new Date().toISOString(),
  }: EvaluateInboxAutomationsInput): Promise<ExecuteInboxAutomationsResult> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.runEvaluation({
          workspaceId,
          conversationId,
          trigger,
          triggerKey,
          messageBody,
          occurredAt,
        }),
      authContext,
    );
  }

  private async runEvaluation({
    workspaceId,
    conversationId,
    trigger,
    triggerKey,
    messageBody,
    occurredAt,
  }: Required<EvaluateInboxAutomationsInput>): Promise<ExecuteInboxAutomationsResult> {
    const conversationRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
        workspaceId,
        InboxConversationWorkspaceEntity,
      );
    const automationRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxAutomationWorkspaceEntity>(
        workspaceId,
        InboxAutomationWorkspaceEntity,
      );
    const eventRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxConversationEventWorkspaceEntity>(
        workspaceId,
        InboxConversationEventWorkspaceEntity,
      );
    const conversationLabelRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxConversationLabelWorkspaceEntity>(
        workspaceId,
        InboxConversationLabelWorkspaceEntity,
      );
    const labelRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxLabelWorkspaceEntity>(
        workspaceId,
        InboxLabelWorkspaceEntity,
      );
    const taskRepository =
      await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
        workspaceId,
        TaskWorkspaceEntity,
      );
    const taskTargetRepository =
      await this.globalWorkspaceOrmManager.getRepository<TaskTargetWorkspaceEntity>(
        workspaceId,
        TaskTargetWorkspaceEntity,
      );
    const inboxMessageRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
      );

    const repositories = {
      conversationRepository,
      automationRepository,
      eventRepository,
      conversationLabelRepository,
      labelRepository,
      taskRepository,
      taskTargetRepository,
      inboxMessageRepository,
    };

    const [initialConversation, rules] = await Promise.all([
      this.loadConversation(conversationRepository, conversationId),
      this.loadAutomationRules(automationRepository, trigger),
    ]);

    if (!initialConversation) {
      throw new Error('Conversation not found for inbox automation.');
    }

    const result: ExecuteInboxAutomationsResult = {
      evaluated: rules.length,
      matched: 0,
      applied: 0,
      failed: 0,
      skippedAsDuplicate: 0,
      warnings: [],
    };
    let conversation = initialConversation;
    const normalizedMessageBody = messageBody ?? '';
    const runHash = stableHash(`${conversationId}:${trigger}:${triggerKey}`);

    for (const automation of rules) {
      if (
        !this.ruleMatches({
          rule: automation,
          conversation,
          messageBody: normalizedMessageBody,
        })
      ) {
        continue;
      }

      result.matched += 1;

      const eventName =
        `AUTOMATION:${automation.id}:${conversationId}:${runHash}`.slice(
          0,
          255,
        );
      const claim = await this.claimAutomationRun({
        eventRepository,
        automation,
        conversationId,
        eventName,
        occurredAt,
        trigger,
      });
      const event = claim.event;

      if (!event) {
        result.skippedAsDuplicate += 1;

        if (automation.stopAfterMatch && claim.duplicateWasApplied) {
          break;
        }

        continue;
      }

      let wasApplied = false;

      try {
        const applied = await this.applyAutomation({
          repositories,
          automation,
          conversation,
          event,
          messageBody: normalizedMessageBody,
          occurredAt,
          runHash,
        });

        conversation = applied.conversation;
        result.applied += 1;
        result.warnings.push(...applied.warnings);
        wasApplied = true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Falha interna da automação.';

        result.warnings.push(`${automation.name}: ${message}`);
        result.failed += 1;
        this.logger.warn(
          `Inbox automation ${automation.id} failed for conversation ${conversationId}: ${message}`,
        );
        await eventRepository.update(event.id, {
          summary: `Automação falhou: ${automation.name}`,
          details: `${message}\nEnvio externo: bloqueado`,
        });

        break;
      }

      if (automation.stopAfterMatch && wasApplied) {
        break;
      }
    }

    return result;
  }

  private async loadConversation(
    conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>,
    conversationId: string,
  ): Promise<ConversationSnapshot | null> {
    const conversation = await conversationRepository.findOne({
      where: { id: conversationId },
      relations: { person: true, company: true, opportunity: true },
    });

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      name: conversation.name ?? '',
      channel: conversation.channel ?? '',
      status: conversation.status ?? '',
      priority: conversation.priority ?? '',
      contactHandle: conversation.contactHandle,
      unreadCount: conversation.unreadCount,
      firstResponseDueAt: conversation.firstResponseDueAt,
      firstRespondedAt: conversation.firstRespondedAt,
      followUpDueAt: conversation.followUpDueAt,
      assigneeId: conversation.assigneeId,
      inboxTeamId: conversation.inboxTeamId,
      personId: conversation.personId,
      personName: this.getPersonName(conversation.person),
      companyId: conversation.companyId,
      companyName: conversation.company?.name?.trim() ?? '',
      opportunityId: conversation.opportunityId,
      opportunityName: conversation.opportunity?.name?.trim() ?? '',
    };
  }

  private getPersonName(
    person: { name?: { firstName: string; lastName: string } | null } | null,
  ): string {
    if (!person?.name) {
      return '';
    }

    return [person.name.firstName, person.name.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private async loadAutomationRules(
    automationRepository: WorkspaceRepository<InboxAutomationWorkspaceEntity>,
    trigger: InboxAutomationTriggerValue,
  ): Promise<AutomationRule[]> {
    const rules = await automationRepository
      .createQueryBuilder('automation')
      .leftJoinAndSelect('automation.inboxLabel', 'inboxLabel')
      .leftJoinAndSelect('automation.inboxTeam', 'inboxTeam')
      .leftJoinAndSelect('inboxTeam.memberships', 'memberships')
      .where('automation.status = :status', { status: 'ACTIVE' })
      .andWhere('automation.trigger = :trigger', { trigger })
      .orderBy('automation.executionOrder', 'ASC', 'NULLS LAST')
      .addOrderBy('automation.name', 'ASC', 'NULLS LAST')
      .take(100)
      .getMany();

    return rules.map((rule) => ({
      id: rule.id,
      name: rule.name ?? '',
      channel: rule.channel ?? 'ALL',
      keywords: rule.keywords,
      crmCondition: rule.crmCondition ?? 'ANY',
      onlyIfUnassigned: rule.onlyIfUnassigned === true,
      targetConversationStatus: rule.targetConversationStatus ?? 'KEEP',
      targetPriority: rule.targetPriority ?? 'KEEP',
      followUpDelayMinutes: rule.followUpDelayMinutes,
      taskTitleTemplate: rule.taskTitleTemplate,
      taskDueDelayMinutes: rule.taskDueDelayMinutes,
      internalNoteTemplate: rule.internalNoteTemplate,
      stopAfterMatch: rule.stopAfterMatch === true,
      runCount: rule.runCount,
      inboxLabel: rule.inboxLabel
        ? {
            id: rule.inboxLabel.id,
            name: rule.inboxLabel.name ?? '',
            status: rule.inboxLabel.status ?? '',
            usageCount: rule.inboxLabel.usageCount,
          }
        : null,
      inboxTeam: rule.inboxTeam
        ? {
            id: rule.inboxTeam.id,
            name: rule.inboxTeam.name ?? '',
            status: rule.inboxTeam.status ?? '',
            routingStrategy: rule.inboxTeam.routingStrategy ?? 'MANUAL',
            defaultResponseSlaMinutes: rule.inboxTeam.defaultResponseSlaMinutes,
            memberships: (rule.inboxTeam.memberships ?? [])
              .filter((membership) => membership.isActive === true)
              .map((membership) => ({
                id: membership.id,
                memberRole: membership.memberRole,
                workspaceMemberId: membership.workspaceMemberId ?? '',
              }))
              .filter((membership) => membership.workspaceMemberId.length > 0),
          }
        : null,
      assigneeId: rule.assigneeId,
    }));
  }

  private matchesCrmCondition(
    rule: AutomationRule,
    conversation: ConversationSnapshot,
  ): boolean {
    switch (rule.crmCondition) {
      case 'LINKED':
        return Boolean(conversation.personId || conversation.companyId);
      case 'UNLINKED':
        return !conversation.personId && !conversation.companyId;
      case 'HAS_OPPORTUNITY':
        return Boolean(conversation.opportunityId);
      case 'NO_OPPORTUNITY':
        return !conversation.opportunityId;
      default:
        return true;
    }
  }

  private matchesKeywords(rule: AutomationRule, messageBody: string): boolean {
    const keywords =
      rule.keywords?.split(/[,\n]/).map(normalizeText).filter(Boolean) ?? [];

    if (keywords.length === 0) {
      return true;
    }

    const haystack = normalizeText(messageBody);

    return keywords.some((keyword) => haystack.includes(keyword));
  }

  private hasConfiguredAction(rule: AutomationRule): boolean {
    return (
      rule.targetConversationStatus !== 'KEEP' ||
      rule.targetPriority !== 'KEEP' ||
      Boolean(rule.inboxTeam?.id) ||
      Boolean(rule.assigneeId) ||
      Boolean(rule.inboxLabel?.id) ||
      readPositiveMinutes(rule.followUpDelayMinutes) > 0 ||
      Boolean(rule.taskTitleTemplate?.trim()) ||
      Boolean(rule.internalNoteTemplate?.trim())
    );
  }

  private ruleMatches({
    rule,
    conversation,
    messageBody,
  }: {
    rule: AutomationRule;
    conversation: ConversationSnapshot;
    messageBody: string;
  }): boolean {
    return (
      (rule.channel === 'ALL' || rule.channel === conversation.channel) &&
      (!rule.onlyIfUnassigned || !conversation.assigneeId) &&
      this.matchesCrmCondition(rule, conversation) &&
      this.matchesKeywords(rule, messageBody) &&
      this.hasConfiguredAction(rule)
    );
  }

  private async claimAutomationRun({
    eventRepository,
    automation,
    conversationId,
    eventName,
    occurredAt,
    trigger,
  }: {
    eventRepository: WorkspaceRepository<InboxConversationEventWorkspaceEntity>;
    automation: AutomationRule;
    conversationId: string;
    eventName: string;
    occurredAt: string;
    trigger: InboxAutomationTriggerValue;
  }): Promise<{
    event: { id: string } | null;
    duplicateWasApplied: boolean;
  }> {
    const existingEvent = await eventRepository.findOne({
      where: { name: eventName },
    });

    if (existingEvent) {
      if (existingEvent.summary?.startsWith('Automação falhou:')) {
        const retryResult = await eventRepository
          .createQueryBuilder()
          .update()
          .set({
            summary: `Automação reiniciada: ${automation.name}`,
            details: `Gatilho: ${trigger}`,
            occurredAt,
          })
          .where('id = :eventId', { eventId: existingEvent.id })
          .andWhere('summary LIKE :failedSummary', {
            failedSummary: 'Automação falhou:%',
          })
          .execute();

        if (retryResult.affected === 1) {
          return {
            event: { id: existingEvent.id },
            duplicateWasApplied: false,
          };
        }
      }

      const currentEvent = await eventRepository.findOne({
        where: { name: eventName },
      });

      return {
        event: null,
        duplicateWasApplied:
          currentEvent?.summary?.startsWith('Automação falhou:') !== true,
      };
    }

    try {
      const inserted = await eventRepository.insert({
        name: eventName,
        eventType: 'AUTOMATION_APPLIED',
        summary: `Automação iniciada: ${automation.name}`,
        details: `Gatilho: ${trigger}`,
        occurredAt,
        inboxConversationId: conversationId,
      });
      const eventId = inserted.identifiers[0]?.id as string | undefined;

      if (!eventId) {
        throw new Error('Automation event did not return an identifier.');
      }

      return {
        event: { id: eventId },
        duplicateWasApplied: false,
      };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const eventCreatedByAnotherExecution = await eventRepository.findOne({
        where: { name: eventName },
      });

      if (eventCreatedByAnotherExecution) {
        if (
          eventCreatedByAnotherExecution.summary?.startsWith(
            'Automação falhou:',
          )
        ) {
          const retryResult = await eventRepository
            .createQueryBuilder()
            .update()
            .set({
              summary: `Automação reiniciada: ${automation.name}`,
              details: `Gatilho: ${trigger}`,
              occurredAt,
            })
            .where('id = :eventId', {
              eventId: eventCreatedByAnotherExecution.id,
            })
            .andWhere('summary LIKE :failedSummary', {
              failedSummary: 'Automação falhou:%',
            })
            .execute();

          if (retryResult.affected === 1) {
            return {
              event: { id: eventCreatedByAnotherExecution.id },
              duplicateWasApplied: false,
            };
          }
        }

        const currentEvent = await eventRepository.findOne({
          where: { name: eventName },
        });

        return {
          event: null,
          duplicateWasApplied:
            currentEvent?.summary?.startsWith('Automação falhou:') !== true,
        };
      }

      throw error;
    }
  }

  private async loadLeastLoadedMember(
    conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>,
    team: Team,
  ): Promise<string | null> {
    if (team.routingStrategy !== 'BALANCED' || team.memberships.length === 0) {
      return null;
    }

    const conversations = await conversationRepository.find({
      where: { inboxTeamId: team.id },
      select: { id: true, status: true, assigneeId: true },
      take: 500,
    });
    const loadByMemberId = new Map(
      team.memberships.map(({ workspaceMemberId }) => [workspaceMemberId, 0]),
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

    return (
      [...team.memberships].sort((left, right) => {
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
      })[0]?.workspaceMemberId ?? null
    );
  }

  private async resolveAssignment({
    conversationRepository,
    conversation,
    rule,
    warnings,
  }: {
    conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>;
    conversation: ConversationSnapshot;
    rule: AutomationRule;
    warnings: string[];
  }): Promise<{
    teamId: string | null;
    assigneeId: string | null;
    responseSlaMinutes: number | null;
    changed: boolean;
  }> {
    const team = rule.inboxTeam;
    const configuredAssigneeId = rule.assigneeId;

    if (!team && !configuredAssigneeId) {
      return {
        teamId: conversation.inboxTeamId,
        assigneeId: conversation.assigneeId,
        responseSlaMinutes: null,
        changed: false,
      };
    }

    if (!team) {
      return {
        teamId: conversation.inboxTeamId,
        assigneeId: configuredAssigneeId,
        responseSlaMinutes: null,
        changed: configuredAssigneeId !== conversation.assigneeId,
      };
    }

    if (team.status !== 'ACTIVE') {
      warnings.push(`Equipe inativa na automação ${rule.name}.`);

      return {
        teamId: conversation.inboxTeamId,
        assigneeId: conversation.assigneeId,
        responseSlaMinutes: null,
        changed: false,
      };
    }

    const memberIds = new Set(
      team.memberships.map(({ workspaceMemberId }) => workspaceMemberId),
    );

    if (configuredAssigneeId && !memberIds.has(configuredAssigneeId)) {
      warnings.push(
        `Responsável da automação ${rule.name} não pertence à equipe ${team.name}.`,
      );

      return {
        teamId: team.id,
        assigneeId: null,
        responseSlaMinutes:
          readPositiveMinutes(team.defaultResponseSlaMinutes, 60) || 60,
        changed:
          team.id !== conversation.inboxTeamId ||
          conversation.assigneeId !== null,
      };
    }

    const assigneeId =
      configuredAssigneeId ??
      (await this.loadLeastLoadedMember(conversationRepository, team)) ??
      (conversation.assigneeId && memberIds.has(conversation.assigneeId)
        ? conversation.assigneeId
        : null);

    return {
      teamId: team.id,
      assigneeId,
      responseSlaMinutes:
        readPositiveMinutes(team.defaultResponseSlaMinutes, 60) || 60,
      changed:
        team.id !== conversation.inboxTeamId ||
        assigneeId !== conversation.assigneeId,
    };
  }

  private async applyLabel({
    conversationLabelRepository,
    labelRepository,
    conversationId,
    label,
    occurredAt,
  }: {
    conversationLabelRepository: WorkspaceRepository<InboxConversationLabelWorkspaceEntity>;
    labelRepository: WorkspaceRepository<InboxLabelWorkspaceEntity>;
    conversationId: string;
    label: Label;
    occurredAt: string;
  }): Promise<string> {
    if (label.status !== 'ACTIVE') {
      throw new Error(`A etiqueta ${label.name} está inativa.`);
    }

    const assignmentName = `${conversationId}:${label.id}`;
    const existing = await conversationLabelRepository.findOne({
      where: { name: assignmentName },
    });

    if (existing?.isActive) {
      return `Etiqueta mantida: ${label.name}`;
    }

    if (existing?.id) {
      await conversationLabelRepository.update(existing.id, {
        isActive: true,
        assignedAt: occurredAt,
        removedAt: null,
      });
    } else {
      await conversationLabelRepository.insert({
        name: assignmentName,
        isActive: true,
        assignedAt: occurredAt,
        removedAt: null,
        inboxConversationId: conversationId,
        inboxLabelId: label.id,
      });
    }

    try {
      await labelRepository.update(label.id, {
        usageCount: Math.max(0, label.usageCount ?? 0) + 1,
      });
    } catch {
      // A aplicação da etiqueta é o efeito principal; a métrica é reconciliável.
    }

    return `Etiqueta aplicada: ${label.name}`;
  }

  private renderTemplate({
    template,
    automation,
    conversation,
    messageBody,
  }: {
    template: string;
    automation: AutomationRule;
    conversation: ConversationSnapshot;
    messageBody: string;
  }): RenderResult {
    const contactName = conversation.personName || conversation.name.trim();
    const values: Record<string, string> = {
      'automation.id': automation.id,
      'automation.name': automation.name,
      'conversation.id': conversation.id,
      'conversation.name': conversation.name.trim(),
      'conversation.contact_handle': conversation.contactHandle?.trim() ?? '',
      'contact.id': conversation.personId ?? '',
      'contact.name': contactName,
      'contact.first_name': contactName.split(/\s+/)[0] ?? '',
      'company.id': conversation.companyId ?? '',
      'company.name': conversation.companyName,
      'opportunity.id': conversation.opportunityId ?? '',
      'opportunity.name': conversation.opportunityName,
      'message.body': messageBody.trim(),
    };
    const unresolvedVariables = new Set<string>();
    const text = template.replace(
      TEMPLATE_VARIABLE_PATTERN,
      (
        placeholder,
        rawVariable: string,
        _quote?: string,
        fallback?: string,
      ) => {
        const value = values[rawVariable.toLowerCase()]?.trim();

        if (value) {
          return value;
        }

        if (typeof fallback === 'string') {
          return fallback;
        }

        unresolvedVariables.add(rawVariable);

        return placeholder;
      },
    );

    return {
      text,
      unresolvedVariables: [...unresolvedVariables],
    };
  }

  private async createInternalNote({
    inboxMessageRepository,
    automation,
    conversation,
    messageBody,
    occurredAt,
    runHash,
  }: {
    inboxMessageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>;
    automation: AutomationRule;
    conversation: ConversationSnapshot;
    messageBody: string;
    occurredAt: string;
    runHash: string;
  }): Promise<string | null> {
    const template = automation.internalNoteTemplate?.trim();

    if (!template) {
      return null;
    }

    const rendered = this.renderTemplate({
      template,
      automation,
      conversation,
      messageBody,
    });

    if (rendered.unresolvedVariables.length > 0 || !rendered.text.trim()) {
      throw new Error(
        `Nota interna com variáveis sem valor: ${rendered.unresolvedVariables.join(', ') || 'texto vazio'}.`,
      );
    }

    const body = rendered.text.trim();

    await inboxMessageRepository.upsert(
      {
        name: body.length > 70 ? `${body.slice(0, 67)}...` : body,
        providerMessageKey: `INTERNAL:AUTOMATION:${automation.id}:${runHash}`,
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        body,
        deliveryStatus: 'SENT',
        sentAt: occurredAt,
        isInternalNote: true,
        inboxConversationId: conversation.id,
        metadata: {
          source: 'DIEX_INBOX_AUTOMATION',
          automationId: automation.id,
        },
      },
      ['providerMessageKey'],
    );

    return 'Nota interna registrada';
  }

  private async createTaskTargets({
    taskTargetRepository,
    conversation,
    taskId,
  }: {
    taskTargetRepository: WorkspaceRepository<TaskTargetWorkspaceEntity>;
    conversation: ConversationSnapshot;
    taskId: string;
  }): Promise<number> {
    const targets = [
      conversation.personId ? { targetPersonId: conversation.personId } : null,
      conversation.companyId
        ? { targetCompanyId: conversation.companyId }
        : null,
      conversation.opportunityId
        ? { targetOpportunityId: conversation.opportunityId }
        : null,
    ].filter(isDefined);
    let linkedTargets = 0;

    for (const target of targets) {
      const existingTarget = await taskTargetRepository.findOneBy({
        taskId,
        ...target,
      });

      if (!existingTarget) {
        await taskTargetRepository.insert({ taskId, ...target });
      }

      linkedTargets += 1;
    }

    return linkedTargets;
  }

  private async createAutomationTask({
    taskRepository,
    taskTargetRepository,
    assigneeId,
    automation,
    conversation,
    messageBody,
    occurredAt,
    runHash,
  }: {
    taskRepository: WorkspaceRepository<TaskWorkspaceEntity>;
    taskTargetRepository: WorkspaceRepository<TaskTargetWorkspaceEntity>;
    assigneeId: string | null;
    automation: AutomationRule;
    conversation: ConversationSnapshot;
    messageBody: string;
    occurredAt: string;
    runHash: string;
  }): Promise<{ action: string; dueAt: string } | null> {
    const template = automation.taskTitleTemplate?.trim();

    if (!template) {
      return null;
    }

    const rendered = this.renderTemplate({
      template,
      automation,
      conversation,
      messageBody,
    });

    if (rendered.unresolvedVariables.length > 0 || !rendered.text.trim()) {
      throw new Error(
        `Tarefa com variáveis sem valor: ${rendered.unresolvedVariables.join(', ') || 'título vazio'}.`,
      );
    }

    const title = rendered.text.trim().slice(0, 255);
    const dueDelayMinutes =
      readPositiveMinutes(automation.taskDueDelayMinutes, 60) || 60;
    const dueAt = new Date(
      new Date(occurredAt).getTime() + dueDelayMinutes * 60_000,
    ).toISOString();
    const actor = {
      source: FieldActorSource.WORKFLOW,
      workspaceMemberId: null,
      name: `Automação: ${automation.name}`,
      context: {},
    };
    const legacyDiexId =
      `INBOX_AUTOMATION_TASK:${automation.id}:${conversation.id}:${runHash}`;
    const existingTask = await taskRepository.findOne({
      where: { legacyDiexId },
    });

    if (!existingTask) {
      await taskRepository.upsert(
        {
          legacyDiexId,
          title,
          status: 'TODO',
          dueAt: new Date(dueAt),
          assigneeId,
          diexInboxConversationId: conversation.id,
          createdBy: actor,
          updatedBy: actor,
          bodyV2: {
            markdown: [
              `Tarefa criada pela automação da Inbox: ${automation.name}.`,
              `Conversa: ${conversation.name}`,
              `Canal: ${conversation.channel}`,
              'Nenhuma comunicação externa foi enviada.',
            ].join('\n\n'),
            blocknote: null,
          },
        },
        ['legacyDiexId'],
      );
    }

    const task =
      existingTask ??
      (await taskRepository.findOne({
        where: { legacyDiexId },
      }));
    const taskId = task?.id;

    if (!taskId) {
      throw new Error('A tarefa da automação não retornou um identificador.');
    }

    const linkedTargets = await this.createTaskTargets({
      taskTargetRepository,
      conversation,
      taskId,
    });

    return {
      action: `Próxima ação criada: ${title} (${linkedTargets} vínculo(s) CRM)`,
      dueAt,
    };
  }

  private async applyAutomation({
    repositories,
    automation,
    conversation,
    event,
    messageBody,
    occurredAt,
    runHash,
  }: {
    repositories: {
      conversationRepository: WorkspaceRepository<InboxConversationWorkspaceEntity>;
      automationRepository: WorkspaceRepository<InboxAutomationWorkspaceEntity>;
      eventRepository: WorkspaceRepository<InboxConversationEventWorkspaceEntity>;
      conversationLabelRepository: WorkspaceRepository<InboxConversationLabelWorkspaceEntity>;
      labelRepository: WorkspaceRepository<InboxLabelWorkspaceEntity>;
      taskRepository: WorkspaceRepository<TaskWorkspaceEntity>;
      taskTargetRepository: WorkspaceRepository<TaskTargetWorkspaceEntity>;
      inboxMessageRepository: WorkspaceRepository<InboxMessageWorkspaceEntity>;
    };
    automation: AutomationRule;
    conversation: ConversationSnapshot;
    event: { id: string };
    messageBody: string;
    occurredAt: string;
    runHash: string;
  }): Promise<{
    conversation: ConversationSnapshot;
    actions: string[];
    warnings: string[];
  }> {
    const actions: string[] = [];
    const warnings: string[] = [];
    const assignment = await this.resolveAssignment({
      conversationRepository: repositories.conversationRepository,
      conversation,
      rule: automation,
      warnings,
    });
    const conversationUpdate: Record<string, unknown> = {};

    if (automation.targetConversationStatus !== 'KEEP') {
      conversationUpdate.status = automation.targetConversationStatus;
      conversationUpdate.snoozedUntil = null;
      actions.push(`Status: ${automation.targetConversationStatus}`);

      if (automation.targetConversationStatus === 'RESOLVED') {
        conversationUpdate.unreadCount = 0;
      }
    }

    if (automation.targetPriority !== 'KEEP') {
      conversationUpdate.priority = automation.targetPriority;
      actions.push(`Prioridade: ${automation.targetPriority}`);
    }

    if (assignment.changed) {
      conversationUpdate.inboxTeamId = assignment.teamId;
      conversationUpdate.assigneeId = assignment.assigneeId;
      actions.push(
        `Distribuição: equipe ${assignment.teamId ?? 'mantida'}, responsável ${assignment.assigneeId ?? 'não definido'}`,
      );

      if (!conversation.firstRespondedAt && assignment.responseSlaMinutes) {
        conversationUpdate.firstResponseDueAt = new Date(
          new Date(occurredAt).getTime() +
            assignment.responseSlaMinutes * 60_000,
        ).toISOString();
        conversationUpdate.slaBreachedAt = null;
      }
    }

    const followUpDelayMinutes = readPositiveMinutes(
      automation.followUpDelayMinutes,
    );

    if (followUpDelayMinutes > 0) {
      conversationUpdate.followUpDueAt = new Date(
        new Date(occurredAt).getTime() + followUpDelayMinutes * 60_000,
      ).toISOString();
      actions.push(`Follow-up: ${followUpDelayMinutes} minuto(s)`);
    }

    if (Object.keys(conversationUpdate).length > 0) {
      await repositories.conversationRepository.update(
        conversation.id,
        conversationUpdate as QueryDeepPartialEntity<InboxConversationWorkspaceEntity>,
      );
    }

    if (automation.inboxLabel?.id) {
      try {
        actions.push(
          await this.applyLabel({
            conversationLabelRepository:
              repositories.conversationLabelRepository,
            labelRepository: repositories.labelRepository,
            conversationId: conversation.id,
            label: automation.inboxLabel,
            occurredAt,
          }),
        );
      } catch (error) {
        warnings.push(
          error instanceof Error
            ? error.message
            : 'A etiqueta configurada não pôde ser aplicada.',
        );
      }
    }

    try {
      const noteAction = await this.createInternalNote({
        inboxMessageRepository: repositories.inboxMessageRepository,
        automation,
        conversation,
        messageBody,
        occurredAt,
        runHash,
      });

      if (noteAction) {
        actions.push(noteAction);
      }
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? error.message
          : 'A nota interna não pôde ser criada.',
      );
    }

    try {
      const task = await this.createAutomationTask({
        taskRepository: repositories.taskRepository,
        taskTargetRepository: repositories.taskTargetRepository,
        assigneeId: assignment.assigneeId,
        automation,
        conversation,
        messageBody,
        occurredAt,
        runHash,
      });

      if (task) {
        actions.push(task.action);
        const currentFollowUp = String(
          conversationUpdate.followUpDueAt ?? conversation.followUpDueAt ?? '',
        );

        if (
          !currentFollowUp ||
          new Date(task.dueAt).getTime() < new Date(currentFollowUp).getTime()
        ) {
          await repositories.conversationRepository.update(conversation.id, {
            followUpDueAt: task.dueAt,
          });
          conversationUpdate.followUpDueAt = task.dueAt;
        }
      }
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? error.message
          : 'A próxima ação não pôde ser criada.',
      );
    }

    if (actions.length === 0) {
      throw new Error(
        warnings.join(' ') ||
          `A automação ${automation.name} não produziu nenhuma ação.`,
      );
    }

    if (warnings.length > 0) {
      throw new Error(warnings.join(' '));
    }

    const nextRunCount = Math.max(0, automation.runCount ?? 0) + 1;

    await Promise.allSettled([
      repositories.automationRepository.update(automation.id, {
        runCount: nextRunCount,
        lastRunAt: occurredAt,
      }),
      repositories.eventRepository.update(event.id, {
        summary: `Automação aplicada: ${automation.name}`,
        details: [
          ...actions.map((action) => `✓ ${action}`),
          ...warnings.map((warning) => `⚠ ${warning}`),
          'Envio externo: bloqueado',
        ].join('\n'),
      }),
    ]);

    return {
      conversation: {
        ...conversation,
        status:
          automation.targetConversationStatus === 'KEEP'
            ? conversation.status
            : automation.targetConversationStatus,
        priority:
          automation.targetPriority === 'KEEP'
            ? conversation.priority
            : automation.targetPriority,
        unreadCount:
          automation.targetConversationStatus === 'RESOLVED'
            ? 0
            : conversation.unreadCount,
        inboxTeamId: assignment.teamId,
        assigneeId: assignment.assigneeId,
        firstResponseDueAt:
          typeof conversationUpdate.firstResponseDueAt === 'string'
            ? conversationUpdate.firstResponseDueAt
            : conversation.firstResponseDueAt,
        followUpDueAt:
          typeof conversationUpdate.followUpDueAt === 'string'
            ? conversationUpdate.followUpDueAt
            : conversation.followUpDueAt,
      },
      actions,
      warnings,
    };
  }
}
