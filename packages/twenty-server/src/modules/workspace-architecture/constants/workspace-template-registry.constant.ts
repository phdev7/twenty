import {
  type WorkspaceTemplateComponent,
  type WorkspaceTemplateDefinition,
} from 'src/modules/workspace-architecture/types/workspace-template.type';

const component = (
  key: string,
  label: string,
  benefit: string,
  configuration?: Record<string, unknown>,
  required = true,
): WorkspaceTemplateComponent => ({
  key,
  label,
  description: benefit,
  required,
  benefit,
  configuration,
});

const defineTemplate = (
  value: Pick<
    WorkspaceTemplateDefinition,
    | 'id'
    | 'name'
    | 'description'
    | 'kind'
    | 'activationCriteria'
    | 'compatibleSegments'
  > &
    Partial<WorkspaceTemplateDefinition>,
): WorkspaceTemplateDefinition => ({
  version: '1.0.0',
  prerequisites: [],
  objects: [],
  fields: [],
  relations: [],
  views: [],
  pipelines: [],
  operationalRules: [],
  pages: [],
  blocks: [],
  dashboards: [],
  metrics: [],
  filters: ['period', 'owner', 'team'],
  automations: [],
  roles: [],
  permissions: [],
  integrations: [],
  glossary: {},
  aiInstructions: [],
  forbiddenRules: [
    'Não excluir objetos, campos ou registros automaticamente.',
    'Não publicar mudança estrutural sem aprovação explícita.',
  ],
  readinessCriteria: [],
  dependencies: [],
  conflicts: [],
  updateStrategy: 'Gerar novo blueprint e change set versionado.',
  rollbackStrategy:
    'Restaurar a versão anterior sem apagar dados criados depois da publicação.',
  ...value,
});

const baseUniversal = defineTemplate({
  id: 'diex.base.universal',
  name: 'Base universal Diex',
  description: 'Fundação operacional compartilhada por todo workspace Diex.',
  kind: 'BASE',
  activationCriteria: ['Sempre ativo'],
  compatibleSegments: ['*'],
  objects: [
    component('person', 'Pessoas', 'Centraliza contatos e responsáveis.'),
    component('company', 'Empresas', 'Centraliza contas e organizações.'),
    component(
      'opportunity',
      'Oportunidades',
      'Organiza receita em negociação.',
    ),
    component('task', 'Tarefas', 'Transforma próximos passos em execução.'),
    component('inboxConversation', 'Inbox', 'Consolida conversas comerciais.'),
    component(
      'diexWorkspaceContext',
      'Contexto de IA',
      'Aterra a IA na operação real.',
    ),
  ],
  relations: [
    component(
      'person-company',
      'Pessoa e empresa',
      'Mantém o contexto da conta.',
    ),
    component(
      'opportunity-company',
      'Oportunidade e empresa',
      'Liga receita à conta.',
    ),
    component(
      'task-targets',
      'Tarefas relacionadas',
      'Liga execução ao registro correto.',
    ),
  ],
  views: [
    component(
      'companies-active',
      'Empresas ativas',
      'Facilita gestão de carteira.',
    ),
    component(
      'opportunities-pipeline',
      'Pipeline comercial',
      'Mostra estágio e responsável.',
    ),
    component(
      'tasks-calendar',
      'Agenda de tarefas',
      'Organiza prazos por usuário.',
    ),
  ],
  pages: [
    component(
      'inbox-commercial',
      'Inbox Comercial',
      'Concentra o trabalho de atendimento.',
    ),
    component(
      'commercial-intelligence',
      'Inteligência Comercial',
      'Prioriza decisões de receita.',
    ),
    component('calendar', 'Agenda', 'Organiza tarefas com data e hora.'),
  ],
  blocks: [
    component('kpi', 'KPI', 'Resume indicadores prioritários.'),
    component('table', 'Tabela', 'Expõe listas operacionais.'),
    component('kanban', 'Kanban', 'Organiza processos por etapa.'),
    component('calendar', 'Calendário', 'Mostra execução no tempo.'),
    component('ai-summary', 'Resumo de IA', 'Explica situação e próxima ação.'),
  ],
  dashboards: [
    component(
      'executive-overview',
      'Visão executiva',
      'Mostra receita, execução e riscos.',
    ),
  ],
  metrics: [
    'receita_em_pipeline',
    'conversas_pendentes',
    'tarefas_atrasadas',
    'tempo_de_resposta',
  ],
  automations: [
    component(
      'follow-up-due',
      'Follow-up vencido',
      'Evita perda de oportunidade por inércia.',
    ),
  ],
  roles: [
    component(
      'workspace-admin',
      'Administrador',
      'Governa estrutura e permissões.',
    ),
    component('operator', 'Operador', 'Executa processos autorizados.'),
  ],
  permissions: [
    'workspace_isolation',
    'least_privilege',
    'explicit_structural_approval',
  ],
  integrations: [
    component(
      'whatsapp',
      'WhatsApp',
      'Recebe e envia conversas pelo Inbox.',
      undefined,
      false,
    ),
    component(
      'email',
      'E-mail',
      'Sincroniza e-mails e envio transacional.',
      undefined,
      false,
    ),
  ],
  readinessCriteria: [
    'context_reviewed',
    'blueprint_approved',
    'first_contact_registered',
  ],
});

