import { createHash, randomBytes } from 'node:crypto';

import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  AI_ACTION_EXECUTOR_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  AI_ACTION_EXECUTOR_ROUTE,
} from 'src/modules/ai-command-center/constants/ai-command-center.constants';
import { getAuthenticatedRequestIdentity } from 'src/modules/inbox/utils/evolution-environment';
import { AiActionStatus, AiActionType } from 'src/objects/ai-action.object';
import { appKeyValue } from 'src/utils/app-key-value';

type ExecuteAiActionRequest = {
  actionId?: unknown;
  previewOnly?: unknown;
  confirmExecute?: unknown;
  confirmationToken?: unknown;
  targetStage?: unknown;
};

type RecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

type RecordReference = {
  id: string;
  name?: string | RecordName | null;
};

type OpportunityReference = RecordReference & {
  stage?: string | null;
};

type WorkspaceMemberReference = RecordReference & {
  userId?: string | null;
};

type CrmContext = {
  company?: RecordReference | null;
  person?: RecordReference | null;
  opportunity?: OpportunityReference | null;
};

type AiActionForExecution = {
  id: string;
  name: string;
  type: string;
  status: string;
  confidence?: number | null;
  requiresApproval: boolean;
  rationale?: { markdown?: string | null } | null;
  proposedAction?: { markdown?: string | null } | null;
  approvalNotes?: { markdown?: string | null } | null;
  requestedAt?: string | null;
  approvedAt?: string | null;
  executedAt?: string | null;
  executionReceipt?: { markdown?: string | null } | null;
  reviewer?: WorkspaceMemberReference | null;
  executor?: WorkspaceMemberReference | null;
  executionTask?: {
    id: string;
    title?: string | null;
    dueAt?: string | null;
    status?: string | null;
    assignee?: WorkspaceMemberReference | null;
  } | null;
  opportunity?:
    | (OpportunityReference & {
        company?: RecordReference | null;
        pointOfContact?: RecordReference | null;
      })
    | null;
  commercialSignal?: (RecordReference & CrmContext) | null;
  successPlan?:
    | (RecordReference & {
        company?: RecordReference | null;
        primaryContact?: RecordReference | null;
        owner?: WorkspaceMemberReference | null;
      })
    | null;
  customerRenewal?:
    | (RecordReference & {
        company?: RecordReference | null;
        owner?: WorkspaceMemberReference | null;
        successPlan?: RecordReference | null;
      })
    | null;
  inboxConversation?:
    | (RecordReference &
        CrmContext & {
          assignee?: WorkspaceMemberReference | null;
        })
    | null;
};

type TaskTargetPreview = {
  id: string;
  label: string;
  objectNameSingular: 'company' | 'person' | 'opportunity';
};

export type AiActionExecutionTaskPreview = {
  id: string;
  title: string;
  dueAt: string;
  assignee: WorkspaceMemberReference;
  targets: TaskTargetPreview[];
  body: string;
};

export type PipelineStageOption = {
  value: string;
  label: string;
  position: number;
  color?: string | null;
};

export type AiActionPipelineChangePreview = {
  opportunity: {
    id: string;
    name: string;
  };
  sourceStage: PipelineStageOption;
  targetStage: PipelineStageOption;
};

type ConfirmationRecordBase = {
  actionId: string;
  actionFingerprint: string;
  expiresAt: string;
  tokenHash: string;
  userId: string;
  userWorkspaceId: string;
  workspaceId: string;
};

type ConfirmationRecord =
  | (ConfirmationRecordBase & {
      executionKind: 'TASK';
      task: AiActionExecutionTaskPreview;
    })
  | (ConfirmationRecordBase & {
      executionKind: 'PIPELINE_UPDATE';
      pipelineChange: AiActionPipelineChangePreview;
    });

export type AiActionExecutionResult =
  | {
      mode: 'PREVIEW';
      supported: false;
      actionId: string;
      blockedReason: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      executionKind: 'TASK';
      actionId: string;
      task: AiActionExecutionTaskPreview;
      confirmationToken: string;
      expiresAt: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      executionKind: 'PIPELINE_UPDATE';
      actionId: string;
      requiresTargetStage: true;
      opportunity: AiActionPipelineChangePreview['opportunity'];
      currentStage: PipelineStageOption;
      stageOptions: PipelineStageOption[];
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      executionKind: 'PIPELINE_UPDATE';
      actionId: string;
      requiresTargetStage: false;
      pipelineChange: AiActionPipelineChangePreview;
      stageOptions: PipelineStageOption[];
      confirmationToken: string;
      expiresAt: string;
      message: string;
    }
  | {
      mode: 'APPLY';
      supported: true;
      executionKind: 'TASK' | 'PIPELINE_UPDATE';
      actionId: string;
      executed: true;
      alreadyExecuted: boolean;
      task: AiActionExecutionTaskPreview | null;
      pipelineChange: AiActionPipelineChangePreview | null;
      receipt: string;
      message: string;
    };

