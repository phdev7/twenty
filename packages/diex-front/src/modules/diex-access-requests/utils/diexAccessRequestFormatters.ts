export const formatDiexAccessRequestDateTime = (
  value: string | null,
): string => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
};

export const slugifyDiexAccessRequestSubdomain = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
