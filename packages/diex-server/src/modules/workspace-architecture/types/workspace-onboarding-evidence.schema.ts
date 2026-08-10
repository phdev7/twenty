import { z } from 'zod';

export const workspaceOnboardingEvidenceEventSchema = z.object({
  id: z.uuid(),
  key: z.string().min(1),
  ready: z.boolean(),
  recordId: z.string().nullable(),
  source: z.string().min(1),
  occurredAt: z.iso.datetime(),
  details: z.record(z.string(), z.unknown()).default({}),
});

export const workspaceOnboardingEvidenceMilestoneSchema = z.object({
  key: z.string().min(1),
  ready: z.boolean(),
  recordId: z.string().nullable(),
  firstSeenAt: z.iso.datetime().nullable(),
  lastSeenAt: z.iso.datetime().nullable(),
  source: z.string().min(1),
});

export const workspaceOnboardingJourneyPhaseSchema = z.enum([
  'DISCOVERY_REVIEW',
  'ARCHITECTURE_APPROVAL',
  'CHANNEL_CONNECTION',
  'FIRST_REVENUE_FLOW',
  'TEAM_ENABLEMENT',
  'COCKPIT_OPERATIONAL',
  'SELLING_READY',
]);

export const workspaceOnboardingJourneyTransitionSchema = z.object({
  from: workspaceOnboardingJourneyPhaseSchema.nullable(),
  to: workspaceOnboardingJourneyPhaseSchema,
  occurredAt: z.iso.datetime(),
  reason: z.string().min(1),
});

export const workspaceOnboardingJourneySchema = z
  .object({
    phase: workspaceOnboardingJourneyPhaseSchema,
    phaseIndex: z.number().int().min(0),
    completedPhases: z.array(workspaceOnboardingJourneyPhaseSchema),
    blockers: z.array(z.string().min(1)),
    nextAction: z.string().min(1),
    startedAt: z.iso.datetime(),
    lastTransitionAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
    transitions: z.array(workspaceOnboardingJourneyTransitionSchema).max(100),
  })
  .default({
    phase: 'DISCOVERY_REVIEW',
    phaseIndex: 0,
    completedPhases: [],
    blockers: ['context_active'],
    nextAction: 'Definir o contexto comercial da operação.',
    startedAt: new Date(0).toISOString(),
    lastTransitionAt: new Date(0).toISOString(),
    completedAt: null,
    transitions: [],
  });

export const workspaceOnboardingEvidenceSchema = z.object({
  schemaVersion: z.enum(['1.0.0', '1.1.0', '1.2.0']),
  version: z.number().int().positive(),
  milestones: z.array(workspaceOnboardingEvidenceMilestoneSchema),
  events: z.array(workspaceOnboardingEvidenceEventSchema).max(500),
  activation: z
    .object({
      completedCount: z.number().int().nonnegative(),
      totalCount: z.number().int().nonnegative(),
      score: z.number().int().min(0).max(100),
      firstValueAt: z.iso.datetime().nullable(),
      blockers: z.array(z.string().min(1)),
    })
    .default({
      completedCount: 0,
      totalCount: 0,
      score: 0,
      firstValueAt: null,
      blockers: [],
    }),
  channel: z
    .object({
      provider: z.literal('WHATSAPP'),
      state: z.enum([
        'CONNECTED',
        'AWAITING_SCAN',
        'CONNECTING',
        'NOT_PROVISIONED',
        'UNAVAILABLE',
        'UNKNOWN',
      ]),
      instanceName: z.string().nullable(),
      lastCheckedAt: z.iso.datetime().nullable(),
      validatedAt: z.iso.datetime().nullable(),
      lastError: z.string().nullable(),
    })
    .default({
      provider: 'WHATSAPP',
      state: 'UNKNOWN',
      instanceName: null,
      lastCheckedAt: null,
      validatedAt: null,
      lastError: null,
    }),
  journey: workspaceOnboardingJourneySchema,
  lastReconciledAt: z.iso.datetime(),
  reconciliationSource: z.string().min(1),
});

export type WorkspaceOnboardingEvidence = z.infer<
  typeof workspaceOnboardingEvidenceSchema
>;
export type WorkspaceOnboardingEvidenceMilestone = z.infer<
  typeof workspaceOnboardingEvidenceMilestoneSchema
>;
export type WorkspaceOnboardingJourney = z.infer<
  typeof workspaceOnboardingJourneySchema
>;

const JOURNEY_PHASES: Array<
  z.infer<typeof workspaceOnboardingJourneyPhaseSchema>
> = [
  'DISCOVERY_REVIEW',
  'ARCHITECTURE_APPROVAL',
  'CHANNEL_CONNECTION',
  'FIRST_REVENUE_FLOW',
  'TEAM_ENABLEMENT',
  'COCKPIT_OPERATIONAL',
  'SELLING_READY',
];

const JOURNEY_PHASE_LABELS: Record<
  z.infer<typeof workspaceOnboardingJourneyPhaseSchema>,
  string
