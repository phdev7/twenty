import { CoreApiClient } from 'twenty-client-sdk/core';

export type InboxAutomationTriggerValue =
  'CONVERSATION_CREATED' | 'INBOUND_MESSAGE_CREATED';

type RecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

type RecordReference = {
  id: string;
  name?: string | RecordName | null;
};

type AutomationConversation = {
  id: string;
  name: string;
  channel: string;
  status: string;
  priority: string;
  contactHandle?: string | null;
  unreadCount?: number | null;
  firstResponseDueAt?: string | null;
  firstRespondedAt?: string | null;
  followUpDueAt?: string | null;
  assigneeId?: string | null;
  inboxTeamId?: string | null;
  person?: RecordReference | null;
  company?: RecordReference | null;
  opportunity?: RecordReference | null;
};

type AutomationTeamMembership = {
  id: string;
  role: string;
  isActive: boolean;
  workspaceMemberId: string;
};

type AutomationTeam = {
  id: string;
  name: string;
  status: string;
  routingStrategy: string;
  defaultResponseSlaMinutes?: number | null;
  memberships: AutomationTeamMembership[];
};

type AutomationLabel = {
  id: string;
  name: string;
  status: string;
  usageCount?: number | null;
};

type AutomationRule = {
  id: string;
  name: string;
  key: string;
  status: string;
  trigger: string;
  channel: string;
  keywords?: string | null;
  crmCondition: string;
  onlyIfUnassigned: boolean;
  targetConversationStatus: string;
  targetPriority: string;
  followUpDelayMinutes?: number | null;
  taskTitleTemplate?: string | null;
  taskDueDelayMinutes?: number | null;
  internalNoteTemplate?: string | null;
  stopAfterMatch: boolean;
  position?: number | null;
  runCount?: number | null;
  lastRunAt?: string | null;
  inboxLabel?: AutomationLabel | null;
  inboxTeam?: AutomationTeam | null;
  assignee?: RecordReference | null;
};

type AutomationEvent = {
  id: string;
  summary?: string | null;
};

type RenderResult = {
  text: string;
  unresolvedVariables: string[];
};

export type ExecuteInboxAutomationsInput = {
  client?: CoreApiClient;
  conversationId: string;
  trigger: InboxAutomationTriggerValue;
  triggerKey: string;
  messageBody?: string | null;
  occurredAt?: string;
};

export type ExecuteInboxAutomationsResult = {
  evaluated: number;
  matched: number;
  applied: number;
  skippedAsDuplicate: number;
  warnings: string[];
};

