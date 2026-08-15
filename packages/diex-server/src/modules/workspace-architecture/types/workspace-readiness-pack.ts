import { type WorkspaceTemplateDefinition } from 'src/modules/workspace-architecture/types/workspace-template.type';

export type WorkspaceReadinessPhase =
  | 'DISCOVERY_REVIEW'
  | 'ARCHITECTURE_APPROVAL'
  | 'CHANNEL_CONNECTION'
  | 'FIRST_REVENUE_FLOW'
  | 'TEAM_ENABLEMENT'
  | 'COCKPIT_OPERATIONAL'
  | 'READY';

export type WorkspacePrimaryChannel =
  | 'WHATSAPP'
  | 'EMAIL'
  | 'IMPORT'
  | 'MANUAL'
  | 'LATER';

export type WorkspaceReadinessEvidenceSource =
  | 'CONTEXT'
  | 'PROFILE'
  | 'BLUEPRINT'
  | 'CHANNEL'
  | 'INBOX'
  | 'TEAM'
  | 'PAGE_CATALOG'
  | 'OBJECT'
  | 'AI_ACTION'
  | 'CUSTOM';

export type WorkspaceReadinessCriterion = {
  key: string;
  label: string;
  phase: Exclude<WorkspaceReadinessPhase, 'READY'>;
  required: boolean;
  weight: number;
  source: WorkspaceReadinessEvidenceSource;
  firstValue: boolean;
  nextAction: string;
  // Um critério que bloqueia a ativação impede o uso do CRM enquanto não for
  // cumprido. Só entram aqui as decisões que o administrador consegue tomar na
  // própria tela de configuração; tudo que depende de dado real da operação
  // (mensagem recebida, triagem, equipe) conta para a prontidão sem travar.
  blocksActivation: boolean;
  sourceTemplateIds: string[];
};

// Portão de ativação: o contexto revisado e a arquitetura publicada. Ambos são
// atos explícitos do administrador, com evidência persistida.
export const WORKSPACE_ACTIVATION_CRITERION_KEYS = [
  'context_active',
  'architecture_approved',
] as const;

export const criterionBlocksActivation = (key: string): boolean =>
  (WORKSPACE_ACTIVATION_CRITERION_KEYS as readonly string[]).includes(key);

export type WorkspaceReadinessPack = {
  version: string;
  goal: string | null;
  primaryChannel: WorkspacePrimaryChannel | null;
  operationLabel: string;
  readyLabel: string;
  selectedTemplateIds: string[];
  criteria: WorkspaceReadinessCriterion[];
};

const PHASE_ORDER: Exclude<WorkspaceReadinessPhase, 'READY'>[] = [
  'DISCOVERY_REVIEW',
  'ARCHITECTURE_APPROVAL',
  'CHANNEL_CONNECTION',
  'FIRST_REVENUE_FLOW',
  'TEAM_ENABLEMENT',
  'COCKPIT_OPERATIONAL',
];

const READY_LABELS_BY_GOAL: Record<string, string> = {
  SELL_MORE: 'CRM pronto para vender',
  RESPOND_FASTER: 'CRM pronto para responder mais rápido',
  ORGANIZE_WHATSAPP: 'CRM pronto para operar no WhatsApp',
  CONTROL_FOLLOWUPS: 'CRM pronto para controlar follow-ups',
  CUSTOMER_SUCCESS_RENEWALS: 'CRM pronto para proteger receita',
};

type WorkspaceReadinessCriterionDraft = Omit<
  WorkspaceReadinessCriterion,
  'sourceTemplateIds' | 'blocksActivation'
>;

