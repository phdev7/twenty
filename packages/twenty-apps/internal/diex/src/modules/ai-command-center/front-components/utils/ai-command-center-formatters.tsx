import { type ReactNode } from 'react';
import {
  SidePanelPages,
  enqueueSnackbar,
  openSidePanelPage,
} from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconInbox,
  IconListCheck,
  IconRefreshDot,
  IconShield,
  IconTarget,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  type AiAction,
  type AiRecordReference,
} from 'src/modules/ai-command-center/front-components/ai-command-center.types';

export type BadgeTone =
  'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'turquoise' | 'gray';
export type QueueFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'HISTORY';
export type LinkedRecord = {
  record: AiRecordReference;
  label: string;
  objectNameSingular: string;
  icon: ReactNode;
};

export const getRecordName = (record?: AiRecordReference | null): string => {
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

export const getTypeLabel = (type: string): string =>
  ({
    QUALIFY: 'Qualificar',
    REPLY: 'Responder',
    FOLLOW_UP: 'Follow-up',
    PIPELINE_UPDATE: 'Atualizar pipeline',
    RISK_MITIGATION: 'Mitigar risco',
    CS_INTERVENTION: 'Intervenção de CS',
    EXPANSION: 'Expansão',
  })[type] ?? type;

export const getStatusLabel = (status: string): string =>
  ({
    DRAFT: 'Rascunho',
    PENDING_APPROVAL: 'Aguardando aprovação',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    EXECUTED: 'Executada',
    FAILED: 'Falhou',
  })[status] ?? status;

export const getStatusTone = (status: string): BadgeTone =>
  (
    ({
      DRAFT: 'gray',
      PENDING_APPROVAL: 'orange',
      APPROVED: 'blue',
      REJECTED: 'red',
      EXECUTED: 'green',
      FAILED: 'red',
    }) as Record<string, BadgeTone>
  )[status] ?? 'gray';

export const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return 'sem data';
  }

  const date = new Date(value);

  return Number.isFinite(date.getTime())
    ? date.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'sem data';
};

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

export const getLinkedRecords = (action: AiAction): LinkedRecord[] => {
  const records: LinkedRecord[] = [];
  const iconProps = {
    size: themeCssVariables.icon.size.sm,
    stroke: themeCssVariables.icon.stroke.md,
  };

  if (action.opportunity) {
    records.push({
      record: action.opportunity,
      label: 'Oportunidade',
      objectNameSingular: 'opportunity',
      icon: <IconTarget {...iconProps} />,
    });
  }

  if (action.commercialSignal) {
    records.push({
      record: action.commercialSignal,
      label: 'Sinal comercial',
      objectNameSingular: 'commercialSignal',
      icon: <IconAlertTriangle {...iconProps} />,
    });
  }

  if (action.successPlan) {
    records.push({
      record: action.successPlan,
      label: 'Plano de sucesso',
      objectNameSingular: 'successPlan',
      icon: <IconShield {...iconProps} />,
    });
  }

  if (action.customerRenewal) {
    records.push({
      record: action.customerRenewal,
      label: 'Renovação',
      objectNameSingular: 'customerRenewal',
      icon: <IconRefreshDot {...iconProps} />,
    });
  }

  if (action.inboxConversation) {
    records.push({
      record: action.inboxConversation,
      label: 'Conversa',
      objectNameSingular: 'inboxConversation',
      icon: <IconInbox {...iconProps} />,
    });
  }

  if (action.executionTask) {
    records.push({
      record: {
        id: action.executionTask.id,
        name: action.executionTask.title || 'Tarefa executada',
      },
      label: 'Tarefa executada',
      objectNameSingular: 'task',
      icon: <IconListCheck {...iconProps} />,
    });
  }

  return records;
};