const businessTemplates = [
  defineTemplate({
    id: 'diex.business.agency',
    name: 'Agência',
    kind: 'BUSINESS_MODEL',
    description: 'Aquisição, propostas, projetos e recorrência para agências.',
    activationCriteria: [
      'agência',
      'marketing',
      'publicidade',
      'tráfego',
      'design',
    ],
    compatibleSegments: ['Agência'],
    objects: [
      component(
        'client-project',
        'Projetos de clientes',
        'Liga venda, escopo, entrega e margem.',
      ),
    ],
    pipelines: [
      component(
        'agency-sales',
        'Pipeline de novos clientes',
        'Organiza briefing, proposta e fechamento.',
      ),
    ],
    pages: [
      component(
        'agency-delivery',
        'Operação de clientes',
        'Mostra entregas, pendências e risco.',
      ),
    ],
    dashboards: [
      component(
        'agency-margin',
        'Receita e margem por cliente',
        'Expõe rentabilidade da carteira.',
      ),
    ],
    metrics: ['mrr', 'ticket_medio', 'margem_por_cliente', 'churn'],
    dependencies: ['diex.base.universal'],
  }),
  defineTemplate({
    id: 'diex.business.saas',
    name: 'SaaS',
    kind: 'BUSINESS_MODEL',
    description:
      'Aquisição, implantação, adoção, expansão e renovação para SaaS.',
    activationCriteria: ['saas', 'software', 'assinatura', 'mrr', 'arr'],
    compatibleSegments: ['SaaS'],
    objects: [
      component(
        'subscription',
        'Assinaturas',
        'Liga conta, plano, receita e renovação.',
      ),
    ],
    pipelines: [
      component(
        'saas-lifecycle',
        'Ciclo de vida SaaS',
        'Conecta venda, implantação, adoção e renovação.',
      ),
    ],
    pages: [
      component(
        'saas-customer-360',
        'Cliente 360',
        'Consolida uso, saúde, receita e risco.',
      ),
    ],
    dashboards: [
      component(
        'saas-revenue',
        'Receita recorrente',
        'Acompanha MRR, expansão e churn.',
      ),
    ],
    metrics: ['mrr', 'arr', 'churn', 'nrr', 'time_to_value'],
    dependencies: [
      'diex.base.universal',
      'diex.capability.customer-success',
      'diex.capability.renewal',
    ],
  }),
  defineTemplate({
    id: 'diex.business.real-estate',
    name: 'Imobiliária',
    kind: 'BUSINESS_MODEL',
    description: 'Captação, imóveis, interessados, visitas e propostas.',
    activationCriteria: [
      'imobiliária',
      'imóvel',
      'corretor',
      'locação',
      'venda de imóveis',
    ],
    compatibleSegments: ['Imobiliária'],
    objects: [
      component(
        'property',
        'Imóveis',
        'Organiza estoque, disponibilidade e condições.',
      ),
      component(
        'visit',
        'Visitas',
        'Registra agenda, interessado e resultado.',
      ),
    ],
    pipelines: [
      component(
        'property-sales',
        'Jornada imobiliária',
        'Conecta interesse, visita, proposta e contrato.',
      ),
    ],
    pages: [
      component(
        'property-portfolio',
        'Carteira de imóveis',
        'Mostra estoque e oportunidades por imóvel.',
      ),
    ],
    metrics: [
      'leads_por_imovel',
      'visitas_agendadas',
      'conversao_visita_proposta',
    ],
    dependencies: ['diex.base.universal'],
  }),
  defineTemplate({
    id: 'diex.business.consulting',
    name: 'Consultoria',
    kind: 'BUSINESS_MODEL',
    description: 'Diagnóstico, proposta, projeto, horas e resultados.',
    activationCriteria: ['consultoria', 'diagnóstico', 'projeto consultivo'],
    compatibleSegments: ['Consultoria'],
    objects: [
      component(
        'engagement',
        'Projetos consultivos',
        'Conecta escopo, marcos, horas e resultado.',
      ),
    ],
    pipelines: [
      component(
        'consulting-sales',
        'Venda consultiva',
        'Organiza diagnóstico, escopo e proposta.',
      ),
    ],
    pages: [
      component(
        'consulting-delivery',
        'Entrega consultiva',
        'Expõe marcos, riscos e evidências de valor.',
      ),
    ],
    metrics: [
      'taxa_de_fechamento',
      'horas_previstas_realizadas',
      'margem_do_projeto',
    ],
    dependencies: ['diex.base.universal', 'diex.capability.delivery'],
  }),
  defineTemplate({
    id: 'diex.business.recurring-services',
    name: 'Serviços recorrentes',
    kind: 'BUSINESS_MODEL',
    description: 'Contratos, execução recorrente, SLA, cobrança e renovação.',
    activationCriteria: [
      'mensalidade',
      'contrato recorrente',
      'serviço recorrente',
      'assinatura de serviço',
    ],
    compatibleSegments: ['Serviços'],
    objects: [
      component(
        'service-contract',
        'Contratos de serviço',
        'Organiza escopo, SLA, valor e vigência.',
      ),
    ],
    pages: [
      component(
        'recurring-operations',
        'Operação recorrente',
        'Mostra carteira, SLA, risco e renovação.',
      ),
    ],
    metrics: ['mrr', 'sla_cumprido', 'inadimplencia', 'renovacoes'],
    dependencies: [
      'diex.base.universal',
      'diex.capability.renewal',
      'diex.capability.billing',
    ],
  }),
  defineTemplate({
    id: 'diex.business.b2b-sales',
    name: 'Vendas B2B',
    kind: 'BUSINESS_MODEL',
    description: 'Prospecção, qualificação, múltiplos decisores e forecast.',
    activationCriteria: [
      'b2b',
      'inside sales',
      'venda complexa',
      'executivo de contas',
    ],
    compatibleSegments: ['B2B'],
    pipelines: [
      component(
        'b2b-pipeline',
        'Pipeline B2B',
        'Expõe qualificação, decisores e próximo passo.',
      ),
    ],
    pages: [
      component(
        'account-plan',
        'Plano de conta',
        'Consolida pessoas, oportunidades, sinais e tarefas.',
      ),
    ],
    dashboards: [
      component(
        'b2b-forecast',
        'Forecast B2B',
        'Mostra receita ponderada, ciclo e riscos.',
      ),
    ],
    metrics: ['pipeline_coverage', 'win_rate', 'sales_cycle', 'forecast'],
    dependencies: [
      'diex.base.universal',
      'diex.capability.prospecting',
      'diex.capability.pre-sales',
      'diex.capability.sales',
    ],
  }),
  defineTemplate({
    id: 'diex.business.franchise',
    name: 'Franquia',
    kind: 'BUSINESS_MODEL',
    description: 'Expansão, unidades, implantação e acompanhamento de padrão.',
    activationCriteria: ['franquia', 'franqueado', 'unidades', 'lojas'],
    compatibleSegments: ['Franquia'],
    objects: [
      component(
        'business-unit',
        'Unidades',
        'Separa carteira, metas e execução por unidade.',
      ),
    ],
    pages: [
      component(
        'franchise-network',
        'Rede de unidades',
        'Mostra desempenho, implantação e conformidade.',
      ),
    ],
    metrics: ['unidades_ativas', 'tempo_de_implantacao', 'receita_por_unidade'],
    dependencies: [
      'diex.base.universal',
      'diex.capability.multi-unit',
      'diex.capability.delivery',
    ],
  }),
  defineTemplate({
    id: 'diex.business.customer-success',
    name: 'Customer Success',
    kind: 'BUSINESS_MODEL',
    description: 'Onboarding, adoção, valor, risco, expansão e renovação.',
    activationCriteria: [
      'customer success',
      'cs',
      'pós-venda',
      'adoção',
      'churn',
    ],
    compatibleSegments: ['Customer Success'],
    objects: [
      component(
        'successPlan',
        'Planos de sucesso',
        'Registra objetivo, saúde e evidência de valor.',
      ),
      component(
        'successMilestone',
        'Marcos de sucesso',
        'Transforma resultado esperado em execução verificável.',
      ),
    ],
    pages: [
      component(
        'customer-success-center',
        'Customer Success',
        'Prioriza risco, adoção e expansão.',
      ),
    ],
    dashboards: [
      component(
        'customer-health',
        'Saúde da carteira',
        'Expõe clientes críticos, atenção e saudáveis.',
      ),
    ],
    metrics: [
      'health_score',
      'time_to_value',
      'adocao',
      'churn_risk',
      'expansion',
    ],
    dependencies: ['diex.base.universal', 'diex.capability.customer-success'],
  }),
];