const UNIVERSAL_CRITERIA: WorkspaceReadinessCriterionDraft[] = [
  {
    key: 'context_active',
    label: 'Contexto da operação ativo',
    phase: 'DISCOVERY_REVIEW',
    required: true,
    weight: 2,
    source: 'CONTEXT',
    firstValue: false,
    nextAction: 'Revise e ative o contexto operacional da empresa.',
  },
  {
    key: 'goal_defined',
    label: 'Objetivo prioritário definido',
    phase: 'DISCOVERY_REVIEW',
    required: true,
    weight: 1,
    source: 'PROFILE',
    firstValue: false,
    nextAction:
      'Escolha o resultado que a operação precisa priorizar primeiro.',
  },
  {
    key: 'offer_registered',
    label: 'Produto, serviço ou oferta cadastrado',
    phase: 'DISCOVERY_REVIEW',
    required: true,
    weight: 2,
    source: 'OBJECT',
    firstValue: false,
    nextAction: 'Cadastre o produto, serviço ou oferta que gera receita.',
  },
  {
    key: 'ideal_customer_defined',
    label: 'Público ou cliente ideal definido',
    phase: 'DISCOVERY_REVIEW',
    required: true,
    weight: 2,
    source: 'CONTEXT',
    firstValue: false,
    nextAction: 'Defina para quem a operação entrega valor.',
  },
  {
    key: 'architecture_approved',
    label: 'Arquitetura recomendada aprovada e publicada',
    phase: 'ARCHITECTURE_APPROVAL',
    required: true,
    weight: 2,
    source: 'BLUEPRINT',
    firstValue: false,
    nextAction: 'Aprove e publique a arquitetura recomendada.',
  },
  {
    key: 'channel_connected',
    label: 'Forma principal de entrada definida e validada',
    phase: 'CHANNEL_CONNECTION',
    required: true,
    weight: 2,
    source: 'CHANNEL',
    firstValue: false,
    nextAction:
      'Defina a forma principal de entrada e valide-a com dados reais.',
  },
  {
    key: 'first_conversation_received',
    label: 'Primeira entrada operacional recebida',
    phase: 'FIRST_REVENUE_FLOW',
    required: true,
    weight: 2,
    source: 'INBOX',
    firstValue: true,
    nextAction: 'Receba a primeira mensagem ou entrada real da operação.',
  },
  {
    key: 'first_contact_identified',
    label: 'Primeiro contato identificado ou criado',
    phase: 'FIRST_REVENUE_FLOW',
    required: true,
    weight: 2,
    source: 'OBJECT',
    firstValue: true,
    nextAction: 'Identifique ou crie o contato ligado à primeira conversa.',
  },
  {
    key: 'first_follow_up_created',
    label: 'Primeira próxima ação criada',
    phase: 'FIRST_REVENUE_FLOW',
    required: true,
    weight: 2,
    source: 'OBJECT',
    firstValue: true,
    nextAction: 'Crie a próxima ação com responsável e prazo.',
  },
  {
    key: 'first_ai_triage_completed',
    label: 'Primeira triagem com IA concluída',
    phase: 'FIRST_REVENUE_FLOW',
    required: true,
    weight: 2,
    source: 'AI_ACTION',
    firstValue: true,
    nextAction: 'Execute a triagem da IA e gere a primeira resposta sugerida.',
  },
  {
    key: 'owners_defined',
    label: 'Responsáveis operacionais definidos',
    phase: 'TEAM_ENABLEMENT',
    required: true,
    weight: 1,
    source: 'TEAM',
    firstValue: false,
    nextAction: 'Defina quem será responsável por cada entrada da operação.',
  },
  {
    key: 'cockpit_operational',
    label: 'Cockpit inicial com próxima ação disponível',
    phase: 'COCKPIT_OPERATIONAL',
    required: true,
    weight: 2,
    source: 'PAGE_CATALOG',
    firstValue: false,
    nextAction: 'Abra o cockpit e confirme a próxima ação prioritária.',
  },
];

const CRITERION_ALIASES: Record<string, string> = {
  context_reviewed: 'context_active',
  blueprint_approved: 'architecture_approved',
  first_contact_registered: 'first_contact_identified',
  consentimento_de_contato_registrado: 'base_legal_de_contato_registrada',
};

const CRITERION_LABELS: Record<string, string> = {
  routing_rule_published: 'Regra de distribuição publicada',
  sla_defined: 'SLA operacional definido',
  required_fields_validated: 'Campos obrigatórios validados',
  approval_matrix_defined: 'Matriz de aprovações definida',
  scheduling_configured: 'Agenda e agendamento configurados',
  responsavel_tecnica_definida: 'Responsável técnico definido',
  base_legal_de_contato_registrada: 'Base legal de contato registrada',
};

const humanizeCriterion = (key: string): string =>
  key
    .replace(/_configured$/, ' configurado')
    .replace(/_defined$/, ' definido')
    .replace(/_registered$/, ' registrado')
    .replace(/_published$/, ' publicado')
    .replace(/_/g, ' ')
    .replace(/^./, (value) => value.toUpperCase());

const criterionPhase = (key: string): WorkspaceReadinessCriterion['phase'] => {
  if (
    key.includes('context') ||
    key.includes('ideal_customer') ||
    key.includes('consentimento') ||
    key.includes('base_legal') ||
    key.includes('responsavel')
  ) {
    return 'DISCOVERY_REVIEW';
  }

  if (key.includes('blueprint') || key.includes('architecture')) {
    return 'ARCHITECTURE_APPROVAL';
  }

  if (key.includes('channel') || key.includes('whatsapp')) {
    return 'CHANNEL_CONNECTION';
  }

  if (
    key.startsWith('first_') ||
    key.endsWith('_configured') ||
    key.includes('contact')
  ) {
    return 'FIRST_REVENUE_FLOW';
  }

  if (
    key.includes('owner') ||
    key.includes('routing') ||
    key.includes('sla') ||
    key.includes('approval_matrix') ||
    key.includes('required_fields')
  ) {
    return 'TEAM_ENABLEMENT';
  }

  return 'ARCHITECTURE_APPROVAL';
};