> = {
  DISCOVERY_REVIEW: 'Revisar o entendimento da operação',
  ARCHITECTURE_APPROVAL: 'Aprovar a arquitetura recomendada',
  CHANNEL_CONNECTION: 'Conectar e validar o canal principal',
  FIRST_REVENUE_FLOW: 'Executar o primeiro fluxo de receita',
  TEAM_ENABLEMENT: 'Configurar a equipe para operar',
  COCKPIT_OPERATIONAL: 'Abrir o cockpit com dados acionáveis',
  SELLING_READY: 'CRM pronto para vender',
};

const JOURNEY_PHASE_REQUIREMENTS: Record<
  z.infer<typeof workspaceOnboardingJourneyPhaseSchema>,
  string[]
> = {
  DISCOVERY_REVIEW: [
    'context_active',
    'offer_registered',
    'ideal_customer_defined',
  ],
  ARCHITECTURE_APPROVAL: ['pipeline_approved'],
  CHANNEL_CONNECTION: ['channel_connected'],
  FIRST_REVENUE_FLOW: [
    'first_conversation_received',
    'first_company_linked',
    'first_opportunity_created',
    'first_follow_up_created',
    'first_ai_triage_completed',
  ],
  TEAM_ENABLEMENT: ['owners_defined'],
  COCKPIT_OPERATIONAL: ['cockpit_operational'],
  SELLING_READY: [
    'context_active',
    'offer_registered',
    'ideal_customer_defined',
    'pipeline_approved',
    'owners_defined',
    'channel_connected',
    'first_conversation_received',
    'first_company_linked',
    'first_opportunity_created',
    'first_follow_up_created',
    'first_ai_triage_completed',
    'cockpit_operational',
  ],
};

const JOURNEY_NEXT_ACTIONS: Record<string, string> = {
  context_active: 'Ative o contexto comercial revisado da empresa.',
  offer_registered: 'Cadastre pelo menos um produto ou oferta ativa.',
  ideal_customer_defined: 'Defina o cliente ideal para orientar a IA.',
  pipeline_approved: 'Aprove e publique o pipeline recomendado.',
  owners_defined: 'Defina pelo menos um responsável operacional.',
  channel_connected: 'Conecte o WhatsApp e valide-o com uma mensagem real.',
  first_conversation_received: 'Receba a primeira conversa no canal conectado.',
  first_company_linked: 'Vincule uma empresa ao primeiro lead recebido.',
  first_opportunity_created: 'Crie a primeira oportunidade a partir da conversa.',
  first_follow_up_created: 'Crie o primeiro follow-up para não perder a receita.',
  first_ai_triage_completed: 'Conclua a triagem da IA e revise a resposta sugerida.',
  cockpit_operational: 'Abra o cockpit e confirme a próxima ação de receita.',
};

export const deriveWorkspaceOnboardingJourney = ({
  milestones,
  previousJourney,
  now = new Date().toISOString(),
}: {
  milestones: WorkspaceOnboardingEvidenceMilestone[];
  previousJourney?: WorkspaceOnboardingJourney;
  now?: string;
}): WorkspaceOnboardingJourney => {
  const readyByKey = new Map(
    milestones.map(({ key, ready }) => [key, ready]),
  );
  const firstIncompletePhase = JOURNEY_PHASES.find((phase) =>
    JOURNEY_PHASE_REQUIREMENTS[phase].some(
      (key) => readyByKey.get(key) !== true,
    ),
  );
  const phase = firstIncompletePhase ?? 'SELLING_READY';
  const phaseIndex = JOURNEY_PHASES.indexOf(phase);
  const completedPhases = JOURNEY_PHASES.filter((candidate) =>
    JOURNEY_PHASE_REQUIREMENTS[candidate].every(
      (key) => readyByKey.get(key) === true,
    ),
  );
  const blockers = JOURNEY_PHASE_REQUIREMENTS[phase].filter(
    (key) => readyByKey.get(key) !== true,
  );
  const transitioned = previousJourney?.phase !== phase;
  const transitions = transitioned
    ? [
        ...(previousJourney?.transitions ?? []),
        {
          from: previousJourney?.phase ?? null,
          to: phase,
          occurredAt: now,
          reason:
            phase === 'SELLING_READY'
              ? 'Todos os marcos de ativação foram confirmados.'
              : `A fase anterior foi concluída: ${JOURNEY_PHASE_LABELS[phase]}.`,
        },
      ].slice(-100)
    : (previousJourney?.transitions ?? []);

  return {
    phase,
    phaseIndex,
    completedPhases,
    blockers,
    nextAction:
      phase === 'SELLING_READY'
        ? 'Seu CRM está pronto para vender. Escolha a ação que gera mais receita hoje.'
        : JOURNEY_NEXT_ACTIONS[blockers[0]] ?? JOURNEY_PHASE_LABELS[phase],
    startedAt: previousJourney?.startedAt ?? now,
    lastTransitionAt: transitioned
      ? now
      : (previousJourney?.lastTransitionAt ?? now),
    completedAt:
      phase === 'SELLING_READY'
        ? (previousJourney?.completedAt ?? now)
        : null,
    transitions,
  };
};
