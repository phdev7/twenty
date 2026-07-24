import { createHash, randomBytes } from 'node:crypto';

import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { CUSTOMER_SUCCESS_MILESTONE_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import {
  SuccessMilestoneCategory,
  SuccessMilestoneStatus,
} from 'src/objects/success-milestone.object';
import {
  SuccessHealth,
  SuccessLifecycle,
} from 'src/objects/success-plan.object';
import { appKeyValue } from 'src/utils/app-key-value';

export type CustomerSuccessMilestoneAction = 'START' | 'BLOCK' | 'COMPLETE';

export type UpdateSuccessMilestoneInput = {
  milestoneId: string;
  action: CustomerSuccessMilestoneAction | string;
  outcome?: string;
  evidence?: string;
  impact?: string;
  previewOnly?: boolean;
  confirmUpdate?: boolean;
  confirmationToken?: string;
  confirmationScope?: string;
};

type RichTextValue = {
  markdown?: string | null;
};

type SuccessPlanContext = {
  id: string;
  name?: string | null;
  lifecycle?: string | null;
  health?: string | null;
  nextReviewAt?: string | null;
  updatedAt?: string | null;
  risks?: RichTextValue | null;
  valueEvidenceRating?: string | null;
  expansionSignal?: boolean | null;
};

type SuccessMilestoneContext = {
  id: string;
  name?: string | null;
  category?: string | null;
  status?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
  outcome?: RichTextValue | null;
  evidence?: RichTextValue | null;
  impact?: string | null;
  successPlan?: SuccessPlanContext | null;
};

type NormalizedMilestoneAction = {
  action: CustomerSuccessMilestoneAction;
  outcome?: string;
  evidence?: string;
  impact?: string;
};

export type CustomerSuccessMilestoneActionPreview = {
  generatedAt: string;
  milestone: {
    id: string;
    name: string;
    category?: string;
    dueAt?: string;
    previousStatus: string;
    nextStatus: string;
    outcome?: string;
    evidence?: string;
    impact?: string;
    completedAt?: string;
  };
  successPlan: {
    id: string;
    name: string;
    previousLifecycle?: string;
    nextLifecycle?: string;
    previousHealth?: string;
    nextHealth?: string;
    nextReviewAt: string;
    risks?: string;
    valueEvidenceRating?: string;
    expansionSignal?: boolean;
  };
  effects: string[];
  warnings: string[];
};

export type CustomerSuccessMilestoneActionResult =
  | {
      mode: 'PREVIEW';
      supported: false;
      milestoneId: string;
      blockedReason: string;
      message: string;
    }
  | {
      mode: 'PREVIEW';
      supported: true;
      milestoneId: string;
      preview: CustomerSuccessMilestoneActionPreview;
      confirmationToken: string;
      expiresAt: string;
      message: string;
    }
  | {
      mode: 'APPLY';
      supported: true;
      milestoneId: string;
      successPlanId: string;
      action: CustomerSuccessMilestoneAction;
      milestoneUpdated: true;
      successPlanUpdated: boolean;
      warnings: string[];
      receipt: string;
      message: string;
    };

type MilestoneActionConfirmation = {
  milestoneId: string;
  action: CustomerSuccessMilestoneAction;
  fingerprint: string;
  preview: CustomerSuccessMilestoneActionPreview;
  tokenHash: string;
  expiresAt: string;
  confirmationScope: string;
};

const DAY_MILLISECONDS = 86_400_000;
const ALLOWED_ACTIONS = new Set<CustomerSuccessMilestoneAction>([
  'START',
  'BLOCK',
  'COMPLETE',
]);
const ALLOWED_IMPACTS = new Set([
  'RATING_1',
  'RATING_2',
  'RATING_3',
  'RATING_4',
  'RATING_5',
]);

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const normalizeText = ({
  value,
  label,
  required,
  minimumLength,
}: {
  value?: string;
  label: string;
  required: boolean;
  minimumLength: number;
}): string | undefined => {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    if (required) {
      throw new Error(`${label} é obrigatório para esta ação.`);
    }

    return undefined;
  }

  if (normalized.length < minimumLength || normalized.length > 5_000) {
    throw new Error(
      `${label} deve ter entre ${minimumLength} e 5.000 caracteres.`,
    );
  }

  return normalized;
};