const criterionSource = (key: string): WorkspaceReadinessEvidenceSource => {
  if (
    key.includes('context') ||
    key.includes('ideal_customer') ||
    key.includes('base_legal')
  ) {
    return 'CONTEXT';
  }

  if (key.includes('channel') || key.includes('whatsapp')) {
    return 'CHANNEL';
  }

  if (key.includes('ai_')) {
    return 'AI_ACTION';
  }

  if (
    key.includes('owner') ||
    key.includes('routing') ||
    key.includes('sla') ||
    key.includes('approval')
  ) {
    return 'TEAM';
  }

  if (key.includes('page') || key.includes('cockpit')) {
    return 'PAGE_CATALOG';
  }

  if (key.includes('blueprint') || key.includes('architecture')) {
    return 'BLUEPRINT';
  }

  return key.startsWith('first_') ? 'OBJECT' : 'CUSTOM';
};

const isFirstValueCriterion = (key: string): boolean =>
  key.startsWith('first_') ||
  /(record|result|outcome|follow.?up|triage|next.?action)/.test(key);

const normalizeCriteria = (
  templates: WorkspaceTemplateDefinition[],
): WorkspaceReadinessCriterionDraft[] => {
  const criteria = new Map<string, WorkspaceReadinessCriterionDraft>();

  for (const criterion of UNIVERSAL_CRITERIA) {
    criteria.set(criterion.key, { ...criterion });
  }

  for (const template of templates) {
    for (const rawKey of template.readinessCriteria) {
      const key = CRITERION_ALIASES[rawKey] ?? rawKey;

      if (criteria.has(key)) {
        continue;
      }

      criteria.set(key, {
        key,
        label: CRITERION_LABELS[key] ?? humanizeCriterion(key),
        phase: criterionPhase(key),
        required: true,
        weight: 2,
        source: criterionSource(key),
        firstValue: isFirstValueCriterion(key),
        nextAction: `Conclua o requisito: ${CRITERION_LABELS[key] ?? humanizeCriterion(key)}.`,
      });
    }
  }

  return [...criteria.values()];
};