const EXECUTABLE_TYPES = new Set<string>([
  AiActionType.QUALIFY,
  AiActionType.FOLLOW_UP,
  AiActionType.RISK_MITIGATION,
  AiActionType.CS_INTERVENTION,
  AiActionType.EXPANSION,
  AiActionType.PIPELINE_UPDATE,
]);

const TYPE_LABELS: Record<string, string> = {
  [AiActionType.QUALIFY]: 'Qualificar',
  [AiActionType.REPLY]: 'Responder',
  [AiActionType.FOLLOW_UP]: 'Follow-up',
  [AiActionType.PIPELINE_UPDATE]: 'Atualizar pipeline',
  [AiActionType.RISK_MITIGATION]: 'Mitigar risco',
  [AiActionType.CS_INTERVENTION]: 'Intervenção de CS',
  [AiActionType.EXPANSION]: 'Expansão',
};

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const deterministicTaskId = (actionId: string): string => {
  const bytes = createHash('sha256')
    .update(`diex-ai-action-task:${actionId}`)
    .digest()
    .subarray(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
};

const confirmationKey = (actionId: string, userWorkspaceId: string): string =>
  `diex:ai-action-executor:confirmation:${actionId}:${userWorkspaceId}`;

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

const getUnsupportedReason = (action: AiActionForExecution): string | null => {
  if (action.status !== AiActionStatus.APPROVED) {
    return action.status === AiActionStatus.EXECUTED
      ? 'Esta proposta já possui recibo de execução.'
      : 'Somente propostas aprovadas podem ser executadas.';
  }

  if (action.type === AiActionType.REPLY) {
    return 'Respostas externas continuam na Inbox, com texto exato, consentimento, prévia e confirmação de envio.';
  }

  if (!EXECUTABLE_TYPES.has(action.type)) {
    return 'Este tipo de ação ainda não possui executor interno seguro.';
  }

  return null;
};

const loadAiAction = async (
  client: CoreApiClient,
  actionId: string,
): Promise<AiActionForExecution> => {
  const result = (await client.query({
    aiAction: {
      __args: { filter: { id: { eq: actionId } } },
      id: true,
      name: true,
      type: true,
      status: true,
      confidence: true,
      requiresApproval: true,
      rationale: { markdown: true },
      proposedAction: { markdown: true },
      approvalNotes: { markdown: true },
      requestedAt: true,
      approvedAt: true,
      executedAt: true,
      executionReceipt: { markdown: true },
      reviewer: {
        id: true,
        userId: true,
        name: { firstName: true, lastName: true },
      },
      executor: {
        id: true,
        userId: true,
        name: { firstName: true, lastName: true },
      },
      executionTask: {
        id: true,
        title: true,
        dueAt: true,
        status: true,
        assignee: {
          id: true,
          userId: true,
          name: { firstName: true, lastName: true },
        },
      },
      opportunity: {
        id: true,
        name: true,
        stage: true,
        company: { id: true, name: true },
        pointOfContact: {
          id: true,
          name: { firstName: true, lastName: true },
        },
      },
      commercialSignal: {
        id: true,
        name: true,
        company: { id: true, name: true },
        person: {
          id: true,
          name: { firstName: true, lastName: true },
        },
        opportunity: { id: true, name: true, stage: true },
      },
      successPlan: {
        id: true,
        name: true,
        company: { id: true, name: true },
        primaryContact: {
          id: true,
          name: { firstName: true, lastName: true },
        },
        owner: {
          id: true,
          userId: true,
          name: { firstName: true, lastName: true },
        },
      },
      customerRenewal: {
        id: true,
        name: true,
        company: { id: true, name: true },
        owner: {
          id: true,
          userId: true,
          name: { firstName: true, lastName: true },
        },
        successPlan: { id: true, name: true },
      },
      inboxConversation: {
        id: true,
        name: true,
        person: {
          id: true,
          name: { firstName: true, lastName: true },
        },
        company: { id: true, name: true },
        opportunity: { id: true, name: true, stage: true },
        assignee: {
          id: true,
          userId: true,
          name: { firstName: true, lastName: true },
        },
      },
    },
  } as never)) as unknown as {
    aiAction?: AiActionForExecution | null;
  };

  if (!result.aiAction?.id) {
    throw new Error('A ação de IA não foi encontrada neste workspace.');
  }

  return result.aiAction;
};

const loadCurrentWorkspaceMember = async (
  client: CoreApiClient,
  userId: string,
): Promise<WorkspaceMemberReference> => {
  const result = (await client.query({
    workspaceMembers: {
      __args: {
        filter: { userId: { eq: userId } },
        first: 1,
      },
      edges: {
        node: {
          id: true,
          userId: true,
          name: { firstName: true, lastName: true },
        },
      },
    },
  } as never)) as unknown as {
    workspaceMembers?: {
      edges?: Array<{ node: WorkspaceMemberReference }>;
    };
  };
  const member = result.workspaceMembers?.edges?.[0]?.node;

  if (!member?.id) {
    throw new Error(
      'Não foi possível identificar o membro que está executando a ação.',
    );
  }

  return member;
};

const collectPipelineOpportunities = (
  action: AiActionForExecution,
): OpportunityReference[] => {
  const opportunities = new Map<string, OpportunityReference>();

  [
    action.opportunity,
    action.commercialSignal?.opportunity,
    action.inboxConversation?.opportunity,
  ].forEach((opportunity) => {
    if (opportunity?.id && !opportunities.has(opportunity.id)) {
      opportunities.set(opportunity.id, opportunity);
    }
  });

  return [...opportunities.values()];
};

const getPipelineOpportunity = (
  action: AiActionForExecution,
): OpportunityReference => {
  const opportunities = collectPipelineOpportunities(action);

  if (opportunities.length === 0) {
    throw new Error(
      'Vincule uma oportunidade à ação antes de alterar o pipeline.',
    );
  }

  if (opportunities.length > 1) {
    throw new Error(
      'A ação referencia mais de uma oportunidade. Mantenha apenas um destino antes de executar.',
    );
  }

  return opportunities[0];
};

const getOptionLabel = (label: unknown, fallback: string): string => {
  if (typeof label === 'string' && label.trim()) {
    return label.trim();
  }

  if (label && typeof label === 'object') {
    const values = Object.values(label);
    const translated = values.find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    );

    if (translated) {
      return translated.trim();
    }
  }

  return fallback;
};