const normalizeInput = (
  input: UpdateSuccessMilestoneInput,
): NormalizedMilestoneAction => {
  const action = input.action?.trim().toUpperCase() as
    CustomerSuccessMilestoneAction | '';

  if (!ALLOWED_ACTIONS.has(action as CustomerSuccessMilestoneAction)) {
    throw new Error('A ação deve ser START, BLOCK ou COMPLETE.');
  }

  if (action === 'START') {
    return { action };
  }

  const outcome = normalizeText({
    value: input.outcome,
    label: action === 'BLOCK' ? 'Motivo do bloqueio' : 'Resultado',
    required: true,
    minimumLength: 10,
  });
  const evidence = normalizeText({
    value: input.evidence,
    label: 'Evidência',
    required: action === 'COMPLETE',
    minimumLength: 5,
  });
  const impact =
    action === 'COMPLETE' ? input.impact?.trim().toUpperCase() : undefined;

  if (action === 'COMPLETE' && (!impact || !ALLOWED_IMPACTS.has(impact))) {
    throw new Error('Informe o impacto entre RATING_1 e RATING_5.');
  }

  return {
    action: action as CustomerSuccessMilestoneAction,
    outcome,
    evidence,
    impact,
  };
};

const loadMilestone = async (
  client: CoreApiClient,
  milestoneId: string,
): Promise<SuccessMilestoneContext> => {
  const result = (await client.query({
    successMilestone: {
      __args: { filter: { id: { eq: milestoneId } } },
      id: true,
      name: true,
      category: true,
      status: true,
      dueAt: true,
      completedAt: true,
      updatedAt: true,
      outcome: { markdown: true },
      evidence: { markdown: true },
      impact: true,
      successPlan: {
        id: true,
        name: true,
        lifecycle: true,
        health: true,
        nextReviewAt: true,
        updatedAt: true,
        risks: { markdown: true },
        valueEvidenceRating: true,
        expansionSignal: true,
      },
    },
  } as never)) as unknown as {
    successMilestone?: SuccessMilestoneContext | null;
  };

  if (!result.successMilestone?.id) {
    throw new Error('O marco de sucesso não foi encontrado neste workspace.');
  }

  if (!result.successMilestone.successPlan?.id) {
    throw new Error('O marco não está vinculado a um plano de sucesso.');
  }

  return result.successMilestone;
};

const getConfirmationScope = (input: UpdateSuccessMilestoneInput): string =>
  input.confirmationScope?.trim() || 'mcp-tool';

const confirmationKey = (
  milestoneId: string,
  confirmationScope: string,
): string =>
  `diex:customer-success:milestone:${milestoneId}:${sha256(
    confirmationScope,
  ).slice(0, 24)}`;

const getFingerprint = (
  milestone: SuccessMilestoneContext,
  action: NormalizedMilestoneAction,
): string =>
  sha256(
    JSON.stringify({
      milestone: {
        id: milestone.id,
        name: milestone.name ?? null,
        category: milestone.category ?? null,
        status: milestone.status ?? null,
        dueAt: milestone.dueAt ?? null,
        completedAt: milestone.completedAt ?? null,
        updatedAt: milestone.updatedAt ?? null,
        outcome: milestone.outcome?.markdown ?? null,
        evidence: milestone.evidence?.markdown ?? null,
        impact: milestone.impact ?? null,
      },
      successPlan: {
        id: milestone.successPlan?.id ?? null,
        lifecycle: milestone.successPlan?.lifecycle ?? null,
        health: milestone.successPlan?.health ?? null,
        nextReviewAt: milestone.successPlan?.nextReviewAt ?? null,
        updatedAt: milestone.successPlan?.updatedAt ?? null,
        risks: milestone.successPlan?.risks?.markdown ?? null,
        valueEvidenceRating: milestone.successPlan?.valueEvidenceRating ?? null,
        expansionSignal: milestone.successPlan?.expansionSignal ?? null,
      },
      action,
    }),
  );