export const buildWorkspaceReadinessPack = ({
  templates,
  goal,
  primaryChannel,
  teamCount,
  hasSlaTargets,
  hasApprovalRules,
  operationLabel,
}: {
  templates: WorkspaceTemplateDefinition[];
  goal?: string | null;
  primaryChannel?: string | null;
  teamCount?: number | null;
  hasSlaTargets?: boolean;
  hasApprovalRules?: boolean;
  operationLabel?: string | null;
}): WorkspaceReadinessPack => {
  let criteria = normalizeCriteria(templates);
  const selectedTemplateIds = templates.map(({ id }) => id);
  const sourceTemplateIds = selectedTemplateIds;
  const addCriterion = (criterion: WorkspaceReadinessCriterionDraft) => {
    if (!criteria.some(({ key }) => key === criterion.key)) {
      criteria.push(criterion);
    }
  };

  if ((teamCount ?? 0) > 1) {
    addCriterion({
      key: 'routing_rule_published',
      label: CRITERION_LABELS.routing_rule_published,
      phase: 'TEAM_ENABLEMENT',
      required: true,
      weight: 1,
      source: 'TEAM',
      firstValue: false,
      nextAction: 'Publique a regra de distribuição entre responsáveis.',
    });
  }

  if (hasSlaTargets) {
    addCriterion({
      key: 'sla_defined',
      label: CRITERION_LABELS.sla_defined,
      phase: 'TEAM_ENABLEMENT',
      required: true,
      weight: 1,
      source: 'TEAM',
      firstValue: false,
      nextAction: 'Defina o SLA de resposta e execução da operação.',
    });
  }

  if (hasApprovalRules) {
    addCriterion({
      key: 'approval_matrix_defined',
      label: CRITERION_LABELS.approval_matrix_defined,
      phase: 'TEAM_ENABLEMENT',
      required: true,
      weight: 1,
      source: 'TEAM',
      firstValue: false,
      nextAction:
        'Defina quem aprova descontos, respostas e mudanças estruturais.',
    });
  }

  const normalizedGoal = goal?.trim().toUpperCase() || null;
  const normalizedPrimaryChannel = [
    'WHATSAPP',
    'EMAIL',
    'IMPORT',
    'MANUAL',
    'LATER',
  ].includes(primaryChannel?.trim().toUpperCase() ?? '')
    ? (primaryChannel?.trim().toUpperCase() as WorkspacePrimaryChannel)
    : null;

  const hasCommercialPipeline = templates.some(
    ({ pipelines }) => pipelines.length > 0,
  );
  const requiresCompanyLink = templates.some(
    ({ requiresCompanyAccount }) => requiresCompanyAccount === true,
  );

  if (hasCommercialPipeline) {
    addCriterion({
      key: 'pipeline_approved',
      label: 'Fluxo operacional aprovado e publicado',
      phase: 'ARCHITECTURE_APPROVAL',
      required: true,
      weight: 2,
      source: 'BLUEPRINT',
      firstValue: false,
      nextAction: 'Aprove e publique as etapas do fluxo recomendado.',
    });
  }

  const doesNotRequireRealtimeConversation =
    normalizedPrimaryChannel === 'IMPORT' ||
    normalizedPrimaryChannel === 'MANUAL';

  if (doesNotRequireRealtimeConversation) {
    criteria = criteria.filter(
      ({ key }) =>
        key !== 'first_conversation_received' &&
        key !== 'first_ai_triage_completed',
    );
  }

  const channelCriterion = criteria.find(
    ({ key }) => key === 'channel_connected',
  );

  if (channelCriterion) {
    if (doesNotRequireRealtimeConversation) {
      channelCriterion.label = 'Forma principal de entrada configurada';
      channelCriterion.nextAction =
        normalizedPrimaryChannel === 'IMPORT'
          ? 'Importe a base inicial e valide os primeiros registros.'
          : 'Confirme que a operação seguirá com cadastros manuais.';
    } else if (normalizedPrimaryChannel === 'EMAIL') {
      channelCriterion.label = 'E-mail principal conectado e validado';
      channelCriterion.nextAction =
        'Conecte o e-mail principal e valide-o com uma mensagem real.';
    } else if (normalizedPrimaryChannel === 'WHATSAPP') {
      channelCriterion.label = 'WhatsApp conectado e validado';
      channelCriterion.nextAction =
        'Conecte o WhatsApp pelo QR Code e valide-o com uma mensagem real.';
    } else {
      channelCriterion.label = 'Forma principal de entrada definida';
      channelCriterion.nextAction =
        'Escolha WhatsApp, e-mail, importação ou operação sem integração.';
    }
  }

  if (requiresCompanyLink) {
    addCriterion({
      key: 'first_company_linked',
      label: 'Primeira empresa vinculada ao contato',
      phase: 'FIRST_REVENUE_FLOW',
      required: true,
      weight: 2,
      source: 'OBJECT',
      firstValue: true,
      nextAction: 'Vincule o primeiro contato à empresa ou conta correta.',
    });
  }

  if (hasCommercialPipeline) {
    addCriterion({
      key: 'first_opportunity_created',
      label: 'Primeira oportunidade criada',
      phase: 'FIRST_REVENUE_FLOW',
      required: true,
      weight: 3,
      source: 'OBJECT',
      firstValue: true,
      nextAction: 'Crie a primeira oportunidade a partir da conversa.',
    });
  }

  const orderedCriteria = criteria
    .map((criterion) => ({
      ...criterion,
      blocksActivation: criterionBlocksActivation(criterion.key),
      sourceTemplateIds,
    }))
    .sort((left, right) => {
      const phaseDifference =
        PHASE_ORDER.indexOf(left.phase) - PHASE_ORDER.indexOf(right.phase);

      return phaseDifference !== 0
        ? phaseDifference
        : left.key.localeCompare(right.key);
    });

  return {
    version: '1.1.0',
    goal: normalizedGoal,
    primaryChannel: normalizedPrimaryChannel,
    operationLabel:
      operationLabel?.trim() ||
      templates.find(({ kind }) => kind === 'BUSINESS_MODEL')?.name ||
      'Operação',
    readyLabel:
      (normalizedGoal === 'ORGANIZE_WHATSAPP' &&
      normalizedPrimaryChannel !== null &&
      normalizedPrimaryChannel !== 'WHATSAPP'
        ? 'CRM pronto para organizar as entradas'
        : normalizedGoal
          ? READY_LABELS_BY_GOAL[normalizedGoal]
          : null) ??
      (hasCommercialPipeline
        ? 'CRM pronto para vender'
        : 'CRM pronto para operar'),
    selectedTemplateIds,
    criteria: orderedCriteria,
  };
};
