import {
  SidePanelPages,
  enqueueSnackbar,
  openSidePanelPage,
} from 'twenty-sdk/front-component';

import {
  type CustomerSuccessHandoffDraft,
  type CustomerSuccessHandoffOpportunity,
  type CustomerSuccessMilestoneAction,
  type CustomerSuccessMoney,
  type CustomerSuccessPlan,
  type CustomerSuccessRecordReference,
} from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.types';

export type BadgeTone =
  'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'turquoise' | 'gray';

export const LIFECYCLE_STAGES = [
  ['ONBOARDING', 'Onboarding'],
  ['ADOPTION', 'Adoção'],
  ['VALUE_DELIVERED', 'Valor entregue'],
  ['EXPANSION', 'Expansão'],
  ['RENEWAL', 'Renovação'],
  ['AT_RISK', 'Em risco'],
] as const;

export const getRecordName = (
  record?: CustomerSuccessRecordReference | null,
): string => {
  if (!record?.name) {
    return '';
  }

  if (typeof record.name === 'string') {
    return record.name;
  }

  return [record.name.firstName, record.name.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
};

export const getHealthLabel = (health?: string | null): string =>
  ({
    UNKNOWN: 'Sem diagnóstico',
    HEALTHY: 'Saudável',
    ATTENTION: 'Atenção',
    CRITICAL: 'Crítico',
  })[health ?? 'UNKNOWN'] ?? 'Sem diagnóstico';

export const getHealthTone = (health?: string | null): BadgeTone =>
  (
    ({
      UNKNOWN: 'gray',
      HEALTHY: 'green',
      ATTENTION: 'orange',
      CRITICAL: 'red',
    }) as Record<string, BadgeTone>
  )[health ?? 'UNKNOWN'] ?? 'gray';

export const getLifecycleLabel = (lifecycle?: string | null): string =>
  ({
    ONBOARDING: 'Onboarding',
    ADOPTION: 'Adoção',
    VALUE_DELIVERED: 'Valor entregue',
    EXPANSION: 'Expansão',
    RENEWAL: 'Renovação',
    AT_RISK: 'Em risco',
    CHURNED: 'Churn',
  })[lifecycle ?? ''] ?? 'Jornada não definida';

export const getMilestoneStatusLabel = (status?: string | null): string =>
  ({
    PLANNED: 'Planejado',
    IN_PROGRESS: 'Em andamento',
    BLOCKED: 'Bloqueado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
  })[status ?? ''] ?? 'Sem status';

export const getMilestoneTone = (status?: string | null): BadgeTone =>
  (
    ({
      PLANNED: 'gray',
      IN_PROGRESS: 'blue',
      BLOCKED: 'red',
      COMPLETED: 'green',
      CANCELLED: 'orange',
    }) as Record<string, BadgeTone>
  )[status ?? ''] ?? 'gray';

export const getMilestoneActionLabel = (
  action: CustomerSuccessMilestoneAction,
): string =>
  ({
    START: 'Iniciar ou retomar',
    BLOCK: 'Registrar bloqueio',
    COMPLETE: 'Concluir com evidência',
  })[action];

export const moneyAmount = (money?: CustomerSuccessMoney | null): number =>
  (money?.amountMicros ?? 0) / 1_000_000;

export const formatMoney = (
  value: number,
  currencyCode = 'BRL',
  compact = true,
): string => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
    }).format(value);
  } catch {
    return `${currencyCode} ${value.toLocaleString('pt-BR')}`;
  }
};

export const formatPlanMoney = (
  money?: CustomerSuccessMoney | null,
  compact = true,
): string =>
  money?.amountMicros
    ? formatMoney(
        moneyAmount(money),
        money.currencyCode?.trim() || 'BRL',
        compact,
      )
    : 'Sem receita';

export const formatDate = (value?: string | null): string => {
  if (!value) {
    return 'Sem data';
  }

  const date = new Date(value);

  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('pt-BR')
    : 'Sem data';
};

export const daysUntil = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? Math.ceil((timestamp - Date.now()) / 86_400_000)
    : null;
};

export const getDatePressureLabel = (value?: string | null): string => {
  const days = daysUntil(value);

  if (days === null) {
    return 'sem prazo';
  }

  if (days < 0) {
    return `${Math.abs(days)}d atrasado`;
  }

  if (days === 0) {
    return 'hoje';
  }

  return `em ${days}d`;
};

export const getDefaultRenewalDate = (closeDate?: string | null): string => {
  const now = new Date();
  const source = closeDate ? new Date(closeDate) : now;
  const base =
    Number.isFinite(source.getTime()) && source.getTime() > now.getTime()
      ? source
      : now;
  const renewal = new Date(base);

  renewal.setUTCFullYear(renewal.getUTCFullYear() + 1);

  return renewal.toISOString().slice(0, 10);
};

export const buildHandoffDraft = ({
  opportunity,
  currentWorkspaceMemberId,
  fallbackOwnerId,
}: {
  opportunity: CustomerSuccessHandoffOpportunity;
  currentWorkspaceMemberId: string | null;
  fallbackOwnerId: string;
}): CustomerSuccessHandoffDraft => {
  const isRecurringOffer = ['MONTHLY', 'ANNUAL', 'USAGE'].includes(
    opportunity.diexOffer?.pricingModel ?? '',
  );
  const opportunityName = opportunity.name?.trim() || 'negócio fechado';
  const companyName = getRecordName(opportunity.company) || 'cliente';

  return {
    ownerId:
      currentWorkspaceMemberId || opportunity.owner?.id || fallbackOwnerId,
    renewalDate: getDefaultRenewalDate(opportunity.closeDate),
    recurringRevenueMicros: isRecurringOffer
      ? (opportunity.amount?.amountMicros ?? 0)
      : 0,
    currencyCode:
      opportunity.amount?.currencyCode?.trim().toUpperCase() || 'BRL',
    objectives:
      opportunity.diexOffer?.valueProposition?.markdown?.trim() ||
      `Entregar ao ${companyName} o resultado comercial acordado em ${opportunityName}.`,
    successCriteria:
      'Kick-off concluído, operação ativada, adoção validada e primeira evidência de valor reconhecida pelo cliente antes da renovação.',
  };
};

export const isRiskPlan = (plan: CustomerSuccessPlan): boolean =>
  plan.health === 'CRITICAL' ||
  plan.health === 'ATTENTION' ||
  plan.lifecycle === 'AT_RISK';

export const openRecord = async (
  recordId: string,
  objectNameSingular: string,
): Promise<void> => {
  try {
    await openSidePanelPage({
      page: SidePanelPages.ViewRecord,
      recordId,
      objectNameSingular,
    });
  } catch {
    await enqueueSnackbar({
      message: 'Não foi possível abrir este registro.',
      variant: 'error',
    });
  }
};