const ratingNumber = (rating?: string | null): number => {
  const match = rating?.match(/^RATING_([1-5])$/);

  return match ? Number(match[1]) : 0;
};

const maxRating = (
  current?: string | null,
  proposed?: string,
): string | undefined => {
  const maximum = Math.max(ratingNumber(current), ratingNumber(proposed));

  return maximum > 0 ? `RATING_${maximum}` : undefined;
};

const nextLifecycleForCategory = ({
  category,
  currentLifecycle,
}: {
  category?: string | null;
  currentLifecycle?: string | null;
}): string | undefined => {
  if (
    currentLifecycle === SuccessLifecycle.AT_RISK ||
    currentLifecycle === SuccessLifecycle.CHURNED
  ) {
    return currentLifecycle;
  }

  const mapping: Partial<Record<SuccessMilestoneCategory, SuccessLifecycle>> = {
    [SuccessMilestoneCategory.ACTIVATION]: SuccessLifecycle.ADOPTION,
    [SuccessMilestoneCategory.ADOPTION]: SuccessLifecycle.ADOPTION,
    [SuccessMilestoneCategory.VALUE]: SuccessLifecycle.VALUE_DELIVERED,
    [SuccessMilestoneCategory.EXPANSION]: SuccessLifecycle.EXPANSION,
    [SuccessMilestoneCategory.RENEWAL]: SuccessLifecycle.RENEWAL,
  };

  return (
    mapping[category as SuccessMilestoneCategory] ??
    currentLifecycle ??
    undefined
  );
};

const appendRisk = ({
  currentRisks,
  milestoneName,
  outcome,
  generatedAt,
}: {
  currentRisks?: string | null;
  milestoneName: string;
  outcome: string;
  generatedAt: string;
}): string => {
  const riskLine = `- ${generatedAt.slice(0, 10)} · Marco bloqueado: ${milestoneName}. ${outcome}`;

  return [currentRisks?.trim(), riskLine].filter(Boolean).join('\n');
};

