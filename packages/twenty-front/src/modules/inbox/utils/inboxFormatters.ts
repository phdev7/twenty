const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

export const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || '?';
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return 'Não definido';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Data inválida'
    : dateTimeFormatter.format(date);
};

export const formatMessageTime = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date);
};

export const formatRelativeTime = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const elapsedMinutes = Math.round((date.getTime() - Date.now()) / 60_000);

  if (Math.abs(elapsedMinutes) < 60) {
    return new Intl.RelativeTimeFormat('pt-BR', {
      numeric: 'auto',
    }).format(elapsedMinutes, 'minute');
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);

  if (Math.abs(elapsedHours) < 24) {
    return new Intl.RelativeTimeFormat('pt-BR', {
      numeric: 'auto',
    }).format(elapsedHours, 'hour');
  }

  const elapsedDays = Math.round(elapsedHours / 24);

  if (Math.abs(elapsedDays) <= 7) {
    return new Intl.RelativeTimeFormat('pt-BR', {
      numeric: 'auto',
    }).format(elapsedDays, 'day');
  }

  return dateTimeFormatter.format(date);
};

export const getConversationStatusLabel = (status: string): string =>
  ({
    OPEN: 'Aberta',
    PENDING: 'Pendente',
    SNOOZED: 'Adiada',
    RESOLVED: 'Resolvida',
  })[status] ?? status;

export const getPriorityLabel = (priority: string): string =>
  ({
    LOW: 'Baixa',
    NORMAL: 'Normal',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  })[priority] ?? priority;

export const getMessageTypeLabel = (type: string): string =>
  ({
    TEXT: 'Mensagem',
    AUDIO: 'Áudio',
    IMAGE: 'Imagem',
    VIDEO: 'Vídeo',
    DOCUMENT: 'Documento',
    REACTION: 'Reação',
    SYSTEM: 'Evento do sistema',
  })[type] ?? 'Mensagem';

export const getTaskStatusLabel = (status: string | null | undefined): string =>
  ({
    TODO: 'A fazer',
    IN_PROGRESS: 'Em andamento',
    DONE: 'Concluída',
  })[status ?? ''] ??
  status ??
  'Sem status';