const capabilityTemplates = [
  [
    'prospecting',
    'Prospecção',
    'Cria listas, cadências e sinais de abordagem.',
    ['lista de prospecção', 'cadência', 'taxa de resposta'],
  ],
  [
    'pre-sales',
    'Pré-vendas',
    'Qualifica demanda antes da oportunidade.',
    ['qualificação', 'mql', 'sql'],
  ],
  [
    'sales',
    'Comercial',
    'Governa oportunidade, próximo passo e forecast.',
    ['oportunidade', 'proposta', 'forecast'],
  ],
  [
    'implementation',
    'Implantação',
    'Organiza onboarding de clientes e go-live.',
    ['implantação', 'go-live', 'onboarding de cliente'],
  ],
  [
    'delivery',
    'Entrega',
    'Controla escopo, marcos, prazos e evidência.',
    ['projeto', 'entrega', 'marco'],
  ],
  [
    'support',
    'Atendimento',
    'Organiza solicitações, prioridade e SLA.',
    ['atendimento', 'suporte', 'sla'],
  ],
  [
    'customer-success',
    'Customer Success',
    'Acompanha adoção, saúde, valor e risco.',
    ['customer success', 'adoção', 'saúde'],
  ],
  [
    'renewal',
    'Renovação',
    'Antecipação de risco e negociação de renovação.',
    ['renovação', 'vigência', 'churn'],
  ],
  [
    'billing',
    'Cobrança',
    'Acompanha vencimento, inadimplência e acordo.',
    ['cobrança', 'inadimplência', 'vencimento'],
  ],
  [
    'ai-governance',
    'Governança de IA',
    'Mantém ações de IA aprováveis e auditáveis.',
    ['ia', 'aprovação', 'auditoria'],
  ],
  [
    'multi-unit',
    'Operação multiunidade',
    'Separa metas, carteira e acesso por unidade.',
    ['unidades', 'filiais', 'franquias'],
  ],
] as const;

