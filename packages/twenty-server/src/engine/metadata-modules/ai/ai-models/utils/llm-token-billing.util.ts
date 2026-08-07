export interface LlmTokenUsageParams {
  promptTokens: number;
  completionTokens: number;
  inputCostPerMillionTokens: number;
  outputCostPerMillionTokens: number;
}

export interface LlmTokenCostResult {
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  microCreditsUsed: number;
}

/**
 * Calculates exact microcredits used for an LLM request based on input/output token pricing.
 * 1 USD = 1,000,000 microcredits in Twenty/Diex billing architecture.
 */
export function calculateLlmTokenCostInMicroCredits({
  promptTokens,
  completionTokens,
  inputCostPerMillionTokens,
  outputCostPerMillionTokens,
}: LlmTokenUsageParams): LlmTokenCostResult {
  const inputCostUsd = (promptTokens / 1_000_000) * inputCostPerMillionTokens;
  const outputCostUsd = (completionTokens / 1_000_000) * outputCostPerMillionTokens;
  const totalCostUsd = inputCostUsd + outputCostUsd;

  // Convert USD to microcredits (1 USD = 1,000,000 microcredits)
  const microCreditsUsed = Math.ceil(totalCostUsd * 1_000_000);

  return {
    inputCostUsd,
    outputCostUsd,
    totalCostUsd,
    microCreditsUsed,
  };
}
