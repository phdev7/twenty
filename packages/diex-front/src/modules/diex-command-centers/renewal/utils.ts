import {
  type CustomerRenewal,
  type RenewalDraft,
} from '@/diex-command-centers/renewal/types';
import {
  formatDate,
  getRecordName,
} from '@/diex-command-centers/customer-success/utils';

export const STAGES = [
  { value: 'PLANNING', label: 'Planejamento', tone: 'gray' as const },
  { value: 'VALUE_PROOF', label: 'Prova de valor', tone: 'blue' as const },
  { value: 'NEGOTIATION', label: 'Negociação', tone: 'orange' as const },
  { value: 'COMMITMENT', label: 'Compromisso', tone: 'blue' as const },
  { value: 'RENEWED', label: 'Renovada', tone: 'green' as const },
  { value: 'CHURNED', label: 'Churn', tone: 'red' as const },
];
export const RISKS = [
  { value: 'LOW', label: 'Baixo' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'HIGH', label: 'Alto' },
  { value: 'CRITICAL', label: 'Crítico' },
];
export const FORECASTS = [
  { value: 'PIPELINE', label: 'Pipeline' },
  { value: 'BEST_CASE', label: 'Melhor caso' },
  { value: 'COMMIT', label: 'Compromisso' },
  { value: 'CLOSED', label: 'Fechado' },
];
export const EVENT_LABELS: Record<string, string> = {
  CREATED: 'Caso criado',
  STAGE_CHANGED: 'Etapa alterada',
  PLAN_UPDATED: 'Plano atualizado',
  TOUCH_RECORDED: 'Contato registrado',
  AI_ACTION_PROPOSED: 'Intervenção de IA proposta',
  CLOSED_WON: 'Renovação ganha',
  CLOSED_LOST: 'Churn registrado',
};
export { formatDate, getRecordName };

export const getAmountMicros = (
  money?: { amountMicros?: number | null } | null,
): number => money?.amountMicros ?? 0;
export const formatMoney = (
  amountMicros: number,
  currency = 'BRL',
  compact = false,
): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amountMicros / 1_000_000);
export const daysUntil = (date?: string | null): number | null => {
  if (!date) return null;
  const value = new Date(date).getTime();
  return Number.isNaN(value)
    ? null
    : Math.ceil((value - Date.now()) / 86_400_000);
};
export const formatDateTime = (date?: string | null): string =>
  date
    ? new Date(date).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Sem data';
export const getRisk = (risk: string) =>
  ({
    LOW: { label: 'Baixo', tone: 'green' as const },
    MEDIUM: { label: 'Médio', tone: 'orange' as const },
    HIGH: { label: 'Alto', tone: 'red' as const },
    CRITICAL: { label: 'Crítico', tone: 'red' as const },
  })[risk] ?? { label: risk, tone: 'gray' as const };
export const getStage = (stage: string) =>
  STAGES.find(({ value }) => value === stage) ?? {
    value: stage,
    label: stage,
    tone: 'gray' as const,
  };
export const createDraft = (renewal: CustomerRenewal): RenewalDraft => ({
  stage: renewal.stage,
  risk: renewal.risk,
  forecast: renewal.forecast,
  probability: renewal.probability ?? 0,
  targetDate: renewal.targetDate?.slice(0, 10) ?? '',
  nextAction: renewal.nextAction ?? '',
  nextActionAt: renewal.nextActionAt ? renewal.nextActionAt.slice(0, 16) : '',
  ownerId: renewal.owner?.id ?? '',
  riskReason: renewal.riskReason?.markdown ?? '',
  valueEvidence: renewal.valueEvidence?.markdown ?? '',
  commercialTerms: renewal.commercialTerms?.markdown ?? '',
  outcome: renewal.outcome?.markdown ?? '',
});