const loadOpportunityStageOptions = async (): Promise<
  PipelineStageOption[]
> => {
  const metadata = (await new MetadataApiClient().query({
    objects: {
      __args: {
        paging: { first: 500 },
        filter: { isActive: { is: true } },
      },
      edges: {
        node: {
          nameSingular: true,
          fieldsList: {
            name: true,
            type: true,
            isActive: true,
            options: true,
          },
        },
      },
    },
  } as never)) as unknown as {
    objects?: {
      edges?: Array<{
        node?: {
          nameSingular?: string | null;
          fieldsList?: Array<{
            name?: string | null;
            type?: string | null;
            isActive?: boolean | null;
            options?: unknown;
          }>;
        } | null;
      }>;
    };
  };
  const opportunityObject = metadata.objects?.edges
    ?.map(({ node }) => node)
    .find((node) => node?.nameSingular === 'opportunity');
  const stageField = opportunityObject?.fieldsList?.find(
    ({ name, type, isActive }) =>
      name === 'stage' && type === 'SELECT' && isActive !== false,
  );

  if (!stageField || !Array.isArray(stageField.options)) {
    throw new Error(
      'O campo de etapa da oportunidade não está disponível neste workspace.',
    );
  }

  const uniqueOptions = new Map<string, PipelineStageOption>();

  stageField.options.forEach((rawOption, index) => {
    if (!rawOption || typeof rawOption !== 'object') {
      return;
    }

    const option = rawOption as {
      value?: unknown;
      label?: unknown;
      position?: unknown;
      color?: unknown;
    };
    const value = typeof option.value === 'string' ? option.value.trim() : '';

    if (!value || uniqueOptions.has(value)) {
      return;
    }

    uniqueOptions.set(value, {
      value,
      label: getOptionLabel(option.label, value),
      position:
        typeof option.position === 'number' && Number.isFinite(option.position)
          ? option.position
          : index,
      color: typeof option.color === 'string' ? option.color : null,
    });
  });

  const options = [...uniqueOptions.values()].sort(
    (left, right) => left.position - right.position,
  );

  if (options.length === 0) {
    throw new Error(
      'Cadastre ao menos uma etapa válida para oportunidades antes de executar.',
    );
  }

  return options;
};

