import { createHash, randomBytes } from 'node:crypto';

import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { CUSTOMER_SUCCESS_HANDOFF_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import { appKeyValue } from 'src/utils/app-key-value';

export type CustomerSuccessHandoffInput = {
  opportunityId: string;
  ownerId: string;
  renewalDate: string;
  recurringRevenueMicros: number;
  currencyCode: string;
  objectives: string;
  successCriteria: string;
  previewOnly?: boolean;
  confirmCreate?: boolean;
  confirmationToken?: string;
  confirmationScope?: string;
};

type RecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

type RecordReference = {
  id: string;
  name?: string | RecordName | null;
};

type MoneyValue = {
  amountMicros?: number | null;
  currencyCode?: string | null;
};

type HandoffOpportunity = {
  id: string;
  name?: string | null;
  stage?: string | null;
  updatedAt?: string | null;
  closeDate?: string | null;
  amount?: MoneyValue | null;
  company?:
    | (RecordReference & {
        diexLifecycle?: string | null;
      })
    | null;
  pointOfContact?: RecordReference | null;
  owner?: RecordReference | null;
  diexOffer?:
    | (RecordReference & {
        pricingModel?: string | null;
      })
    | null;
};

type HandoffDraft = {
  owner: RecordReference;
  renewalDate: string;
  recurringRevenueMicros: number;
  currencyCode: string;
  objectives: string;
  successCriteria: string;
};

export type CustomerSuccessHandoffMilestonePreview = {
  id: string;
  name: string;
  category: string;
  dueAt: string;
};

export type CustomerSuccessHandoffPreview = {
  opportunity: {
    id: string;
    name: string;
    companyId: string;
    companyName: string;
    contactId?: string;
    contactName?: string;
    offerName?: string;
  };
  plan: {
    id: string;
    name: string;
    owner: RecordReference;
    startDate: string;
    renewalDate: string;
    nextReviewAt: string;
    recurringRevenueMicros: number;
    currencyCode: string;
    objectives: string;
    successCriteria: string;
  };
  milestones: CustomerSuccessHandoffMilestonePreview[];
  task: {
    id: string;
    title: string;
    dueAt: string;
    assignee: RecordReference;
  };
  warnings: string[];
};

export type CustomerSuccessHandoffResult =
  | {
      mode: 'PREVIEW';
      supported: false;
      opportunityId: string;
      existingPlanId?: string;
      blockedReason: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      opportunityId: string;
      preview: CustomerSuccessHandoffPreview;
      confirmationToken: string;
      expiresAt: string;
      message: string;
    }
  | {
      mode: 'APPLY';
      supported: true;
      opportunityId: string;
      created: true;
      alreadyCreated: boolean;
      successPlanId: string;
      taskId?: string;
      milestonesCreated: number;
      milestonesExpected: number;
      warnings: string[];
      receipt: string;
      message: string;
    };

type HandoffConfirmation = {
  opportunityId: string;
  fingerprint: string;
  preview: CustomerSuccessHandoffPreview;
  tokenHash: string;
  expiresAt: string;
  confirmationScope: string;
};

const DAY_MILLISECONDS = 86_400_000;
const MAX_RECURRING_REVENUE_MICROS = 1_000_000_000_000_000;

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const deterministicUuid = (namespace: string): string => {
  const bytes = createHash('sha256').update(namespace).digest().subarray(0, 16);

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

const parseDateOnly = (value: string, fieldLabel: string): Date => {
  const normalized = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldLabel} deve usar o formato AAAA-MM-DD.`);
  }

  const date = new Date(`${normalized}T12:00:00.000Z`);

  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw new Error(`${fieldLabel} não é uma data válida.`);
  }

  return date;
};

const dateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * DAY_MILLISECONDS);

const normalizeText = (
  value: string,
  fieldLabel: string,
  minimumLength = 10,
): string => {
  const normalized = value.trim();

  if (normalized.length < minimumLength || normalized.length > 5_000) {
    throw new Error(
      `${fieldLabel} deve ter entre ${minimumLength} e 5.000 caracteres.`,
    );
  }

  return normalized;
};

const normalizeDraft = (
  input: CustomerSuccessHandoffInput,
): Omit<HandoffDraft, 'owner'> & { ownerId: string } => {
  const ownerId = input.ownerId?.trim();
  const currencyCode = input.currencyCode?.trim().toUpperCase();
  const recurringRevenueMicros = Math.round(input.recurringRevenueMicros);
  const startDate = parseDateOnly(dateOnly(new Date()), 'Data de início');
  const renewalDate = parseDateOnly(
    input.renewalDate ?? '',
    'Data de renovação',
  );

  if (!ownerId) {
    throw new Error('Selecione um responsável de Customer Success.');
  }

  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    throw new Error('A moeda deve usar um código ISO de três letras.');
  }

  if (
    !Number.isFinite(recurringRevenueMicros) ||
    recurringRevenueMicros < 0 ||
    recurringRevenueMicros > MAX_RECURRING_REVENUE_MICROS
  ) {
    throw new Error('A receita recorrente informada não é válida.');
  }

  if (renewalDate.getTime() <= startDate.getTime()) {
    throw new Error('A renovação precisa ocorrer depois do início do plano.');
  }

  return {
    ownerId,
    renewalDate: dateOnly(renewalDate),
    recurringRevenueMicros,
    currencyCode,
    objectives: normalizeText(input.objectives ?? '', 'Objetivos'),
    successCriteria: normalizeText(
      input.successCriteria ?? '',
      'Critérios de sucesso',
    ),
  };
};

const loadOpportunity = async (
  client: CoreApiClient,
  opportunityId: string,
): Promise<HandoffOpportunity> => {
  const result = (await client.query({
    opportunity: {
      __args: { filter: { id: { eq: opportunityId } } },
      id: true,
      name: true,
      stage: true,
      updatedAt: true,
      closeDate: true,
      amount: { amountMicros: true, currencyCode: true },
      company: {
        id: true,
        name: true,
        diexLifecycle: true,
      },
      pointOfContact: {
        id: true,
        name: { firstName: true, lastName: true },
      },
      owner: {
        id: true,
        name: { firstName: true, lastName: true },
      },
      diexOffer: {
        id: true,
        name: true,
        pricingModel: true,
      },
    },
  } as never)) as unknown as {
    opportunity?: HandoffOpportunity | null;
  };

  if (!result.opportunity?.id) {
    throw new Error('A oportunidade não foi encontrada neste workspace.');
  }

  return result.opportunity;
};

const loadOwner = async (
  client: CoreApiClient,
  ownerId: string,
): Promise<RecordReference> => {
  const result = (await client.query({
    workspaceMembers: {
      __args: {
        filter: { id: { eq: ownerId } },
        first: 1,
      },
      edges: {
        node: {
          id: true,
          name: { firstName: true, lastName: true },
        },
      },
    },
  } as never)) as unknown as {
    workspaceMembers?: {
      edges?: Array<{ node?: RecordReference | null }>;
    };
  };
  const owner = result.workspaceMembers?.edges?.[0]?.node;

  if (!owner?.id) {
    throw new Error(
      'O responsável de Customer Success não está mais disponível.',
    );
  }

  return owner;
};

const loadExistingSuccessPlan = async (
  client: CoreApiClient,
  opportunityId: string,
): Promise<{ id: string; name?: string | null } | null> => {
  const result = (await client.query({
    successPlans: {
      __args: {
        filter: { opportunityId: { eq: opportunityId } },
        first: 1,
      },
      edges: { node: { id: true, name: true } },
    },
  } as never)) as unknown as {
    successPlans?: {
      edges?: Array<{
        node?: { id?: string | null; name?: string | null } | null;
      }>;
    };
  };
  const plan = result.successPlans?.edges?.[0]?.node;

  return plan?.id ? { id: plan.id, name: plan.name } : null;
};

const getContextFingerprint = ({
  opportunity,
  existingPlanId,
  draft,
}: {
  opportunity: HandoffOpportunity;
  existingPlanId: string | null;
  draft: HandoffDraft;
}): string =>
  sha256(
    JSON.stringify({
      opportunity: {
        id: opportunity.id,
        name: opportunity.name ?? null,
        stage: opportunity.stage ?? null,
        updatedAt: opportunity.updatedAt ?? null,
        closeDate: opportunity.closeDate ?? null,
        amount: opportunity.amount ?? null,
        companyId: opportunity.company?.id ?? null,
        companyLifecycle: opportunity.company?.diexLifecycle ?? null,
        contactId: opportunity.pointOfContact?.id ?? null,
        offerId: opportunity.diexOffer?.id ?? null,
        pricingModel: opportunity.diexOffer?.pricingModel ?? null,
      },
      existingPlanId,
      draft: {
        ownerId: draft.owner.id,
        renewalDate: draft.renewalDate,
        recurringRevenueMicros: draft.recurringRevenueMicros,
        currencyCode: draft.currencyCode,
        objectives: draft.objectives,
        successCriteria: draft.successCriteria,
      },
    }),
  );

const getConfirmationScope = (input: CustomerSuccessHandoffInput): string =>
  input.confirmationScope?.trim() || 'mcp-tool';

const confirmationKey = (
  opportunityId: string,
  confirmationScope: string,
): string =>
  `diex:customer-success:handoff:${opportunityId}:${sha256(
    confirmationScope,
  ).slice(0, 24)}`;

const buildHandoffPreview = ({
  opportunity,
  draft,
}: {
  opportunity: HandoffOpportunity;
  draft: HandoffDraft;
}): CustomerSuccessHandoffPreview => {
  if (opportunity.stage !== 'CUSTOMER') {
    throw new Error(
      'Somente oportunidades em Fechado ganho podem entrar em Customer Success.',
    );
  }

  if (!opportunity.company?.id) {
    throw new Error(
      'Vincule uma empresa à oportunidade antes de iniciar o handoff.',
    );
  }

  const start = new Date(`${dateOnly(new Date())}T12:00:00.000Z`);
  const renewal = parseDateOnly(draft.renewalDate, 'Data de renovação');
  const opportunityName = opportunity.name?.trim() || 'Oportunidade sem nome';
  const companyName = getRecordName(opportunity.company) || 'Empresa sem nome';
  const planId = deterministicUuid(
    `diex-customer-success-plan:${opportunity.id}`,
  );
  const planName = `CS · ${companyName} · ${opportunityName}`.slice(0, 255);
  const milestoneDefinitions = [
    {
      key: 'kickoff',
      name: 'Kick-off e alinhamento de escopo',
      category: 'ONBOARDING',
      dueAt: addDays(start, 7),
    },
    {
      key: 'activation',
      name: 'Ativação operacional concluída',
      category: 'ACTIVATION',
      dueAt: addDays(start, 30),
    },
    {
      key: 'adoption',
      name: 'Adoção inicial validada',
      category: 'ADOPTION',
      dueAt: addDays(start, 60),
    },
    {
      key: 'value',
      name: 'Primeira evidência de valor reconhecida',
      category: 'VALUE',
      dueAt: addDays(start, 90),
    },
    {
      key: 'renewal',
      name: 'Renovação preparada com decisores',
      category: 'RENEWAL',
      dueAt: new Date(
        Math.max(
          addDays(start, 7).getTime(),
          renewal.getTime() - 90 * DAY_MILLISECONDS,
        ),
      ),
    },
  ];
  const warnings = [
    !opportunity.pointOfContact?.id
      ? 'O plano será criado sem contato principal; vincule o decisor após o handoff.'
      : null,
    draft.recurringRevenueMicros === 0
      ? 'A receita recorrente está zerada; o plano não entrará no valor acompanhado.'
      : null,
    !opportunity.closeDate
      ? 'A oportunidade não possui data de fechamento registrada.'
      : null,
    opportunity.diexOffer?.pricingModel === 'ONE_TIME'
      ? 'A oferta está marcada como pagamento único; confirme se existe receita recorrente.'
      : null,
  ].filter((warning): warning is string => Boolean(warning));

  return {
    opportunity: {
      id: opportunity.id,
      name: opportunityName,
      companyId: opportunity.company.id,
      companyName,
      contactId: opportunity.pointOfContact?.id,
      contactName: getRecordName(opportunity.pointOfContact) || undefined,
      offerName: getRecordName(opportunity.diexOffer) || undefined,
    },
    plan: {
      id: planId,
      name: planName,
      owner: draft.owner,
      startDate: dateOnly(start),
      renewalDate: draft.renewalDate,
      nextReviewAt: addDays(start, 7).toISOString(),
      recurringRevenueMicros: draft.recurringRevenueMicros,
      currencyCode: draft.currencyCode,
      objectives: draft.objectives,
      successCriteria: draft.successCriteria,
    },
    milestones: milestoneDefinitions.map((milestone) => ({
      id: deterministicUuid(
        `diex-customer-success-milestone:${opportunity.id}:${milestone.key}`,
      ),
      name: milestone.name,
      category: milestone.category,
      dueAt: milestone.dueAt.toISOString(),
    })),
    task: {
      id: deterministicUuid(
        `diex-customer-success-handoff-task:${opportunity.id}`,
      ),
      title: `Realizar kickoff · ${companyName}`.slice(0, 255),
      dueAt: addDays(start, 2).toISOString(),
      assignee: draft.owner,
    },
    warnings,
  };
};

const ensureSuccessPlan = async ({
  client,
  preview,
}: {
  client: CoreApiClient;
  preview: CustomerSuccessHandoffPreview;
}): Promise<{ id: string; created: boolean }> => {
  const existing = await loadExistingSuccessPlan(
    client,
    preview.opportunity.id,
  );

  if (existing) {
    return { id: existing.id, created: false };
  }

  try {
    const result = (await client.mutation({
      createSuccessPlan: {
        __args: {
          data: {
            id: preview.plan.id,
            name: preview.plan.name,
            lifecycle: 'ONBOARDING',
            health: 'UNKNOWN',
            recurringRevenue: {
              amountMicros: preview.plan.recurringRevenueMicros,
              currencyCode: preview.plan.currencyCode,
            },
            startDate: preview.plan.startDate,
            renewalDate: preview.plan.renewalDate,
            nextReviewAt: preview.plan.nextReviewAt,
            objectives: {
              markdown: preview.plan.objectives,
              blocknote: null,
            },
            successCriteria: {
              markdown: preview.plan.successCriteria,
              blocknote: null,
            },
            executiveSummary: {
              markdown: [
                'Plano criado pelo handoff comercial confirmado no Diex CRM.',
                `Oportunidade: ${preview.opportunity.name} (${preview.opportunity.id}).`,
                `Empresa: ${preview.opportunity.companyName}.`,
                preview.opportunity.contactName
                  ? `Contato principal: ${preview.opportunity.contactName}.`
                  : 'Contato principal: não informado.',
                preview.opportunity.offerName
                  ? `Oferta: ${preview.opportunity.offerName}.`
                  : 'Oferta: não vinculada.',
                `Responsável de CS: ${getRecordName(preview.plan.owner) || preview.plan.owner.id}.`,
                'Nenhuma comunicação externa foi enviada.',
              ].join('\n'),
              blocknote: null,
            },
            companyId: preview.opportunity.companyId,
            primaryContactId: preview.opportunity.contactId ?? null,
            ownerId: preview.plan.owner.id,
            opportunityId: preview.opportunity.id,
          },
        },
        id: true,
      },
    } as never)) as unknown as {
      createSuccessPlan?: { id?: string | null } | null;
    };

    if (!result.createSuccessPlan?.id) {
      throw new Error('O plano de sucesso não retornou um identificador.');
    }

    return { id: result.createSuccessPlan.id, created: true };
  } catch (error) {
    const concurrentlyCreated = await loadExistingSuccessPlan(
      client,
      preview.opportunity.id,
    );

    if (concurrentlyCreated) {
      return { id: concurrentlyCreated.id, created: false };
    }

    throw error;
  }
};

const ensureMilestone = async ({
  client,
  successPlanId,
  milestone,
}: {
  client: CoreApiClient;
  successPlanId: string;
  milestone: CustomerSuccessHandoffMilestonePreview;
}): Promise<boolean> => {
  const existing = (await client.query({
    successMilestone: {
      __args: { filter: { id: { eq: milestone.id } } },
      id: true,
    },
  } as never)) as unknown as {
    successMilestone?: { id?: string | null } | null;
  };

  if (existing.successMilestone?.id) {
    return false;
  }

  await client.mutation({
    createSuccessMilestone: {
      __args: {
        data: {
          id: milestone.id,
          name: milestone.name,
          category: milestone.category,
          status: 'PLANNED',
          dueAt: milestone.dueAt,
          successPlanId,
        },
      },
      id: true,
    },
  } as never);

  return true;
};

const ensureTaskTarget = async ({
  client,
  taskId,
  target,
}: {
  client: CoreApiClient;
  taskId: string;
  target:
    | { targetCompanyId: string }
    | { targetPersonId: string }
    | { targetOpportunityId: string };
}): Promise<boolean> => {
  const filter = {
    taskId: { eq: taskId },
    ...('targetCompanyId' in target
      ? { targetCompanyId: { eq: target.targetCompanyId } }
      : 'targetPersonId' in target
        ? { targetPersonId: { eq: target.targetPersonId } }
        : { targetOpportunityId: { eq: target.targetOpportunityId } }),
  };
  const existing = (await client.query({
    taskTargets: {
      __args: { filter, first: 1 },
      edges: { node: { id: true } },
    },
  } as never)) as unknown as {
    taskTargets?: { edges?: Array<{ node?: { id?: string | null } | null }> };
  };

  if (existing.taskTargets?.edges?.[0]?.node?.id) {
    return false;
  }

  await client.mutation({
    createTaskTarget: {
      __args: { data: { taskId, ...target } },
      id: true,
    },
  } as never);

  return true;
};

const ensureKickoffTask = async ({
  client,
  preview,
}: {
  client: CoreApiClient;
  preview: CustomerSuccessHandoffPreview;
}): Promise<{ taskId?: string; warnings: string[] }> => {
  const warnings: string[] = [];
  const existing = (await client.query({
    task: {
      __args: { filter: { id: { eq: preview.task.id } } },
      id: true,
    },
  } as never)) as unknown as {
    task?: { id?: string | null } | null;
  };

  try {
    if (!existing.task?.id) {
      await client.mutation({
        createTask: {
          __args: {
            data: {
              id: preview.task.id,
              title: preview.task.title,
              status: 'TODO',
              dueAt: preview.task.dueAt,
              assigneeId: preview.task.assignee.id,
              bodyV2: {
                markdown: [
                  'Tarefa criada pelo handoff comercial confirmado.',
                  `Plano de sucesso: ${preview.plan.name} (${preview.plan.id}).`,
                  `Oportunidade de origem: ${preview.opportunity.name} (${preview.opportunity.id}).`,
                  'Objetivo: realizar o kickoff e validar escopo, responsáveis, cadência e critérios de sucesso.',
                ].join('\n\n'),
                blocknote: null,
              },
            },
          },
          id: true,
        },
      } as never);
    }

    const targets = [
      { targetCompanyId: preview.opportunity.companyId },
      preview.opportunity.contactId
        ? { targetPersonId: preview.opportunity.contactId }
        : null,
      { targetOpportunityId: preview.opportunity.id },
    ].filter(
      (
        target,
      ): target is
        | { targetCompanyId: string }
        | { targetPersonId: string }
        | { targetOpportunityId: string } => target !== null,
    );
    const targetResults = await Promise.allSettled(
      targets.map((target) =>
        ensureTaskTarget({
          client,
          taskId: preview.task.id,
          target,
        }),
      ),
    );
    const failedTargets = targetResults.filter(
      ({ status }) => status === 'rejected',
    ).length;

    if (failedTargets > 0) {
      warnings.push(
        `${failedTargets} vínculo(s) da tarefa de kickoff não puderam ser criado(s).`,
      );
    }

    return { taskId: preview.task.id, warnings };
  } catch {
    return {
      warnings: [
        'O plano foi criado, mas a tarefa de kickoff não pôde ser registrada.',
      ],
    };
  }
};

const applyHandoff = async ({
  client,
  preview,
}: {
  client: CoreApiClient;
  preview: CustomerSuccessHandoffPreview;
}): Promise<CustomerSuccessHandoffResult> => {
  const plan = await ensureSuccessPlan({ client, preview });
  const milestoneResults = await Promise.allSettled(
    preview.milestones.map((milestone) =>
      ensureMilestone({
        client,
        successPlanId: plan.id,
        milestone,
      }),
    ),
  );
  const milestonesCreated = milestoneResults.filter(
    (result) => result.status === 'fulfilled' && result.value,
  ).length;
  const milestoneFailures = milestoneResults.filter(
    ({ status }) => status === 'rejected',
  ).length;
  const task = await ensureKickoffTask({ client, preview });
  const warnings = [...preview.warnings, ...task.warnings];

  if (milestoneFailures > 0) {
    warnings.push(
      `${milestoneFailures} marco(s) não puderam ser criados; o plano permanece disponível para correção.`,
    );
  }

  try {
    await client.mutation({
      updateCompany: {
        __args: {
          id: preview.opportunity.companyId,
          data: { diexLifecycle: 'CUSTOMER' },
        },
        id: true,
      },
    } as never);
  } catch {
    warnings.push(
      'O plano foi criado, mas a jornada consolidada da empresa não pôde ser atualizada para Cliente.',
    );
  }

  const receipt = [
    `Handoff confirmado em ${new Date().toISOString()}.`,
    `Oportunidade: ${preview.opportunity.name} (${preview.opportunity.id}).`,
    `Plano de sucesso: ${preview.plan.name} (${plan.id}).`,
    `Responsável de CS: ${getRecordName(preview.plan.owner) || preview.plan.owner.id}.`,
    `Renovação: ${preview.plan.renewalDate}.`,
    `Receita recorrente: ${preview.plan.currencyCode} ${(preview.plan.recurringRevenueMicros / 1_000_000).toFixed(2)}.`,
    `Marcos reconciliados: ${preview.milestones.length - milestoneFailures}/${preview.milestones.length}.`,
    task.taskId
      ? `Tarefa de kickoff: ${task.taskId}.`
      : 'Tarefa de kickoff: não criada.',
    'Efeito externo: nenhum envio de e-mail ou WhatsApp.',
    warnings.length > 0 ? `Alertas: ${warnings.join(' | ')}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');

  return {
    mode: 'APPLY',
    supported: true,
    opportunityId: preview.opportunity.id,
    created: true,
    alreadyCreated: !plan.created,
    successPlanId: plan.id,
    taskId: task.taskId,
    milestonesCreated,
    milestonesExpected: preview.milestones.length,
    warnings,
    receipt,
    message: plan.created
      ? 'Cliente entregue ao CS com plano, marcos e próxima ação.'
      : 'O plano existente foi reconciliado sem criar duplicidade.',
  };
};

export const handoffWonOpportunity = async (
  input: CustomerSuccessHandoffInput,
): Promise<CustomerSuccessHandoffResult> => {
  const opportunityId = input.opportunityId?.trim();
  const previewOnly = input.previewOnly !== false;

  if (!opportunityId) {
    throw new Error('opportunityId é obrigatório.');
  }

  const client = new CoreApiClient();
  const normalizedDraft = normalizeDraft(input);
  const [opportunity, owner, existingPlan] = await Promise.all([
    loadOpportunity(client, opportunityId),
    loadOwner(client, normalizedDraft.ownerId),
    loadExistingSuccessPlan(client, opportunityId),
  ]);
  const draft: HandoffDraft = {
    owner,
    renewalDate: normalizedDraft.renewalDate,
    recurringRevenueMicros: normalizedDraft.recurringRevenueMicros,
    currencyCode: normalizedDraft.currencyCode,
    objectives: normalizedDraft.objectives,
    successCriteria: normalizedDraft.successCriteria,
  };
  const confirmationScope = getConfirmationScope(input);
  const key = confirmationKey(opportunityId, confirmationScope);

  if (previewOnly) {
    await appKeyValue.delete(key).catch(() => false);

    if (existingPlan) {
      return {
        mode: 'PREVIEW',
        supported: false,
        opportunityId,
        existingPlanId: existingPlan.id,
        blockedReason: 'Esta oportunidade já possui um plano de sucesso.',
        message: 'Abra o plano existente; nenhuma duplicata foi criada.',
      };
    }

    try {
      const preview = buildHandoffPreview({ opportunity, draft });
      const confirmationToken = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
      const confirmation: HandoffConfirmation = {
        opportunityId,
        fingerprint: getContextFingerprint({
          opportunity,
          existingPlanId: null,
          draft,
        }),
        preview,
        tokenHash: sha256(confirmationToken),
        expiresAt,
        confirmationScope,
      };

      await appKeyValue.set(key, confirmation);

      return {
        mode: 'PREVIEW',
        supported: true,
        opportunityId,
        preview,
        confirmationToken,
        expiresAt,
        message:
          'Revise o responsável, a receita, a renovação e os cinco marcos. Nenhum registro foi criado.',
      };
    } catch (error) {
      const blockedReason =
        error instanceof Error
          ? error.message
          : 'O handoff não possui dados suficientes.';

      return {
        mode: 'PREVIEW',
        supported: false,
        opportunityId,
        blockedReason,
        message: 'O handoff foi bloqueado antes de criar registros.',
      };
    }
  }

  if (
    input.confirmCreate !== true ||
    typeof input.confirmationToken !== 'string' ||
    input.confirmationToken.length < 32
  ) {
    throw new Error('A confirmação explícita do handoff é obrigatória.');
  }

  const confirmation = await appKeyValue.get<HandoffConfirmation>(key);

  if (
    !confirmation ||
    confirmation.opportunityId !== opportunityId ||
    confirmation.confirmationScope !== confirmationScope ||
    confirmation.tokenHash !== sha256(input.confirmationToken) ||
    new Date(confirmation.expiresAt).getTime() <= Date.now()
  ) {
    throw new Error(
      'A confirmação é inválida ou expirou. Gere uma nova prévia.',
    );
  }

  if (existingPlan) {
    await appKeyValue.delete(key).catch(() => false);
    throw new Error(
      'Outro handoff já criou o plano desta oportunidade. Atualize a carteira.',
    );
  }

  if (
    confirmation.fingerprint !==
    getContextFingerprint({
      opportunity,
      existingPlanId: null,
      draft,
    })
  ) {
    await appKeyValue.delete(key).catch(() => false);
    throw new Error(
      'A oportunidade ou o formulário mudou depois da prévia. Revise e confirme novamente.',
    );
  }

  await appKeyValue.delete(key);

  return await applyHandoff({
    client,
    preview: confirmation.preview,
  });
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    opportunityId: {
      type: 'string' as const,
      description:
        'ID de uma única oportunidade em Fechado ganho que será entregue ao CS.',
    },
    ownerId: {
      type: 'string' as const,
      description: 'ID do membro responsável pelo plano de Customer Success.',
    },
    renewalDate: {
      type: 'string' as const,
      description: 'Data contratual de renovação no formato AAAA-MM-DD.',
    },
    recurringRevenueMicros: {
      type: 'number' as const,
      minimum: 0,
      description:
        'Receita recorrente em micros; R$ 1,00 corresponde a 1000000.',
    },
    currencyCode: {
      type: 'string' as const,
      description: 'Código ISO de moeda, como BRL.',
    },
    objectives: {
      type: 'string' as const,
      description: 'Objetivos do cliente revisados pelo operador.',
    },
    successCriteria: {
      type: 'string' as const,
      description: 'Critérios verificáveis de sucesso do cliente.',
    },
    previewOnly: {
      type: 'boolean' as const,
      description:
        'Use true primeiro para receber a prévia sem criar registros.',
    },
    confirmCreate: {
      type: 'boolean' as const,
      description:
        'Use true somente após aprovação explícita da prévia pelo usuário.',
    },
    confirmationToken: {
      type: 'string' as const,
      description: 'Token temporário devolvido pela prévia exata.',
    },
  },
  required: [
    'opportunityId',
    'ownerId',
    'renewalDate',
    'recurringRevenueMicros',
    'currencyCode',
    'objectives',
    'successCriteria',
  ],
};

export default defineLogicFunction({
  universalIdentifier:
    CUSTOMER_SUCCESS_HANDOFF_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'handoff-won-opportunity-to-customer-success',
  description:
    'Previews and confirms the idempotent handoff of one won opportunity into a Customer Success plan, milestones and kickoff task without external communication.',
  timeoutSeconds: 30,
  handler: handoffWonOpportunity,
  toolTriggerSettings: {
    inputSchema,
  },
});