const buildPreview = ({
  milestone,
  action,
}: {
  milestone: SuccessMilestoneContext;
  action: NormalizedMilestoneAction;
}): CustomerSuccessMilestoneActionPreview => {
  const plan = milestone.successPlan as SuccessPlanContext;
  const currentStatus = milestone.status ?? SuccessMilestoneStatus.PLANNED;

  if (
    currentStatus === SuccessMilestoneStatus.CANCELLED ||
    currentStatus === SuccessMilestoneStatus.COMPLETED
  ) {
    throw new Error(
      currentStatus === SuccessMilestoneStatus.COMPLETED
        ? 'Este marco já foi concluído.'
        : 'Este marco foi cancelado e não pode ser alterado por esta operação.',
    );
  }

  if (
    action.action === 'START' &&
    currentStatus === SuccessMilestoneStatus.IN_PROGRESS
  ) {
    throw new Error('Este marco já está em andamento.');
  }

  const generatedAt = new Date().toISOString();
  const nextStatus =
    action.action === 'START'
      ? SuccessMilestoneStatus.IN_PROGRESS
      : action.action === 'BLOCK'
        ? SuccessMilestoneStatus.BLOCKED
        : SuccessMilestoneStatus.COMPLETED;
  const nextReviewDays =
    action.action === 'BLOCK' ? 3 : action.action === 'START' ? 7 : 14;
  const nextReviewAt = new Date(
    new Date(generatedAt).getTime() + nextReviewDays * DAY_MILLISECONDS,
  ).toISOString();
  const nextHealth =
    action.action === 'BLOCK'
      ? plan.health === SuccessHealth.CRITICAL
        ? SuccessHealth.CRITICAL
        : SuccessHealth.ATTENTION
      : (plan.health ?? undefined);
  const nextLifecycle =
    action.action === 'COMPLETE'
      ? nextLifecycleForCategory({
          category: milestone.category,
          currentLifecycle: plan.lifecycle,
        })
      : (plan.lifecycle ?? undefined);
  const risks =
    action.action === 'BLOCK' && action.outcome
      ? appendRisk({
          currentRisks: plan.risks?.markdown,
          milestoneName: milestone.name?.trim() || 'Marco sem nome',
          outcome: action.outcome,
          generatedAt,
        })
      : plan.risks?.markdown?.trim() || undefined;
  const valueEvidenceRating =
    action.action === 'COMPLETE' &&
    milestone.category === SuccessMilestoneCategory.VALUE
      ? maxRating(plan.valueEvidenceRating, action.impact)
      : (plan.valueEvidenceRating ?? undefined);
  const expansionSignal =
    action.action === 'COMPLETE' &&
    milestone.category === SuccessMilestoneCategory.EXPANSION
      ? true
      : (plan.expansionSignal ?? undefined);
  const effects = [
    `Marco: ${currentStatus} → ${nextStatus}.`,
    `Próxima revisão do plano: ${nextReviewAt}.`,
    action.action === 'BLOCK'
      ? `Saúde do plano: ${plan.health ?? SuccessHealth.UNKNOWN} → ${nextHealth}.`
      : null,
    action.action === 'COMPLETE' && nextLifecycle !== plan.lifecycle
      ? `Jornada do cliente: ${plan.lifecycle ?? SuccessLifecycle.ONBOARDING} → ${nextLifecycle}.`
      : null,
    action.action === 'COMPLETE' &&
    valueEvidenceRating !== plan.valueEvidenceRating
      ? `Evidência de valor do plano: ${plan.valueEvidenceRating ?? 'sem nota'} → ${valueEvidenceRating}.`
      : null,
    expansionSignal === true && plan.expansionSignal !== true
      ? 'Sinal de expansão do plano será ativado.'
      : null,
  ].filter((effect): effect is string => Boolean(effect));
  const warnings = [
    !milestone.dueAt ? 'O marco não possui prazo registrado.' : null,
    action.action === 'BLOCK' && !action.evidence
      ? 'O bloqueio será salvo sem evidência adicional.'
      : null,
    action.action === 'COMPLETE' &&
    new Date(milestone.dueAt ?? generatedAt).getTime() <
      new Date(generatedAt).getTime()
      ? 'O marco está sendo concluído depois do prazo.'
      : null,
  ].filter((warning): warning is string => Boolean(warning));

  return {
    generatedAt,
    milestone: {
      id: milestone.id,
      name: milestone.name?.trim() || 'Marco sem nome',
      category: milestone.category ?? undefined,
      dueAt: milestone.dueAt ?? undefined,
      previousStatus: currentStatus,
      nextStatus,
      outcome: action.outcome,
      evidence: action.evidence,
      impact: action.impact,
      completedAt: action.action === 'COMPLETE' ? generatedAt : undefined,
    },
    successPlan: {
      id: plan.id,
      name: plan.name?.trim() || 'Plano sem nome',
      previousLifecycle: plan.lifecycle ?? undefined,
      nextLifecycle,
      previousHealth: plan.health ?? undefined,
      nextHealth,
      nextReviewAt,
      risks,
      valueEvidenceRating,
      expansionSignal,
    },
    effects,
    warnings,
  };
};

const updateMilestoneRecord = async ({
  client,
  preview,
}: {
  client: CoreApiClient;
  preview: CustomerSuccessMilestoneActionPreview;
}): Promise<void> => {
  const data: Record<string, unknown> = {
    status: preview.milestone.nextStatus,
    completedAt: preview.milestone.completedAt ?? null,
  };

  if (preview.milestone.outcome) {
    data.outcome = {
      markdown: preview.milestone.outcome,
      blocknote: null,
    };
  }

  if (preview.milestone.evidence) {
    data.evidence = {
      markdown: preview.milestone.evidence,
      blocknote: null,
    };
  }

  if (preview.milestone.impact) {
    data.impact = preview.milestone.impact;
  }

  const result = (await client.mutation({
    updateSuccessMilestone: {
      __args: {
        id: preview.milestone.id,
        data,
      },
      id: true,
    },
  } as never)) as unknown as {
    updateSuccessMilestone?: { id?: string | null } | null;
  };

  if (result.updateSuccessMilestone?.id !== preview.milestone.id) {
    throw new Error('O marco não confirmou a atualização.');
  }
};