const loadLiveOpportunity = async (
  client: CoreApiClient,
  opportunityId: string,
): Promise<OpportunityReference> => {
  const result = (await client.query({
    opportunity: {
      __args: { filter: { id: { eq: opportunityId } } },
      id: true,
      name: true,
      stage: true,
    },
  } as never)) as unknown as {
    opportunity?: OpportunityReference | null;
  };

  if (!result.opportunity?.id) {
    throw new Error(
      'A oportunidade vinculada não existe mais neste workspace.',
    );
  }

  return result.opportunity;
};

const getStageOption = (
  options: PipelineStageOption[],
  value: string | null | undefined,
): PipelineStageOption => {
  const normalizedValue = value?.trim() ?? '';

  if (!normalizedValue) {
    throw new Error('A oportunidade não possui uma etapa atual válida.');
  }

  return (
    options.find((option) => option.value === normalizedValue) ?? {
      value: normalizedValue,
      label: normalizedValue,
      position: -1,
      color: null,
    }
  );
};

const collectTaskTargets = (
  action: AiActionForExecution,
): TaskTargetPreview[] => {
  const targets = new Map<string, TaskTargetPreview>();
  const add = (
    objectNameSingular: TaskTargetPreview['objectNameSingular'],
    record?: RecordReference | null,
  ) => {
    if (!record?.id) {
      return;
    }

    const fallbackLabel =
      objectNameSingular === 'company'
        ? 'Empresa'
        : objectNameSingular === 'person'
          ? 'Pessoa'
          : 'Oportunidade';

    targets.set(`${objectNameSingular}:${record.id}`, {
      id: record.id,
      label: getRecordName(record) || fallbackLabel,
      objectNameSingular,
    });
  };

  add('opportunity', action.opportunity);
  add('company', action.opportunity?.company);
  add('person', action.opportunity?.pointOfContact);

  add('company', action.commercialSignal?.company);
  add('person', action.commercialSignal?.person);
  add('opportunity', action.commercialSignal?.opportunity);

  add('company', action.successPlan?.company);
  add('person', action.successPlan?.primaryContact);

  add('company', action.customerRenewal?.company);

  add('company', action.inboxConversation?.company);
  add('person', action.inboxConversation?.person);
  add('opportunity', action.inboxConversation?.opportunity);

  return [...targets.values()];
};

const getDueAt = (type: string): string => {
  const delayHours =
    type === AiActionType.RISK_MITIGATION ||
    type === AiActionType.CS_INTERVENTION
      ? 4
      : type === AiActionType.EXPANSION
        ? 48
        : 24;

  return new Date(Date.now() + delayHours * 60 * 60_000).toISOString();
};

const getContextLines = (action: AiActionForExecution): string[] => {
  const records = [
    ['Oportunidade', action.opportunity],
    ['Sinal comercial', action.commercialSignal],
    ['Plano de sucesso', action.successPlan],
    ['Renovação', action.customerRenewal],
    ['Conversa', action.inboxConversation],
  ] as const;

  return records.flatMap(([label, record]) =>
    record?.id ? [`${label}: ${getRecordName(record) || record.id}`] : [],
  );
};