const capabilities = capabilityTemplates.map(
  ([id, name, description, keywords]) =>
    defineTemplate({
      id: `diex.capability.${id}`,
      name,
      description,
      kind: 'CAPABILITY',
      activationCriteria: [...keywords],
      compatibleSegments: ['*'],
      pages: [component(`${id}-operations`, name, description)],
      dashboards: [
        component(
          `${id}-dashboard`,
          `Indicadores de ${name}`,
          `Mede resultado e gargalos de ${name}.`,
        ),
      ],
      automations: [
        component(
          `${id}-alerts`,
          `Alertas de ${name}`,
          `Sinaliza desvios e próximos passos de ${name}.`,
        ),
      ],
      metrics: [...keywords],
      dependencies: ['diex.base.universal'],
    }),
);

const scaleTemplates = [
  defineTemplate({
    id: 'diex.scale.solo',
    name: 'Operação individual',
    kind: 'SCALE',
    description: 'Estrutura enxuta para uma pessoa operar sem burocracia.',
    activationCriteria: ['uma pessoa', 'autônomo', 'individual'],
    compatibleSegments: ['*'],
    operationalRules: [
      'Não criar papéis ou aprovações internas sem necessidade.',
    ],
  }),
  defineTemplate({
    id: 'diex.scale.small-team',
    name: 'Pequena equipe',
    kind: 'SCALE',
    description:
      'Responsabilidade clara, filas compartilhadas e indicadores simples.',
    activationCriteria: ['pequena equipe', '2 a 10 pessoas'],
    compatibleSegments: ['*'],
    roles: [
      component('manager', 'Gestor', 'Acompanha resultado e aprova mudanças.'),
      component('member', 'Membro', 'Executa a operação diária.'),
    ],
  }),
  defineTemplate({
    id: 'diex.scale.multi-team',
    name: 'Múltiplas equipes',
    kind: 'SCALE',
    description: 'Segmentação por equipe, metas, filas e permissões.',
    activationCriteria: ['múltiplas equipes', 'departamentos'],
    compatibleSegments: ['*'],
    roles: [
      component(
        'team-manager',
        'Gestor de equipe',
        'Governa sua equipe sem acessar estrutura global.',
      ),
    ],
    dependencies: ['diex.base.universal'],
  }),
  defineTemplate({
    id: 'diex.scale.multi-unit',
    name: 'Múltiplas unidades',
    kind: 'SCALE',
    description: 'Isolamento operacional e consolidação gerencial por unidade.',
    activationCriteria: ['múltiplas unidades', 'filiais', 'franquias'],
    compatibleSegments: ['*'],
    dependencies: ['diex.base.universal', 'diex.capability.multi-unit'],
  }),
];

export const WORKSPACE_TEMPLATE_REGISTRY = [
  baseUniversal,
  ...businessTemplates,
  ...capabilities,
  ...scaleTemplates,
] as const satisfies readonly WorkspaceTemplateDefinition[];

export const WORKSPACE_TEMPLATE_BY_ID = new Map(
  WORKSPACE_TEMPLATE_REGISTRY.map((template) => [template.id, template]),
);
