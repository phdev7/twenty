import { z } from 'zod';

const calculateCommercialScoreSchema = z.object({
  icpFit: z.number().min(0).max(5).optional(),
  buyingIntent: z.number().min(0).max(5).optional(),
  engagement: z.number().min(0).max(5).optional(),
  decisionAccess: z.boolean().optional(),
  budgetConfirmed: z.boolean().optional(),
  needConfirmed: z.boolean().optional(),
  timingConfirmed: z.boolean().optional(),
  nextActionScheduled: z.boolean().optional(),
  inactivityDays: z.number().int().min(0).optional(),
  openHighRiskSignals: z.number().int().min(0).optional(),
});

type CommercialScoreInput = z.infer<typeof calculateCommercialScoreSchema>;

type ScoreComponent = {
  key: string;
  label: string;
  score: number;
  maximum: number;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const ratingComponent = ({
  key,
  label,
  value,
  maximum,
  gaps,
}: {
  key: string;
  label: string;
  value: number | undefined;
  maximum: number;
  gaps: string[];
}): ScoreComponent | null => {
  if (value === undefined) {
    gaps.push(label);

    return null;
  }

  return {
    key,
    label,
    score: (clamp(value, 0, 5) / 5) * maximum,
    maximum,
  };
};

const booleanComponent = ({
  key,
  label,
  value,
  maximum,
  gaps,
}: {
  key: string;
  label: string;
  value: boolean | undefined;
  maximum: number;
  gaps: string[];
}): ScoreComponent | null => {
  if (value === undefined) {
    gaps.push(label);

    return null;
  }

  return {
    key,
    label,
    score: value ? maximum : 0,
    maximum,
  };
};

const calculateCommercialScore = (input: CommercialScoreInput) => {
  const gaps: string[] = [];
  const candidates = [
    ratingComponent({
      key: 'icpFit',
      label: 'aderência ao ICP',
      value: input.icpFit,
      maximum: 20,
      gaps,
    }),
    ratingComponent({
      key: 'buyingIntent',
      label: 'intenção de compra',
      value: input.buyingIntent,
      maximum: 20,
      gaps,
    }),
    ratingComponent({
      key: 'engagement',
      label: 'engajamento',
      value: input.engagement,
      maximum: 15,
      gaps,
    }),
    booleanComponent({
      key: 'decisionAccess',
      label: 'acesso ao decisor',
      value: input.decisionAccess,
      maximum: 10,
      gaps,
    }),
    booleanComponent({
      key: 'budgetConfirmed',
      label: 'orçamento confirmado',
      value: input.budgetConfirmed,
      maximum: 10,
      gaps,
    }),
    booleanComponent({
      key: 'needConfirmed',
      label: 'necessidade confirmada',
      value: input.needConfirmed,
      maximum: 10,
      gaps,
    }),
    booleanComponent({
      key: 'timingConfirmed',
      label: 'prazo de compra confirmado',
      value: input.timingConfirmed,
      maximum: 10,
      gaps,
    }),
    booleanComponent({
      key: 'nextActionScheduled',
      label: 'próxima ação agendada',
      value: input.nextActionScheduled,
      maximum: 5,
      gaps,
    }),
  ];
  const components = candidates.filter(
    (component): component is ScoreComponent => component !== null,
  );
  const penalties: ScoreComponent[] = [];

  if (input.inactivityDays !== undefined) {
    const inactivityPenalty = clamp(
      Math.max(0, input.inactivityDays - 7) * 0.5,
      0,
      15,
    );

    penalties.push({
      key: 'inactivity',
      label: 'inatividade',
      score: inactivityPenalty,
      maximum: 15,
    });
  } else {
    gaps.push('dias sem interação relevante');
  }

  if (input.openHighRiskSignals !== undefined) {
    penalties.push({
      key: 'highRiskSignals',
      label: 'sinais críticos em aberto',
      score: clamp(input.openHighRiskSignals * 10, 0, 30),
      maximum: 30,
    });
  } else {
    gaps.push('sinais críticos em aberto');
  }

  const positiveScore = components.reduce(
    (total, component) => total + component.score,
    0,
  );
  const penaltyScore = penalties.reduce(
    (total, penalty) => total + penalty.score,
    0,
  );
  const score = Math.round(clamp(positiveScore - penaltyScore, 0, 100));
  const completeness = Math.round(
    (components.length / candidates.length) * 100,
  );
  const band =
    completeness < 50
      ? 'INSUFFICIENT_DATA'
      : score >= 75
        ? 'HOT'
        : score >= 50
          ? 'WARM'
          : 'COLD';
  const recommendation =
    band === 'INSUFFICIENT_DATA'
      ? `Preencher primeiro: ${gaps.slice(0, 3).join(', ')}.`
      : penaltyScore >= 20
        ? 'Tratar os sinais críticos e recuperar contato antes de avançar a previsão.'
        : input.nextActionScheduled !== true
          ? 'Definir responsável, próxima ação objetiva e data de execução.'
          : score >= 75
            ? 'Executar a próxima ação e validar decisão, orçamento e prazo.'
            : 'Fechar a principal lacuna de qualificação antes de avançar a etapa.';

  return {
    score,
    band,
    completeness,
    components,
    penalties,
    gaps,
    recommendation,
  };
};

export const createCalculateCommercialScoreTool = () => ({
  name: 'calculate_diex_commercial_score' as const,
  description:
    'Calcula um score comercial transparente de 0 a 100, informa lacunas e não confunde previsão com compromisso.',
  inputSchema: calculateCommercialScoreSchema,
  execute: async (parameters: CommercialScoreInput) =>
    calculateCommercialScore(parameters),
});