const buildTaskPreview = (
  action: AiActionForExecution,
  executor: WorkspaceMemberReference,
): AiActionExecutionTaskPreview => {
  const assignee =
    action.inboxConversation?.assignee ??
    action.customerRenewal?.owner ??
    action.successPlan?.owner ??
    action.reviewer ??
    executor;
  const title = `IA · ${action.name}`.slice(0, 255);
  const body = [
    'Próxima ação interna criada após aprovação humana no Centro de IA Diex.',
    `Tipo: ${TYPE_LABELS[action.type] ?? action.type}`,
    typeof action.confidence === 'number'
      ? `Confiança registrada: ${Math.round(action.confidence)}%`
      : null,
    action.proposedAction?.markdown
      ? `Ação aprovada:\n${action.proposedAction.markdown}`
      : null,
    action.rationale?.markdown
      ? `Evidência:\n${action.rationale.markdown}`
      : null,
    action.approvalNotes?.markdown
      ? `Condição da aprovação:\n${action.approvalNotes.markdown}`
      : null,
    ...getContextLines(action),
    'Governança: nenhum e-mail, WhatsApp ou mudança de pipeline foi executado automaticamente.',
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n\n');

  return {
    id: deterministicTaskId(action.id),
    title,
    dueAt: getDueAt(action.type),
    assignee,
    targets: collectTaskTargets(action),
    body,
  };
};

const getActionFingerprint = (action: AiActionForExecution): string =>
  sha256(
    JSON.stringify({
      id: action.id,
      name: action.name,
      type: action.type,
      status: action.status,
      confidence: action.confidence ?? null,
      rationale: action.rationale?.markdown ?? null,
      proposedAction: action.proposedAction?.markdown ?? null,
      approvalNotes: action.approvalNotes?.markdown ?? null,
      approvedAt: action.approvedAt ?? null,
      reviewerId: action.reviewer?.id ?? null,
      context: getContextLines(action),
      pipelineOpportunities: collectPipelineOpportunities(action).map(
        ({ id, stage }) => ({ id, stage: stage ?? null }),
      ),
      targets: collectTaskTargets(action),
      assigneeId:
        action.inboxConversation?.assignee?.id ??
        action.customerRenewal?.owner?.id ??
        action.successPlan?.owner?.id ??
        action.reviewer?.id ??
        null,
    }),
  );

const loadTask = async (
  client: CoreApiClient,
  taskId: string,
): Promise<{
  id: string;
  title?: string | null;
  dueAt?: string | null;
  assignee?: WorkspaceMemberReference | null;
} | null> => {
  const result = (await client.query({
    task: {
      __args: { filter: { id: { eq: taskId } } },
      id: true,
      title: true,
      dueAt: true,
      assignee: {
        id: true,
        userId: true,
        name: { firstName: true, lastName: true },
      },
    },
  } as never)) as unknown as {
    task?: {
      id: string;
      title?: string | null;
      dueAt?: string | null;
      assignee?: WorkspaceMemberReference | null;
    } | null;
  };

  return result.task?.id ? result.task : null;
};

const ensureTaskTarget = async (
  client: CoreApiClient,
  taskId: string,
  target: TaskTargetPreview,
): Promise<boolean> => {
  const relationFilter =
    target.objectNameSingular === 'company'
      ? { targetCompanyId: { eq: target.id } }
      : target.objectNameSingular === 'person'
        ? { targetPersonId: { eq: target.id } }
        : { targetOpportunityId: { eq: target.id } };
  const existing = (await client.query({
    taskTargets: {
      __args: {
        filter: {
          taskId: { eq: taskId },
          ...relationFilter,
        },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  } as never)) as unknown as {
    taskTargets?: { edges?: Array<{ node: { id?: string | null } }> };
  };

  if (existing.taskTargets?.edges?.[0]?.node.id) {
    return false;
  }

  const relationData =
    target.objectNameSingular === 'company'
      ? { targetCompanyId: target.id }
      : target.objectNameSingular === 'person'
        ? { targetPersonId: target.id }
        : { targetOpportunityId: target.id };

  await client.mutation({
    createTaskTarget: {
      __args: {
        data: {
          taskId,
          ...relationData,
        },
      },
      id: true,
    },
  } as never);

  return true;
};

const toExecutedTaskPreview = (
  action: AiActionForExecution,
): AiActionExecutionTaskPreview | null => {
  const task = action.executionTask;

  if (!task?.id) {
    return null;
  }

  return {
    id: task.id,
    title: task.title || `Execução de ${action.name}`,
    dueAt: task.dueAt || action.executedAt || new Date().toISOString(),
    assignee: task.assignee ??
      action.executor ??
      action.reviewer ?? {
        id: '',
        name: 'Sem responsável',
      },
    targets: collectTaskTargets(action),
    body: action.executionReceipt?.markdown ?? '',
  };
};

const executeConfirmedAction = async ({
  client,
  action,
  executor,
  task,
}: {
  client: CoreApiClient;
  action: AiActionForExecution;
  executor: WorkspaceMemberReference;
  task: AiActionExecutionTaskPreview;
}): Promise<AiActionExecutionResult> => {
  const existingTask = await loadTask(client, task.id);

  if (!existingTask) {
    await client.mutation({
      createTask: {
        __args: {
          data: {
            id: task.id,
            title: task.title,
            status: 'TODO',
            dueAt: task.dueAt,
            assigneeId: task.assignee.id,
            bodyV2: {
              markdown: task.body,
              blocknote: null,
            },
          },
        },
        id: true,
      },
    } as never);
  }

  const targetResults = await Promise.allSettled(
    task.targets.map((target) => ensureTaskTarget(client, task.id, target)),
  );
  const failedTargets = targetResults.filter(
    ({ status }) => status === 'rejected',
  ).length;
  const executedAt = new Date().toISOString();
  const executorName = getRecordName(executor) || executor.id;
  const receipt = [
    `Executada em ${executedAt} por ${executorName}.`,
    `Tarefa interna: ${task.title} (${task.id}).`,
    `Prazo: ${task.dueAt}.`,
    `Responsável: ${getRecordName(task.assignee) || task.assignee.id}.`,
    `Vínculos CRM: ${task.targets.length - failedTargets}/${task.targets.length}.`,
    failedTargets > 0
      ? `${failedTargets} vínculo(s) não puderam ser criado(s); a tarefa permanece válida para tratamento.`
      : null,
    'Efeito aplicado: tarefa interna criada no CRM.',
    'Efeitos bloqueados: nenhum envio externo e nenhuma mudança automática de pipeline.',
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');

  await client.mutation({
    updateAiAction: {
      __args: {
        id: action.id,
        data: {
          status: AiActionStatus.EXECUTED,
          executedAt,
          executorId: executor.id,
          executionTaskId: task.id,
          executionReceipt: {
            markdown: receipt,
            blocknote: null,
          },
        },
      },
      id: true,
    },
  } as never);

  return {
    mode: 'APPLY',
    supported: true,
    executionKind: 'TASK',
    actionId: action.id,
    executed: true,
    alreadyExecuted: Boolean(existingTask),
    task,
    pipelineChange: null,
    receipt,
    message: existingTask
      ? 'A tarefa idempotente foi reconciliada e o recibo foi registrado.'
      : 'A tarefa interna foi criada e o recibo foi registrado.',
  };
};

const compareAndSetOpportunityStage = async ({
  client,
  opportunityId,
  expectedStage,
  targetStage,
}: {
  client: CoreApiClient;
  opportunityId: string;
  expectedStage: string;
  targetStage: string;
}): Promise<boolean> => {
  const result = (await client.mutation({
    updateOpportunities: {
      __args: {
        filter: {
          and: [
            { id: { eq: opportunityId } },
            { stage: { eq: expectedStage } },
          ],
        },
        data: { stage: targetStage },
      },
      id: true,
      stage: true,
    },
  } as never)) as unknown as {
    updateOpportunities?: Array<{ id?: string | null; stage?: string | null }>;
  };

  return Boolean(
    result.updateOpportunities?.some(
      ({ id, stage }) => id === opportunityId && stage === targetStage,
    ),
  );
};

const executeConfirmedPipelineUpdate = async ({
  client,
  action,
  executor,
  pipelineChange,
}: {
  client: CoreApiClient;
  action: AiActionForExecution;
  executor: WorkspaceMemberReference;
  pipelineChange: AiActionPipelineChangePreview;
}): Promise<AiActionExecutionResult> => {
  const liveOpportunity = await loadLiveOpportunity(
    client,
    pipelineChange.opportunity.id,
  );

  if (liveOpportunity.stage !== pipelineChange.sourceStage.value) {
    throw new Error(
      `A oportunidade mudou de etapa depois da prévia. Atual: ${liveOpportunity.stage ?? 'sem etapa'}. Gere uma nova confirmação.`,
    );
  }

  const stageUpdated = await compareAndSetOpportunityStage({
    client,
    opportunityId: pipelineChange.opportunity.id,
    expectedStage: pipelineChange.sourceStage.value,
    targetStage: pipelineChange.targetStage.value,
  });

  if (!stageUpdated) {
    throw new Error(
      'A etapa foi alterada por outra operação. Nenhuma mudança da IA foi aplicada; gere uma nova prévia.',
    );
  }

  const executedAt = new Date().toISOString();
  const executorName = getRecordName(executor) || executor.id;
  const receipt = [
    `Executada em ${executedAt} por ${executorName}.`,
    `Oportunidade: ${pipelineChange.opportunity.name} (${pipelineChange.opportunity.id}).`,
    `Etapa anterior: ${pipelineChange.sourceStage.label} (${pipelineChange.sourceStage.value}).`,
    `Nova etapa: ${pipelineChange.targetStage.label} (${pipelineChange.targetStage.value}).`,
    'Efeito aplicado: etapa da oportunidade atualizada no pipeline.',
    'Governança: origem e destino vieram dos metadados atuais do workspace; a confirmação foi individual, explícita e consumida uma única vez.',
    'Efeitos bloqueados: nenhum e-mail, WhatsApp ou outro efeito externo.',
  ].join('\n');

  try {
    await client.mutation({
      updateAiAction: {
        __args: {
          id: action.id,
          data: {
            status: AiActionStatus.EXECUTED,
            executedAt,
            executorId: executor.id,
            executionReceipt: {
              markdown: receipt,
              blocknote: null,
            },
          },
        },
        id: true,
      },
    } as never);
  } catch {
    const rolledBack = await compareAndSetOpportunityStage({
      client,
      opportunityId: pipelineChange.opportunity.id,
      expectedStage: pipelineChange.targetStage.value,
      targetStage: pipelineChange.sourceStage.value,
    }).catch(() => false);

    throw new Error(
      rolledBack
        ? 'O recibo não pôde ser registrado; a oportunidade foi devolvida à etapa anterior.'
        : 'O recibo não pôde ser registrado e a reversão segura falhou. Verifique a oportunidade antes de tentar novamente.',
    );
  }

  return {
    mode: 'APPLY',
    supported: true,
    executionKind: 'PIPELINE_UPDATE',
    actionId: action.id,
    executed: true,
    alreadyExecuted: false,
    task: null,
    pipelineChange,
    receipt,
    message: `Oportunidade movida de ${pipelineChange.sourceStage.label} para ${pipelineChange.targetStage.label}.`,
  };
};

export const executeAiActionHandler = async (
  routePayload: RoutePayload<ExecuteAiActionRequest>,
): Promise<AiActionExecutionResult> => {
  const identity = getAuthenticatedRequestIdentity(
    routePayload.userWorkspaceId,
  );
  const actionId =
    typeof routePayload.body?.actionId === 'string'
      ? routePayload.body.actionId.trim()
      : '';

  if (!actionId) {
    throw new Error('Selecione uma ação de IA válida.');
  }

  const client = new CoreApiClient();
  const [action, executor] = await Promise.all([
    loadAiAction(client, actionId),
    loadCurrentWorkspaceMember(client, identity.userId),
  ]);
  const previewOnly = routePayload.body?.previewOnly !== false;

  if (!previewOnly && action.status === AiActionStatus.EXECUTED) {
    const executionKind =
      action.type === AiActionType.PIPELINE_UPDATE ? 'PIPELINE_UPDATE' : 'TASK';

    return {
      mode: 'APPLY',
      supported: true,
      executionKind,
      actionId,
      executed: true,
      alreadyExecuted: true,
      task: toExecutedTaskPreview(action),
      pipelineChange: null,
      receipt:
        action.executionReceipt?.markdown ??
        'A ação já havia sido executada neste workspace.',
      message: 'A ação já havia sido executada; nenhum efeito foi duplicado.',
    };
  }

  const blockedReason = getUnsupportedReason(action);

  if (blockedReason) {
    if (!previewOnly) {
      throw new Error(blockedReason);
    }

    return {
      mode: 'PREVIEW',
      supported: false,
      actionId,
      blockedReason,
      message: 'A execução direta foi bloqueada pela política de governança.',
    };
  }

  if (previewOnly) {
    if (action.type === AiActionType.PIPELINE_UPDATE) {
      const key = confirmationKey(actionId, identity.userWorkspaceId);

      await appKeyValue.delete(key).catch(() => false);

      try {
        const pipelineOpportunity = getPipelineOpportunity(action);
        const [liveOpportunity, stageOptions] = await Promise.all([
          loadLiveOpportunity(client, pipelineOpportunity.id),
          loadOpportunityStageOptions(),
        ]);

        pipelineOpportunity.stage = liveOpportunity.stage;
        const currentStage = getStageOption(
          stageOptions,
          liveOpportunity.stage,
        );
        const opportunity = {
          id: liveOpportunity.id,
          name:
            getRecordName(liveOpportunity) ||
            getRecordName(pipelineOpportunity) ||
            'Oportunidade sem nome',
        };
        const targetStageValue =
          typeof routePayload.body?.targetStage === 'string'
            ? routePayload.body.targetStage.trim()
            : '';

        if (!targetStageValue) {
          return {
            mode: 'PREVIEW',
            supported: true,
            executionKind: 'PIPELINE_UPDATE',
            actionId,
            requiresTargetStage: true,
            opportunity,
            currentStage,
            stageOptions,
            message:
              'Selecione a etapa de destino. Nenhuma mudança foi aplicada.',
          };
        }

        const targetStage = stageOptions.find(
          ({ value }) => value === targetStageValue,
        );

        if (!targetStage) {
          throw new Error('A etapa escolhida não existe mais neste workspace.');
        }

        if (targetStage.value === currentStage.value) {
          throw new Error(
            'A etapa de destino deve ser diferente da etapa atual.',
          );
        }

        const confirmationToken = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
        const pipelineChange: AiActionPipelineChangePreview = {
          opportunity,
          sourceStage: currentStage,
          targetStage,
        };
        const confirmation: ConfirmationRecord = {
          actionId,
          actionFingerprint: getActionFingerprint(action),
          expiresAt,
          tokenHash: sha256(confirmationToken),
          userId: identity.userId,
          userWorkspaceId: identity.userWorkspaceId,
          workspaceId: identity.workspaceId,
          executionKind: 'PIPELINE_UPDATE',
          pipelineChange,
        };

        await appKeyValue.set(key, confirmation);

        return {
          mode: 'PREVIEW',
          supported: true,
          executionKind: 'PIPELINE_UPDATE',
          actionId,
          requiresTargetStage: false,
          pipelineChange,
          stageOptions,
          confirmationToken,
          expiresAt,
          message:
            'Revise a oportunidade, a etapa atual e o destino antes de confirmar.',
        };
      } catch (error) {
        const blockedReason =
          error instanceof Error
            ? error.message
            : 'A mudança de pipeline não pôde ser estruturada.';

        return {
          mode: 'PREVIEW',
          supported: false,
          actionId,
          blockedReason,
          message:
            'A mudança de pipeline foi bloqueada antes de alterar o CRM.',
        };
      }
    }

    const confirmationToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const task = buildTaskPreview(action, executor);
    const confirmation: ConfirmationRecord = {
      actionId,
      actionFingerprint: getActionFingerprint(action),
      expiresAt,
      tokenHash: sha256(confirmationToken),
      userId: identity.userId,
      userWorkspaceId: identity.userWorkspaceId,
      workspaceId: identity.workspaceId,
      executionKind: 'TASK',
      task,
    };

    await appKeyValue.set(
      confirmationKey(actionId, identity.userWorkspaceId),
      confirmation,
    );

    return {
      mode: 'PREVIEW',
      supported: true,
      executionKind: 'TASK',
      actionId,
      task,
      confirmationToken,
      expiresAt,
      message:
        'Revise a tarefa interna e confirme. Nenhum efeito foi aplicado nesta prévia.',
    };
  }

  if (
    routePayload.body?.confirmExecute !== true ||
    typeof routePayload.body.confirmationToken !== 'string' ||
    routePayload.body.confirmationToken.length < 32
  ) {
    throw new Error('A confirmação explícita da execução é obrigatória.');
  }

  const key = confirmationKey(actionId, identity.userWorkspaceId);
  const confirmation = await appKeyValue.get<ConfirmationRecord>(key);

  if (
    !confirmation ||
    confirmation.actionId !== actionId ||
    confirmation.tokenHash !== sha256(routePayload.body.confirmationToken) ||
    confirmation.userId !== identity.userId ||
    confirmation.userWorkspaceId !== identity.userWorkspaceId ||
    confirmation.workspaceId !== identity.workspaceId ||
    new Date(confirmation.expiresAt).getTime() <= Date.now()
  ) {
    throw new Error(
      'A confirmação é inválida ou expirou. Gere uma nova prévia.',
    );
  }

  if (confirmation.actionFingerprint !== getActionFingerprint(action)) {
    await appKeyValue.delete(key).catch(() => false);
    throw new Error(
      'A proposta mudou depois da prévia. Revise e gere uma nova confirmação.',
    );
  }

  const expectedExecutionKind =
    action.type === AiActionType.PIPELINE_UPDATE ? 'PIPELINE_UPDATE' : 'TASK';

  if (confirmation.executionKind !== expectedExecutionKind) {
    await appKeyValue.delete(key).catch(() => false);
    throw new Error(
      'O tipo de execução mudou depois da prévia. Gere uma nova confirmação.',
    );
  }

  await appKeyValue.delete(key);

  if (confirmation.executionKind === 'PIPELINE_UPDATE') {
    return executeConfirmedPipelineUpdate({
      client,
      action,
      executor,
      pipelineChange: confirmation.pipelineChange,
    });
  }

  return executeConfirmedAction({
    client,
    action,
    executor,
    task: confirmation.task,
  });
};

export default defineLogicFunction({
  universalIdentifier: AI_ACTION_EXECUTOR_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'execute-diex-ai-action',
  description:
    'Previews and executes approved internal CRM tasks or compare-and-set opportunity stage changes with explicit confirmation, ownership and receipt; external communication remains blocked.',
  timeoutSeconds: 30,
  handler: executeAiActionHandler,
  httpRouteTriggerSettings: {
    path: AI_ACTION_EXECUTOR_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
