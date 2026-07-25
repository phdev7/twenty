import {
  type CommercialRecordReference,
  type CommercialSignal,
} from 'src/modules/commercial-intelligence/front-components/commercial-intelligence.types';
import {
  SidePanelPages,
  enqueueSnackbar,
  openSidePanelPage,
} from 'twenty-sdk/front-component';

export type BadgeTone =
  'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'turquoise' | 'gray';

export const getRecordName = (record?: CommercialRecordReference | null): string => {
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

export const getSignalTypeLabel = (type: string): string =>
  ({
    INTENT: 'Intenção',
    ENGAGEMENT: 'Engajamento',
    OBJECTION: 'Objeção',
    RISK: 'Risco',
    EXPANSION: 'Expansão',
    CHURN_RISK: 'Risco de churn',
    COMPETITOR: 'Concorrente',
  })[type] ?? type;

export const getSignalTone = (type: string): BadgeTone =>
  (
    ({
      INTENT: 'blue',
      ENGAGEMENT: 'green',
      OBJECTION: 'orange',
      RISK: 'red',
      EXPANSION: 'turquoise',
      CHURN_RISK: 'red',
      COMPETITOR: 'gray',
    }) as Record<string, BadgeTone>
  )[type] ?? 'gray';

export const getStatusLabel = (status: string): string =>
  ({
    NEW: 'Novo',
    IN_REVIEW: 'Em análise',
    ACTIONED: 'Tratado',
    DISMISSED: 'Descartado',
  })[status] ?? status;

export const getStatusTone = (status: string): BadgeTone =>
  (
    ({
      NEW: 'blue',
      IN_REVIEW: 'orange',
      ACTIONED: 'green',
      DISMISSED: 'gray',
    }) as Record<string, BadgeTone>
  )[status] ?? 'gray';

export const getRiskLabel = (risk?: string | null): string =>
  ({
    LOW: 'Risco baixo',
    MEDIUM: 'Risco médio',
    HIGH: 'Risco alto',
    UNKNOWN: 'Sem avaliação',
  })[risk ?? 'UNKNOWN'] ?? 'Sem avaliação';

export const getRiskTone = (risk?: string | null): BadgeTone =>
  (
    ({
      LOW: 'green',
      MEDIUM: 'orange',
      HIGH: 'red',
      UNKNOWN: 'gray',
    }) as Record<string, BadgeTone>
  )[risk ?? 'UNKNOWN'] ?? 'gray';

export const getStrength = (strength?: string | null): number => {
  const parsed = Number.parseInt(strength?.replace('RATING_', '') ?? '', 10);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatRelativeDate = (value?: string | null): string => {
  if (!value) {
    return 'sem data';
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return 'sem data';
  }

  const days = Math.round((timestamp - Date.now()) / (24 * 60 * 60_000));

  if (days === 0) {
    return 'hoje';
  }

  if (days === 1) {
    return 'amanhã';
  }

  if (days === -1) {
    return 'ontem';
  }

  return days > 0 ? `em ${days} dias` : `${Math.abs(days)} dias atrasada`;
};

export const formatCurrency = (amountMicros: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(amountMicros / 1_000_000);

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

export const getSignalPriority = (signal: CommercialSignal): number => {
  const typeWeight =
    signal.signalType === 'CHURN_RISK' || signal.signalType === 'RISK'
      ? 40
      : signal.signalType === 'OBJECTION'
        ? 30
        : signal.signalType === 'INTENT' || signal.signalType === 'EXPANSION'
          ? 25
          : 10;
  const statusWeight = signal.status === 'NEW' ? 20 : 10;

  return (
    typeWeight +
    statusWeight +
    getStrength(signal.strength) * 4 +
    (signal.confidence ?? 0) / 10
  );
};