const TEMPLATE_VARIABLE_PATTERN =
  /{{\s*([a-zA-Z0-9_.]+)(?:\s*\|\|\s*(['"])(.*?)\2)?\s*}}/g;

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

const getRecordName = (record?: RecordReference | null): string => {
  if (!record?.name) {
    return '';
  }

  if (typeof record.name === 'string') {
    return record.name.trim();
  }

  return [record.name.firstName, record.name.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
};

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

const renderTemplate = ({
  template,
  automation,
  conversation,
  messageBody,
}: {
  template: string;
  automation: AutomationRule;
  conversation: AutomationConversation;
  messageBody: string;
}): RenderResult => {
  const contactName =
    getRecordName(conversation.person) || conversation.name.trim();
  const values: Record<string, string> = {
    'automation.id': automation.id,
    'automation.name': automation.name,
    'conversation.id': conversation.id,
    'conversation.name': conversation.name.trim(),
    'conversation.contact_handle': conversation.contactHandle?.trim() ?? '',
    'contact.id': conversation.person?.id ?? '',
    'contact.name': contactName,
    'contact.first_name': contactName.split(/\s+/)[0] ?? '',
    'company.id': conversation.company?.id ?? '',
    'company.name': getRecordName(conversation.company),
    'opportunity.id': conversation.opportunity?.id ?? '',
    'opportunity.name': getRecordName(conversation.opportunity),
    'message.body': messageBody.trim(),
  };
  const unresolvedVariables = new Set<string>();
  const text = template.replace(
    TEMPLATE_VARIABLE_PATTERN,
    (placeholder, rawVariable: string, _quote?: string, fallback?: string) => {
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
};

const loadConversation = async (
  client: CoreApiClient,
  conversationId: string,
): Promise<AutomationConversation | null> => {
  const result = (await client.query({
    inboxConversations: {
      __args: {
        filter: {
          id: {
            eq: conversationId,
          },
        },
        first: 1,
      },
      edges: {
        node: {
          id: true,
          summary: true,
          name: true,
          channel: true,
          status: true,
          priority: true,
          contactHandle: true,
          unreadCount: true,
          firstResponseDueAt: true,
          firstRespondedAt: true,
          followUpDueAt: true,
          assigneeId: true,
          inboxTeamId: true,
          person: {
            id: true,
            name: {
              firstName: true,
              lastName: true,
            },
          },
          company: {
            id: true,
            name: true,
          },
          opportunity: {
            id: true,
            name: true,
          },
        },
      },
    },
  } as never)) as unknown as {
    inboxConversations?: {
      edges?: Array<{
        node?: AutomationConversation | null;
      }>;
    };
  };

  return getEdges(result.inboxConversations)[0] ?? null;
};

const loadAutomationRules = async (
  client: CoreApiClient,
  trigger: InboxAutomationTriggerValue,
): Promise<AutomationRule[]> => {
  const result = (await client.query({
    inboxAutomations: {
      __args: {
        filter: {
          status: {
            eq: 'ACTIVE',
          },
          trigger: {
            eq: trigger,
          },
        },
        first: 100,
        orderBy: [
          {
            position: 'AscNullsLast',
          },
          {
            name: 'AscNullsLast',
          },
        ],
      },
      edges: {
        node: {
          id: true,
          name: true,
          key: true,
          status: true,
          trigger: true,
          channel: true,
          keywords: true,
          crmCondition: true,
          onlyIfUnassigned: true,
          targetConversationStatus: true,
          targetPriority: true,
          followUpDelayMinutes: true,
          taskTitleTemplate: true,
          taskDueDelayMinutes: true,
          internalNoteTemplate: true,
          stopAfterMatch: true,
          position: true,
          runCount: true,
          lastRunAt: true,
          inboxLabel: {
            id: true,
            name: true,
            status: true,
            usageCount: true,
          },
          inboxTeam: {
            id: true,
            name: true,
            status: true,
            routingStrategy: true,
            defaultResponseSlaMinutes: true,
            memberships: {
              edges: {
                node: {
                  id: true,
                  role: true,
                  isActive: true,
                  workspaceMemberId: true,
                },
              },
            },
          },
          assignee: {
            id: true,
            name: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  } as never)) as unknown as {
    inboxAutomations?: {
      edges?: Array<{
        node?:
          | (Omit<AutomationRule, 'inboxTeam'> & {
              inboxTeam?:
                | (Omit<AutomationTeam, 'memberships'> & {
                    memberships?: {
                      edges?: Array<{
                        node?: AutomationTeamMembership | null;
                      }>;
                    } | null;
                  })
                | null;
            })
          | null;
      }>;
    };
  };

  return getEdges(result.inboxAutomations).map((rule) => ({
    ...rule,
    onlyIfUnassigned: rule.onlyIfUnassigned === true,
    stopAfterMatch: rule.stopAfterMatch === true,
    inboxTeam: rule.inboxTeam
      ? {
          ...rule.inboxTeam,
          memberships: getEdges(rule.inboxTeam.memberships).filter(
            (membership) =>
              membership.isActive === true &&
              typeof membership.workspaceMemberId === 'string',
          ),
        }
      : null,
  }));
};

const matchesCrmCondition = (
  rule: AutomationRule,
  conversation: AutomationConversation,
): boolean => {
  switch (rule.crmCondition) {
    case 'LINKED':
      return Boolean(conversation.person?.id || conversation.company?.id);
    case 'UNLINKED':
      return !conversation.person?.id && !conversation.company?.id;
    case 'HAS_OPPORTUNITY':
      return Boolean(conversation.opportunity?.id);
    case 'NO_OPPORTUNITY':
      return !conversation.opportunity?.id;
    default:
      return true;
  }
};

const matchesKeywords = (
  rule: AutomationRule,
  messageBody: string,
): boolean => {
  const keywords =
    rule.keywords?.split(/[,\n]/).map(normalizeText).filter(Boolean) ?? [];

  if (keywords.length === 0) {
    return true;
  }

  const haystack = normalizeText(messageBody);

  return keywords.some((keyword) => haystack.includes(keyword));
};

const hasConfiguredAction = (rule: AutomationRule): boolean =>
  rule.targetConversationStatus !== 'KEEP' ||
  rule.targetPriority !== 'KEEP' ||
  Boolean(rule.inboxTeam?.id) ||
  Boolean(rule.assignee?.id) ||
  Boolean(rule.inboxLabel?.id) ||
  readPositiveMinutes(rule.followUpDelayMinutes) > 0 ||
  Boolean(rule.taskTitleTemplate?.trim()) ||
  Boolean(rule.internalNoteTemplate?.trim());

const ruleMatches = ({
  rule,
  conversation,
  messageBody,
}: {
  rule: AutomationRule;
  conversation: AutomationConversation;
  messageBody: string;
}): boolean =>
  (rule.channel === 'ALL' || rule.channel === conversation.channel) &&
  (!rule.onlyIfUnassigned || !conversation.assigneeId) &&
  matchesCrmCondition(rule, conversation) &&
  matchesKeywords(rule, messageBody) &&
  hasConfiguredAction(rule);

const findAutomationEvent = async (
  client: CoreApiClient,
  eventName: string,
): Promise<AutomationEvent | null> => {
  const result = (await client.query({
    inboxConversationEvents: {
      __args: {
        filter: {
          name: {
            eq: eventName,
          },
        },
        first: 1,
      },
      edges: {
        node: {
          id: true,
        },
      },
    },
  } as never)) as unknown as {
    inboxConversationEvents?: {
      edges?: Array<{
        node?: AutomationEvent | null;
      }>;
    };
  };

  return getEdges(result.inboxConversationEvents)[0] ?? null;
};

const claimAutomationRun = async ({
  automation,
  client,
  conversationId,
  eventName,
  occurredAt,
  trigger,
}: {
  automation: AutomationRule;
  client: CoreApiClient;
  conversationId: string;
  eventName: string;
  occurredAt: string;
  trigger: InboxAutomationTriggerValue;
}): Promise<{
  event: AutomationEvent | null;
  duplicateWasApplied: boolean;
}> => {
  const existingEvent = await findAutomationEvent(client, eventName);

  if (existingEvent) {
    return {
      event: null,
      duplicateWasApplied:
        existingEvent.summary?.startsWith('Automação falhou:') !== true,
    };
  }

  try {
    const result = (await client.mutation({
      createInboxConversationEvent: {
        __args: {
          data: {
            name: eventName,
            eventType: 'AUTOMATION_APPLIED',
            summary: `Automação iniciada: ${automation.name}`,
            details: `Gatilho: ${trigger}`,
            occurredAt,
            inboxConversationId: conversationId,
          },
        },
        id: true,
      },
    } as never)) as unknown as {
      createInboxConversationEvent?: {
        id?: string | null;
      } | null;
    };
    const eventId = result.createInboxConversationEvent?.id;

    if (!eventId) {
      throw new Error('Automation event did not return an identifier.');
    }

    return {
      event: {
        id: eventId,
      },
      duplicateWasApplied: false,
    };
  } catch (error) {
    const eventCreatedByAnotherExecution = await findAutomationEvent(
      client,
      eventName,
    );

    if (eventCreatedByAnotherExecution) {
      return {
        event: null,
        duplicateWasApplied:
          eventCreatedByAnotherExecution.summary?.startsWith(
            'Automação falhou:',
          ) !== true,
      };
    }

    throw error;
  }
};

const loadLeastLoadedMember = async (
  client: CoreApiClient,
  team: AutomationTeam,
): Promise<string | null> => {
  if (team.routingStrategy !== 'BALANCED' || team.memberships.length === 0) {
    return null;
  }

  const result = (await client.query({
    inboxConversations: {
      __args: {
        filter: {
          inboxTeamId: {
            eq: team.id,
          },
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

  for (const conversation of getEdges(result.inboxConversations)) {
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

      if (left.role !== right.role) {
        return left.role === 'LEAD' ? -1 : 1;
      }

      return left.id.localeCompare(right.id);
    })[0]?.workspaceMemberId ?? null
  );
};

const resolveAssignment = async ({
  client,
  conversation,
  rule,
  warnings,
}: {
  client: CoreApiClient;
  conversation: AutomationConversation;
  rule: AutomationRule;
  warnings: string[];
}): Promise<{
  teamId: string | null;
  assigneeId: string | null;
  responseSlaMinutes: number | null;
  changed: boolean;
}> => {
  const team = rule.inboxTeam;
  const configuredAssigneeId = rule.assignee?.id ?? null;

  if (!team && !configuredAssigneeId) {
    return {
      teamId: conversation.inboxTeamId ?? null,
      assigneeId: conversation.assigneeId ?? null,
      responseSlaMinutes: null,
      changed: false,
    };
  }

  if (!team) {
    return {
      teamId: conversation.inboxTeamId ?? null,
      assigneeId: configuredAssigneeId,
      responseSlaMinutes: null,
      changed: configuredAssigneeId !== conversation.assigneeId,
    };
  }

  if (team.status !== 'ACTIVE') {
    warnings.push(`Equipe inativa na automação ${rule.name}.`);

    return {
      teamId: conversation.inboxTeamId ?? null,
      assigneeId: conversation.assigneeId ?? null,
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
    (await loadLeastLoadedMember(client, team)) ??
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
};

const applyLabel = async ({
  client,
  conversationId,
  label,
  occurredAt,
}: {
  client: CoreApiClient;
  conversationId: string;
  label: AutomationLabel;
  occurredAt: string;
}): Promise<string> => {
  if (label.status !== 'ACTIVE') {
    throw new Error(`A etiqueta ${label.name} está inativa.`);
  }

  const assignmentName = `${conversationId}:${label.id}`;
  const query = (await client.query({
    inboxConversationLabels: {
      __args: {
        filter: {
          name: {
            eq: assignmentName,
          },
        },
        first: 1,
      },
      edges: {
        node: {
          id: true,
          isActive: true,
        },
      },
    },
  } as never)) as unknown as {
    inboxConversationLabels?: {
      edges?: Array<{
        node?: {
          id?: string | null;
          isActive?: boolean | null;
        } | null;
      }>;
    };
  };
  const existing = getEdges(query.inboxConversationLabels)[0];

  if (existing?.isActive) {
    return `Etiqueta mantida: ${label.name}`;
  }

  if (existing?.id) {
    await client.mutation({
      updateInboxConversationLabel: {
        __args: {
          id: existing.id,
          data: {
            isActive: true,
            assignedAt: occurredAt,
            removedAt: null,
          },
        },
        id: true,
      },
    } as never);
  } else {
    await client.mutation({
      createInboxConversationLabel: {
        __args: {
          data: {
            name: assignmentName,
            isActive: true,
            assignedAt: occurredAt,
            removedAt: null,
            inboxConversationId: conversationId,
            inboxLabelId: label.id,
          },
        },
        id: true,
      },
    } as never);
  }

  try {
    await client.mutation({
      updateInboxLabel: {
        __args: {
          id: label.id,
          data: {
            usageCount: Math.max(0, label.usageCount ?? 0) + 1,
          },
        },
        id: true,
      },
    } as never);
  } catch {
    // A aplicação da etiqueta é o efeito principal; a métrica é reconciliável.
  }

  return `Etiqueta aplicada: ${label.name}`;
};

const createInternalNote = async ({
  automation,
  client,
  conversation,
  messageBody,
  occurredAt,
  runHash,
}: {
  automation: AutomationRule;
  client: CoreApiClient;
  conversation: AutomationConversation;
  messageBody: string;
  occurredAt: string;
  runHash: string;
}): Promise<string | null> => {
  const template = automation.internalNoteTemplate?.trim();

  if (!template) {
    return null;
  }

  const rendered = renderTemplate({
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

  await client.mutation({
    createInboxMessage: {
      __args: {
        data: {
          name: body.length > 70 ? `${body.slice(0, 67)}...` : body,
          providerMessageKey: `INTERNAL:AUTOMATION:${automation.id}:${runHash}`,
          direction: 'OUTBOUND',
          type: 'TEXT',
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
      },
      id: true,
    },
  } as never);

  return 'Nota interna registrada';
};

const createTaskTargets = async ({
  client,
  conversation,
  taskId,
}: {
  client: CoreApiClient;
  conversation: AutomationConversation;
  taskId: string;
}): Promise<number> => {
  const targets = [
    conversation.person?.id
      ? {
          targetPersonId: conversation.person.id,
        }
      : null,
    conversation.company?.id
      ? {
          targetCompanyId: conversation.company.id,
        }
      : null,
    conversation.opportunity?.id
      ? {
          targetOpportunityId: conversation.opportunity.id,
        }
      : null,
  ].filter(
    (
      target,
    ): target is
      | {
          targetPersonId: string;
        }
      | {
          targetCompanyId: string;
        }
      | {
          targetOpportunityId: string;
        } => target !== null,
  );
  const results = await Promise.allSettled(
    targets.map((target) =>
      client.mutation({
        createTaskTarget: {
          __args: {
            data: {
              taskId,
              ...target,
            },
          },
          id: true,
        },
      } as never),
    ),
  );

  return results.filter(({ status }) => status === 'fulfilled').length;
};

const createAutomationTask = async ({
  assigneeId,
  automation,
  client,
  conversation,
  messageBody,
  occurredAt,
}: {
  assigneeId: string | null;
  automation: AutomationRule;
  client: CoreApiClient;
  conversation: AutomationConversation;
  messageBody: string;
  occurredAt: string;
}): Promise<{
  action: string;
  dueAt: string;
} | null> => {
  const template = automation.taskTitleTemplate?.trim();

  if (!template) {
    return null;
  }

  const rendered = renderTemplate({
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
  const result = (await client.mutation({
    createTask: {
      __args: {
        data: {
          title,
          status: 'TODO',
          dueAt,
          assigneeId,
          diexInboxConversationId: conversation.id,
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
      },
      id: true,
    },
  } as never)) as unknown as {
    createTask?: {
      id?: string | null;
    } | null;
  };
  const taskId = result.createTask?.id;

  if (!taskId) {
    throw new Error('A tarefa da automação não retornou um identificador.');
  }

  const linkedTargets = await createTaskTargets({
    client,
    conversation,
    taskId,
  });

  return {
    action: `Próxima ação criada: ${title} (${linkedTargets} vínculo(s) CRM)`,
    dueAt,
  };
};

const applyAutomation = async ({
  automation,
  client,
  conversation,
  event,
  messageBody,
  occurredAt,
  runHash,
}: {
  automation: AutomationRule;
  client: CoreApiClient;
  conversation: AutomationConversation;
  event: AutomationEvent;
  messageBody: string;
  occurredAt: string;
  runHash: string;
}): Promise<{
  conversation: AutomationConversation;
  actions: string[];
  warnings: string[];
}> => {
  const actions: string[] = [];
  const warnings: string[] = [];
  const assignment = await resolveAssignment({
    client,
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
        new Date(occurredAt).getTime() + assignment.responseSlaMinutes * 60_000,
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
    await client.mutation({
      updateInboxConversation: {
        __args: {
          id: conversation.id,
          data: conversationUpdate,
        },
        id: true,
      },
    } as never);
  }

  if (automation.inboxLabel?.id) {
    try {
      actions.push(
        await applyLabel({
          client,
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
    const noteAction = await createInternalNote({
      automation,
      client,
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
    const task = await createAutomationTask({
      assigneeId: assignment.assigneeId,
      automation,
      client,
      conversation,
      messageBody,
      occurredAt,
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
        await client.mutation({
          updateInboxConversation: {
            __args: {
              id: conversation.id,
              data: {
                followUpDueAt: task.dueAt,
              },
            },
            id: true,
          },
        } as never);
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

  const nextRunCount = Math.max(0, automation.runCount ?? 0) + 1;

  await Promise.allSettled([
    client.mutation({
      updateInboxAutomation: {
        __args: {
          id: automation.id,
          data: {
            runCount: nextRunCount,
            lastRunAt: occurredAt,
          },
        },
        id: true,
      },
    } as never),
    client.mutation({
      updateInboxConversationEvent: {
        __args: {
          id: event.id,
          data: {
            summary: `Automação aplicada: ${automation.name}`,
            details: [
              ...actions.map((action) => `✓ ${action}`),
              ...warnings.map((warning) => `⚠ ${warning}`),
              'Envio externo: bloqueado',
            ].join('\n'),
          },
        },
        id: true,
      },
    } as never),
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
};

export const executeInboxAutomations = async ({
  client = new CoreApiClient(),
  conversationId,
  trigger,
  triggerKey,
  messageBody = '',
  occurredAt = new Date().toISOString(),
}: ExecuteInboxAutomationsInput): Promise<ExecuteInboxAutomationsResult> => {
  const [initialConversation, rules] = await Promise.all([
    loadConversation(client, conversationId),
    loadAutomationRules(client, trigger),
  ]);

  if (!initialConversation) {
    throw new Error('Conversation not found for inbox automation.');
  }

  const result: ExecuteInboxAutomationsResult = {
    evaluated: rules.length,
    matched: 0,
    applied: 0,
    skippedAsDuplicate: 0,
    warnings: [],
  };
  let conversation = initialConversation;
  const normalizedMessageBody = messageBody ?? '';
  const runHash = stableHash(`${conversationId}:${trigger}:${triggerKey}`);

  for (const automation of rules) {
    if (
      !ruleMatches({
        rule: automation,
        conversation,
        messageBody: normalizedMessageBody,
      })
    ) {
      continue;
    }

    result.matched += 1;
    const eventName =
      `AUTOMATION:${automation.id}:${conversationId}:${runHash}`.slice(0, 255);
    const claim = await claimAutomationRun({
      automation,
      client,
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
      const applied = await applyAutomation({
        automation,
        client,
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
        error instanceof Error ? error.message : 'Falha interna da automação.';

      result.warnings.push(`${automation.name}: ${message}`);
      await client.mutation({
        updateInboxConversationEvent: {
          __args: {
            id: event.id,
            data: {
              summary: `Automação falhou: ${automation.name}`,
              details: `${message}\nEnvio externo: bloqueado`,
            },
          },
          id: true,
        },
      } as never);
    }

    if (automation.stopAfterMatch && wasApplied) {
      break;
    }
  }

  return result;
};