const updateSuccessPlanRecord = async ({
  client,
  preview,
  action,
}: {
  client: CoreApiClient;
  preview: CustomerSuccessMilestoneActionPreview;
  action: CustomerSuccessMilestoneAction;
}): Promise<boolean> => {
  const data: Record<string, unknown> = {
    nextReviewAt: preview.successPlan.nextReviewAt,
  };

  if (action === 'BLOCK') {
    data.health = preview.successPlan.nextHealth;
    data.risks = {
      markdown: preview.successPlan.risks,
      blocknote: null,
    };
  }

  if (action === 'COMPLETE') {
    if (preview.successPlan.nextLifecycle) {
      data.lifecycle = preview.successPlan.nextLifecycle;
    }

    if (preview.successPlan.valueEvidenceRating) {
      data.valueEvidenceRating = preview.successPlan.valueEvidenceRating;
    }

    if (preview.successPlan.expansionSignal !== undefined) {
      data.expansionSignal = preview.successPlan.expansionSignal;
    }
  }

  const result = (await client.mutation({
    updateSuccessPlan: {
      __args: {
        id: preview.successPlan.id,
        data,
      },
      id: true,
    },
  } as never)) as unknown as {
    updateSuccessPlan?: { id?: string | null } | null;
  };

  return result.updateSuccessPlan?.id === preview.successPlan.id;
};

