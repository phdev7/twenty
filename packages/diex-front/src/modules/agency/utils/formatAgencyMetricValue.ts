export const formatCurrency = (value: number, currencyCode = 'BRL') =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
  }).format(value);

export const formatNumber = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export const formatRatio = (value: number) => `${formatNumber(value)}x`;
