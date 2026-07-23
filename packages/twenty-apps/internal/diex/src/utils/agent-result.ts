import { type RunAgentResult } from 'twenty-sdk/logic-function';

export const asRecord = (
  value: unknown,
): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const readAgentRecord = (
  result: RunAgentResult,
): Record<string, unknown> => {
  const record = asRecord(result.result);

  if (!result.success || !record) {
    throw new Error(
      result.error?.trim() || 'A IA não retornou uma análise estruturada válida.',
    );
  }

  return record;
};

export const readRequiredString = (
  record: Record<string, unknown>,
  key: string,
): string => {
  const value = record[key];

  if (typeof value !== 'string') {
    throw new Error(`A IA não retornou o campo obrigatório "${key}".`);
  }

  return value.trim();
};

export const readNumber = (
  record: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
): number => {
  const value = Number(record[key]);

  if (!Number.isFinite(value)) {
    throw new Error(`A IA não retornou o campo numérico "${key}".`);
  }

  return Math.min(maximum, Math.max(minimum, value));
};

export const readBoolean = (
  record: Record<string, unknown>,
  key: string,
): boolean => record[key] === true;
