import {
  type RenewalRecordReference,
  type RenewalMoney,
  type CustomerRenewal,
  type RenewalDraft,
} from 'src/modules/renewal-command-center/front-components/renewal-command-center.types';

export type BadgeTone =
  'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'turquoise' | 'gray';

export const STAGES = [
  {
    value: 'PLANNING',
    label: 'Planejamento',
    tone: 'gray' as BadgeTone,
  },
  {
    value: 'VALUE_PROOF',
    label: 'Prova de valor',
    tone: 'blue' as BadgeTone,
  },
  {
    value: 'NEGOTIATION',
    label: 'Negociação',
    tone: 'orange' as BadgeTone,
  },
  {
    value: 'COMMITMENT',
    label: 'Compromisso',
    tone: 'turquoise' as BadgeTone,
  },
  {
    value: 'RENEWED',
    label: 'Renovada',
    tone: 'green' as BadgeTone,
  },
  {
    value: 'CHURNED',
    label: 'Churn',
    tone: 'red' as BadgeTone,
  },
] as const;

export const RISKS = [
  { value: 'LOW', label: 'Baixo', tone: 'green' as BadgeTone },
  { value: 'MEDIUM', label: 'Médio', tone: 'yellow' as BadgeTone },
  { value: 'HIGH', label: 'Alto', tone: 'orange' as BadgeTone },
  { value: 'CRITICAL', label: 'Crítico', tone: 'red' as BadgeTone },
] as const;

export const FORECASTS = [
  { value: 'PIPELINE', label: 'Pipeline' },
  { value: 'BEST_CASE', label: 'Melhor caso' },
  { value: 'COMMIT', label: 'Compromisso' },
  { value: 'CLOSED', label: 'Fechado' },
] as const;

export const EVENT_LABELS: Record<string, string> = {
  CREATED: 'Caso criado',
  STAGE_CHANGED: 'Etapa alterada',
  PLAN_UPDATED: 'Plano atualizado',
  TOUCH_RECORDED: 'Contato registrado',
  AI_ACTION_PROPOSED: 'Intervenção de IA proposta',
  CLOSED_WON: 'Renovação ganha',
  CLOSED_LOST: 'Churn registrado',
};

export const getRecordName = (record?: RenewalRecordReference | null): string => {
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

export const getAmountMicros = (money?: RenewalMoney | null): number =>
  money?.amountMicros ?? 0;

export const formatMoney = (
  amountMicros: number,
  currencyCode = 'BRL',
  compact = false,
): string => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
    }).format(amountMicros / 1_000_000);
  } catch {
    return `${currencyCode} ${(amountMicros / 1_000_000).toLocaleString('pt-BR')}`;
  }
};

export const formatDate = (value?: string | null): string => {
  if (!value) {
    return 'Sem data';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return 'Sem registro';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

export const toDateTimeLocal = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const offset = parsed.getTimezoneOffset() * 60_000;

  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
};

export const daysUntil = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.ceil((timestamp - Date.now()) / 86_400_000);
};

export const getStage = (stage: string) =>
  STAGES.find(({ value }) => value === stage) ?? STAGES[0];

export const getRisk = (risk: string) =>
  RISKS.find(({ value }) => value === risk) ?? RISKS[1];

export const createDraft = (renewal: CustomerRenewal): RenewalDraft => ({
  stage: renewal.stage,
  risk: renewal.risk,
  forecast: renewal.forecast,
  probability: renewal.probability ?? 0,
  targetDate: renewal.targetDate?.slice(0, 10) ?? '',
  nextAction: renewal.nextAction ?? '',
  nextActionAt: toDateTimeLocal(renewal.nextActionAt),
  ownerId: renewal.owner?.id ?? '',
  riskReason: renewal.riskReason?.markdown ?? '',
  valueEvidence: renewal.valueEvidence?.markdown ?? '',
  commercialTerms: renewal.commercialTerms?.markdown ?? '',
  outcome: renewal.outcome?.markdown ?? '',
});