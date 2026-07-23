import { defineLogicFunction } from 'twenty-sdk/define';

export type CustomerHealthInput = {
  onboardingCompleted?: boolean;
  activeUseRating?: number;
  valueEvidenceRating?: number;
  daysSinceLastMeaningfulContact?: number;
  daysUntilRenewal?: number;
  openBlockedMilestones?: number;
  unresolvedCriticalSignals?: number;
  expansionSignal?: boolean;
};

type HealthFactor = {
  key: string;
  label: string;
  score: number;
  maximum: number;
};

export type CustomerHealthResult = {
  score: number;
  health: 'HEALTHY' | 'ATTENTION' | 'CRITICAL' | 'UNKNOWN';
  completeness: number;
  factors: HealthFactor[];
  penalties: HealthFactor[];
  gaps: string[];
  riskReasons: string[];
  expansionCandidate: boolean;
  recommendation: string;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export const assessCustomerHealth = (
  input: CustomerHealthInput,
): CustomerHealthResult => {
  const factors: HealthFactor[] = [];
  const penalties: HealthFactor[] = [];
  const gaps: string[] = [];
  const riskReasons: string[] = [];

  if (input.onboardingCompleted === undefined) {
    gaps.push('situação do onboarding');
  } else {
    factors.push({
      key: 'onboarding',
      label: 'onboarding concluído',
      score: input.onboardingCompleted ? 15 : 0,
      maximum: 15,
    });

    if (!input.onboardingCompleted) {
      riskReasons.push('onboarding ainda não concluído');
    }
  }

  if (input.activeUseRating === undefined) {
    gaps.push('nível de adoção');
  } else {
    const adoption = (clamp(input.activeUseRating, 0, 5) / 5) * 25;

    factors.push({
      key: 'adoption',
      label: 'adoção',
      score: adoption,
      maximum: 25,
    });

    if (input.activeUseRating < 3) {
      riskReasons.push('adoção abaixo do esperado');
    }
  }

  if (input.valueEvidenceRating === undefined) {
    gaps.push('evidência de valor');
  } else {
    const valueEvidence =
      (clamp(input.valueEvidenceRating, 0, 5) / 5) * 25;

    factors.push({
      key: 'valueEvidence',
      label: 'valor comprovado',
      score: valueEvidence,
      maximum: 25,
    });

    if (input.valueEvidenceRating < 3) {
      riskReasons.push('valor ainda não comprovado ao cliente');
    }
  }

  if (input.daysSinceLastMeaningfulContact === undefined) {
    gaps.push('último contato relevante');
  } else {
    const contactScore =
      input.daysSinceLastMeaningfulContact <= 14
        ? 15
        : input.daysSinceLastMeaningfulContact <= 30
          ? 10
          : input.daysSinceLastMeaningfulContact <= 60
            ? 5
            : 0;

    factors.push({
      key: 'relationshipFreshness',
      label: 'recência do relacionamento',
      score: contactScore,
      maximum: 15,
    });

    if (input.daysSinceLastMeaningfulContact > 30) {
      riskReasons.push('contato relevante desatualizado');
    }
  }

  if (input.openBlockedMilestones === undefined) {
    gaps.push('marcos bloqueados');
  } else {
    const milestoneScore =
      input.openBlockedMilestones === 0
        ? 10
        : input.openBlockedMilestones === 1
          ? 5
          : 0;

    factors.push({
      key: 'milestoneExecution',
      label: 'execução dos marcos',
      score: milestoneScore,
      maximum: 10,
    });

    if (input.openBlockedMilestones > 0) {
      riskReasons.push(
        `${input.openBlockedMilestones} marco(s) de sucesso bloqueado(s)`,
      );
    }
  }

  if (input.unresolvedCriticalSignals === undefined) {
    gaps.push('sinais críticos em aberto');
  } else {
    const signalScore =
      input.unresolvedCriticalSignals === 0
        ? 10
        : input.unresolvedCriticalSignals === 1
          ? 5
          : 0;

    factors.push({
      key: 'criticalSignals',
      label: 'sinais críticos tratados',
      score: signalScore,
      maximum: 10,
    });

    if (input.unresolvedCriticalSignals > 0) {
      riskReasons.push(
        `${input.unresolvedCriticalSignals} sinal(is) crítico(s) sem tratamento`,
      );
    }
  }

  if (
    input.daysUntilRenewal !== undefined &&
    input.valueEvidenceRating !== undefined
  ) {
    const renewalPenalty =
      input.daysUntilRenewal <= 30 && input.valueEvidenceRating < 4
        ? 15
        : input.daysUntilRenewal <= 60 && input.valueEvidenceRating < 3
          ? 10
          : 0;

    if (renewalPenalty > 0) {
      penalties.push({
        key: 'renewalPressure',
        label: 'renovação sem valor suficientemente comprovado',
        score: renewalPenalty,
        maximum: 15,
      });
      riskReasons.push('renovação próxima com evidência de valor insuficiente');
    }
  } else if (input.daysUntilRenewal === undefined) {
    gaps.push('dias até a renovação');
  }

  const factorScore = factors.reduce(
    (total, factor) => total + factor.score,
    0,
  );
  const penaltyScore = penalties.reduce(
    (total, penalty) => total + penalty.score,
    0,
  );
  const score = Math.round(clamp(factorScore - penaltyScore, 0, 100));
  const completeness = Math.round((factors.length / 6) * 100);
  const health =
    completeness < 50
      ? 'UNKNOWN'
      : score >= 75
        ? 'HEALTHY'
        : score >= 50
          ? 'ATTENTION'
          : 'CRITICAL';
  const expansionCandidate =
    health === 'HEALTHY' && input.expansionSignal === true;
  const recommendation =
    health === 'UNKNOWN'
      ? `Completar primeiro: ${gaps.slice(0, 3).join(', ')}.`
      : input.openBlockedMilestones !== undefined &&
          input.openBlockedMilestones > 0
        ? 'Desbloquear o marco de maior impacto e registrar evidência do resultado.'
        : penaltyScore > 0
          ? 'Realizar revisão de valor antes da renovação e registrar o plano de recuperação.'
          : health === 'CRITICAL'
            ? 'Abrir intervenção de CS com responsável, prazo e critério de recuperação.'
            : expansionCandidate
              ? 'Validar a oportunidade de expansão com o cliente antes de criar uma oportunidade.'
              : 'Executar a próxima revisão de sucesso e manter os marcos atualizados.';

  return {
    score,
    health,
    completeness,
    factors,
    penalties,
    gaps,
    riskReasons,
    expansionCandidate,
    recommendation,
  };
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    onboardingCompleted: { type: 'boolean' as const },
    activeUseRating: {
      type: 'number' as const,
      minimum: 0,
      maximum: 5,
    },
    valueEvidenceRating: {
      type: 'number' as const,
      minimum: 0,
      maximum: 5,
    },
    daysSinceLastMeaningfulContact: {
      type: 'integer' as const,
      minimum: 0,
    },
    daysUntilRenewal: { type: 'integer' as const },
    openBlockedMilestones: {
      type: 'integer' as const,
      minimum: 0,
    },
    unresolvedCriticalSignals: {
      type: 'integer' as const,
      minimum: 0,
    },
    expansionSignal: { type: 'boolean' as const },
  },
};

export default defineLogicFunction({
  universalIdentifier: 'd1e0b000-0000-4000-8000-000000000002',
  name: 'assess-diex-customer-health',
  description:
    'Calcula saúde de Customer Success com evidências, lacunas e risco de renovação explicável.',
  timeoutSeconds: 5,
  handler: assessCustomerHealth,
  toolTriggerSettings: {
    inputSchema,
  },
  workflowActionTriggerSettings: {
    label: 'Avaliar saúde do cliente Diex',
    inputSchema: [{ ...inputSchema }],
    outputSchema: [
      {
        type: 'object',
        properties: {
          score: { type: 'number' },
          health: { type: 'string' },
          completeness: { type: 'number' },
          factors: { type: 'array', items: { type: 'object' } },
          penalties: { type: 'array', items: { type: 'object' } },
          gaps: { type: 'array', items: { type: 'string' } },
          riskReasons: { type: 'array', items: { type: 'string' } },
          expansionCandidate: { type: 'boolean' },
          recommendation: { type: 'string' },
        },
      },
    ],
  },
});