const applyMilestoneAction = async ({
  client,
  confirmation,
}: {
  client: CoreApiClient;
  confirmation: MilestoneActionConfirmation;
}): Promise<CustomerSuccessMilestoneActionResult> => {
  const { preview, action } = confirmation;

  await updateMilestoneRecord({ client, preview });

  const warnings = [...preview.warnings];
  let successPlanUpdated = false;

  try {
    successPlanUpdated = await updateSuccessPlanRecord({
      client,
      preview,
      action,
    });

    if (!successPlanUpdated) {
      warnings.push(
        'O marco foi atualizado, mas o plano não confirmou a nova cadência.',
      );
    }
  } catch {
    warnings.push(
      'O marco foi atualizado, mas o reflexo no plano de sucesso falhou.',
    );
  }

  const receipt = [
    `Ação de marco confirmada em ${new Date().toISOString()}.`,
    `Marco: ${preview.milestone.name} (${preview.milestone.id}).`,
    `Plano: ${preview.successPlan.name} (${preview.successPlan.id}).`,
    `Status: ${preview.milestone.previousStatus} → ${preview.milestone.nextStatus}.`,
    preview.milestone.outcome
      ? `Resultado ou motivo: ${preview.milestone.outcome}.`
      : null,
    preview.milestone.evidence
      ? `Evidência: ${preview.milestone.evidence}.`
      : null,
    preview.milestone.impact ? `Impacto: ${preview.milestone.impact}.` : null,
    `Plano atualizado: ${successPlanUpdated ? 'sim' : 'não'}.`,
    'Efeito externo: nenhum envio de e-mail ou WhatsApp.',
    warnings.length > 0 ? `Alertas: ${warnings.join(' | ')}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');

  return {
    mode: 'APPLY',
    supported: true,
    milestoneId: preview.milestone.id,
    successPlanId: preview.successPlan.id,
    action,
    milestoneUpdated: true,
    successPlanUpdated,
    warnings,
    receipt,
    message:
      action === 'START'
        ? 'Marco iniciado e cadência de CS atualizada.'
        : action === 'BLOCK'
          ? 'Bloqueio registrado e risco refletido no plano.'
          : 'Marco concluído com resultado e evidência.',
  };
};

export const updateSuccessMilestone = async (
  input: UpdateSuccessMilestoneInput,
): Promise<CustomerSuccessMilestoneActionResult> => {
  const milestoneId = input.milestoneId?.trim();
  const previewOnly = input.previewOnly !== false;

  if (!milestoneId) {
    throw new Error('milestoneId é obrigatório.');
  }

  const action = normalizeInput(input);
  const confirmationScope = getConfirmationScope(input);
  const key = confirmationKey(milestoneId, confirmationScope);
  const client = new CoreApiClient();
  const milestone = await loadMilestone(client, milestoneId);

  if (previewOnly) {
    await appKeyValue.delete(key).catch(() => false);

    try {
      const preview = buildPreview({ milestone, action });
      const confirmationToken = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
      const confirmation: MilestoneActionConfirmation = {
        milestoneId,
        action: action.action,
        fingerprint: getFingerprint(milestone, action),
        preview,
        tokenHash: sha256(confirmationToken),
        expiresAt,
        confirmationScope,
      };

      await appKeyValue.set(key, confirmation);

      return {
        mode: 'PREVIEW',
        supported: true,
        milestoneId,
        preview,
        confirmationToken,
        expiresAt,
        message:
          'Revise o status, o reflexo no plano e os alertas. Nenhum registro foi alterado.',
      };
    } catch (error) {
      return {
        mode: 'PREVIEW',
        supported: false,
        milestoneId,
        blockedReason:
          error instanceof Error
            ? error.message
            : 'A ação não pode ser aplicada neste marco.',
        message: 'A operação foi bloqueada antes de alterar registros.',
      };
    }
  }

  if (
    input.confirmUpdate !== true ||
    typeof input.confirmationToken !== 'string' ||
    input.confirmationToken.length < 32
  ) {
    throw new Error('A confirmação explícita da atualização é obrigatória.');
  }

  const confirmation = await appKeyValue.get<MilestoneActionConfirmation>(key);

  if (
    !confirmation ||
    confirmation.milestoneId !== milestoneId ||
    confirmation.action !== action.action ||
    confirmation.confirmationScope !== confirmationScope ||
    confirmation.tokenHash !== sha256(input.confirmationToken) ||
    new Date(confirmation.expiresAt).getTime() <= Date.now()
  ) {
    throw new Error(
      'A confirmação é inválida ou expirou. Gere uma nova prévia.',
    );
  }

  if (confirmation.fingerprint !== getFingerprint(milestone, action)) {
    await appKeyValue.delete(key).catch(() => false);
    throw new Error(
      'O marco, o plano ou o formulário mudou depois da prévia. Revise novamente.',
    );
  }

  await appKeyValue.delete(key);

  return await applyMilestoneAction({ client, confirmation });
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    milestoneId: {
      type: 'string' as const,
      description: 'ID de um único marco de sucesso do workspace atual.',
    },
    action: {
      type: 'string' as const,
      enum: ['START', 'BLOCK', 'COMPLETE'],
      description:
        'START inicia, BLOCK registra risco e COMPLETE exige resultado, evidência e impacto.',
    },
    outcome: {
      type: 'string' as const,
      description:
        'Resultado alcançado ou motivo verificável do bloqueio. Obrigatório em BLOCK e COMPLETE.',
    },
    evidence: {
      type: 'string' as const,
      description:
        'Evidência observável. Obrigatória em COMPLETE e recomendada em BLOCK.',
    },
    impact: {
      type: 'string' as const,
      enum: ['RATING_1', 'RATING_2', 'RATING_3', 'RATING_4', 'RATING_5'],
      description: 'Impacto de 1 a 5. Obrigatório em COMPLETE.',
    },
    previewOnly: {
      type: 'boolean' as const,
      description: 'Use true primeiro para receber a prévia sem mutação.',
    },
    confirmUpdate: {
      type: 'boolean' as const,
      description: 'Use true somente depois da aprovação explícita da prévia.',
    },
    confirmationToken: {
      type: 'string' as const,
      description: 'Token temporário devolvido pela prévia exata.',
    },
  },
  required: ['milestoneId', 'action'],
};

export default defineLogicFunction({
  universalIdentifier:
    CUSTOMER_SUCCESS_MILESTONE_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'update-diex-customer-success-milestone',
  description:
    'Previews and confirms starting, blocking or completing one Customer Success milestone with evidence and synchronized plan state, without external communication.',
  timeoutSeconds: 30,
  handler: updateSuccessMilestone,
  toolTriggerSettings: {
    inputSchema,
  },
});
