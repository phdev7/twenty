import {
  type CustomerSuccessHandoffDraft,
  type CustomerSuccessHandoffOpportunity,
  type CustomerSuccessPlan,
  type DiexMoney,
  type DiexNamedRecord,
} from '@/diex-command-centers/customer-success/types';

export const LIFECYCLE_STAGES = [
  ['ONBOARDING', 'Onboarding'],
  ['ADOPTION', 'Adoção'],
  ['VALUE_DELIVERED', 'Valor entregue'],
  ['EXPANSION', 'Expansão'],
  ['RENEWAL', 'Renovação'],
  ['AT_RISK', 'Em risco'],
] as const;

export const getRecordName = (record?: DiexNamedRecord | null): string => {
  if (!record?.name) return '';
  if (typeof record.name === 'string') return record.name;
  return [record.name.firstName, record.name.lastName]
    .filter(Boolean)
    .join(' ');
};

export const moneyAmount = (money?: DiexMoney | null): number =>
  (money?.amountMicros ?? 0) / 1_000_000;

export const formatMoney = (
  value: number,
  currency = 'BRL',
  compact = false,
): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);

export const formatPlanMoney = (
  money?: DiexMoney | null,
  compact = true,
): string =>
  formatMoney(moneyAmount(money), money?.currencyCode ?? 'BRL', compact);

export const formatDate = (date?: string | null): string => {
  if (!date) return 'Sem data';
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? 'Sem data'
    : value.toLocaleDateString('pt-BR', { dateStyle: 'medium' });
};

export const daysUntil = (date?: string | null): number | null => {
  if (!date) return null;
  const value = new Date(date).getTime();
  return Number.isNaN(value)
    ? null
    : Math.ceil((value - Date.now()) / 86_400_000);
};

export const getDatePressureLabel = (date?: string | null): string => {
  const days = daysUntil(date);
  if (days === null) return 'sem data';
  if (days < 0) return `${Math.abs(days)}d vencida`;
  if (days === 0) return 'hoje';
  return `em ${days}d`;
};

export const isRiskPlan = (plan: CustomerSuccessPlan): boolean =>
  plan.health === 'CRITICAL' ||
  plan.health === 'ATTENTION' ||
  plan.lifecycle === 'AT_RISK';

export const healthColor = (
  health?: string | null,
): 'green' | 'orange' | 'red' | 'gray' =>
  health === 'HEALTHY'
    ? 'green'
    : health === 'ATTENTION'
      ? 'orange'
      : health === 'CRITICAL'
        ? 'red'
        : 'gray';

export const healthLabel = (health?: string | null): string =>
  ({
    HEALTHY: 'Saudável',
    ATTENTION: 'Atenção',
    CRITICAL: 'Crítico',
    UNKNOWN: 'Sem avaliação',
  })[health ?? 'UNKNOWN'] ?? 'Sem avaliação';

export const lifecycleLabel = (lifecycle?: string | null): string =>
  LIFECYCLE_STAGES.find(([value]) => value === lifecycle)?.[1] ?? 'Sem etapa';

export const buildHandoffDraft = (
  opportunity: CustomerSuccessHandoffOpportunity,
  currentWorkspaceMemberId: string | null,
  fallbackOwnerId: string,
): CustomerSuccessHandoffDraft => {
  const recurring = ['MONTHLY', 'ANNUAL', 'USAGE'].includes(
    opportunity.diexOffer?.pricingModel ?? '',
  );
  const companyName = getRecordName(opportunity.company) || 'cliente';
  const opportunityName = opportunity.name?.trim() || 'negócio fechado';
  const renewal = new Date(opportunity.closeDate ?? Date.now());
  renewal.setFullYear(renewal.getFullYear() + 1);
  return {
    ownerId:
      currentWorkspaceMemberId || opportunity.owner?.id || fallbackOwnerId,
    renewalDate: renewal.toISOString().slice(0, 10),
    recurringRevenueMicros: recurring
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
