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

const page = (
  key: string,
  label: string,
  benefit: string,
  configuration: Record<string, unknown> = {},
  required = true,
): WorkspaceTemplateComponent =>
  component(
    key,
    label,
    benefit,
    {
      renderer: 'OPERATIONS',
      icon: 'chart',
      navigationGroup: 'Operação',
      capabilities: [],
      dataSources: ['contatos', 'empresas', 'oportunidades', 'tarefas'],
      primaryAction: `Operar ${label.toLowerCase()}`,
      ...configuration,
    },
    required,
  );

const pageBlock = (
  key: string,
  label: string,
  benefit: string,
  pageKey: string,
  type: string,
  dataSources: string[],
  configuration: Record<string, unknown> = {},
): WorkspaceTemplateComponent =>
  component(key, label, benefit, {
    pageKey,
    type,
    dataSources,
    ...configuration,
  });

// Proibições que valem em todo workspace, de qualquer nicho. Elas descrevem o
// limite do que o software decide sozinho: o conteúdo e a base legal do
// tratamento são definidos por quem opera o workspace, e o sistema não age fora
// da configuração declarada. Ficam separadas em constante porque defineTemplate
// as concatena depois do override, de modo que nenhum template consegue
// removê-las ao redefinir forbiddenRules.
const BASELINE_FORBIDDEN_RULES = [
  'Não excluir objetos, campos ou registros automaticamente.',
  'Não publicar mudança estrutural sem aprovação explícita.',
  'Não enviar comunicação externa fora dos canais, da janela de horário e dos limites definidos na política de IA do workspace.',
  'Não contatar titular que não tenha origem e consentimento registrados no próprio workspace.',
  'Não inferir, deduzir ou completar dado pessoal ausente, nem obter dado de fonte externa não configurada.',
  'Não expor dado pessoal em assunto de e-mail, prévia de notificação ou mensagem legível por terceiro.',
  'Não reutilizar dado de um workspace em outro, nem em treinamento, avaliação ou exemplo.',
];

// Instruções que acompanham a baseline acima em todo template.
const BASELINE_AI_INSTRUCTIONS = [
  'Toda comunicação externa sai em nome do responsável pelo workspace e sob a configuração definida por ele.',
  'Trate todo dado de contato e de comportamento como dado pessoal sob responsabilidade do controlador que opera o workspace.',
  'Na dúvida sobre base legal, finalidade ou consentimento, proponha a ação para aprovação humana em vez de executar.',
];

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
  readinessCriteria: [],
  dependencies: [],
  conflicts: [],
  updateStrategy: 'Gerar novo blueprint e change set versionado.',
  rollbackStrategy:
    'Restaurar a versão anterior sem apagar dados criados depois da publicação.',
  ...value,
  // Depois do spread de propósito: um template pode acrescentar proibições e
  // instruções, nunca substituir a baseline.
  forbiddenRules: [
    ...BASELINE_FORBIDDEN_RULES,
    ...(value.forbiddenRules ?? []),
  ],
  aiInstructions: [
    ...BASELINE_AI_INSTRUCTIONS,
    ...(value.aiInstructions ?? []),
  ],
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
  fields: [
    component(
      'opportunity.estimatedValue',
      'Valor estimado',
      'Permite priorizar a negociação pelo potencial de receita.',
      {
        objectKey: 'opportunity',
        name: 'estimatedValue',
        type: 'CURRENCY',
        isNullable: true,
      },
    ),
    component(
      'opportunity.nextStep',
      'Próxima ação',
      'Mantém o próximo movimento comercial visível no pipeline.',
      {
        objectKey: 'opportunity',
        name: 'nextStep',
        type: 'TEXT',
        isNullable: true,
      },
    ),
    component(
      'opportunity.lossReason',
      'Motivo da perda',
      'Alimenta a melhoria de objeções e conversão.',
      {
        objectKey: 'opportunity',
        name: 'lossReason',
        type: 'TEXT',
        isNullable: true,
      },
    ),
    component(
      'person.leadSource',
      'Origem do lead',
      'Mostra quais canais trazem receita.',
      {
        objectKey: 'person',
        name: 'leadSource',
        type: 'TEXT',
        isNullable: true,
      },
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
    page(
      'inbox-commercial',
      'Inbox Comercial',
      'Concentra o trabalho de atendimento.',
      {
        renderer: 'INBOX',
        icon: 'whatsapp',
        navigationGroup: 'Receita',
        route: '/diex/pages/inbox-commercial',
        nativeRoute: '/inbox',
        dataSources: ['conversas', 'contatos', 'empresas', 'oportunidades'],
        primaryAction: 'Responder e converter o próximo lead',
        capabilities: ['acquisition', 'sales', 'support'],
      },
    ),
    page(
      'commercial-intelligence',
      'Inteligência Comercial',
      'Prioriza decisões de receita.',
      {
        renderer: 'DASHBOARD',
        icon: 'chart',
        navigationGroup: 'Receita',
        route: '/diex/pages/commercial-intelligence',
        nativeRoute: '/diex/commercial-intelligence',
        dataSources: ['oportunidades', 'tarefas', 'conversas', 'indicadores'],
        primaryAction: 'Escolher a ação que gera mais receita hoje',
        capabilities: ['sales'],
      },
    ),
    page('calendar', 'Agenda', 'Organiza tarefas com data e hora.', {
      renderer: 'CALENDAR',
      icon: 'calendar',
      navigationGroup: 'Execução',
      route: '/diex/pages/calendar',
      nativeRoute: '/diex/calendar',
      dataSources: ['tarefas', 'oportunidades', 'visitas', 'compromissos'],
      primaryAction: 'Executar a próxima tarefa comercial',
      capabilities: ['scheduling', 'sales'],
    }),
  ],
  blocks: [
    pageBlock(
      'inbox-overview',
      'Fila de conversas',
      'Expõe leads sem resposta, responsáveis e a próxima ação.',
      'inbox-commercial',
      'INBOX',
      ['conversas', 'contatos', 'empresas', 'oportunidades'],
    ),
    pageBlock(
      'commercial-kpis',
      'Indicadores de receita',
      'Resume pipeline, resposta e execução.',
      'commercial-intelligence',
      'KPI',
      ['oportunidades', 'tarefas', 'conversas'],
    ),
    pageBlock(
      'commercial-next-actions',
      'Próximas ações',
      'Mostra o trabalho que pode gerar receita em seguida.',
      'commercial-intelligence',
      'AI_SUMMARY',
      ['tarefas', 'oportunidades'],
    ),
    pageBlock(
      'calendar-follow-ups',
      'Follow-ups e compromissos',
      'Organiza tarefas, reuniões e visitas por prazo.',
      'calendar',
      'CALENDAR',
      ['tarefas', 'oportunidades', 'compromissos'],
    ),
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
      page(
        'customer-success-center',
        'Customer Success',
        'Prioriza risco, adoção e expansão.',
        {
          renderer: 'DASHBOARD',
          icon: 'users',
          navigationGroup: 'Relacionamento',
          route: '/diex/pages/customer-success-center',
          nativeRoute: '/diex/customer-success',
          capabilities: ['customer-success', 'renewal'],
          dataSources: [
            'empresas',
            'oportunidades',
            'tarefas',
            'planos_de_sucesso',
          ],
          primaryAction: 'Reduzir risco e aumentar expansão da carteira',
        },
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
  defineTemplate({
    id: 'diex.business.healthcare-clinic',
    name: 'Clínica e consultório',
    kind: 'BUSINESS_MODEL',
    description:
      'Captação, agendamento, comparecimento, protocolo de sessões e retorno.',
    activationCriteria: [
      'clínica',
      'clinica',
      'consultório',
      'consultorio',
      'paciente',
      'consulta',
      'médica',
      'medica',
      'médico',
      'medico',
      'procedimento',
      'convênio',
      'convenio',
      'odontologia',
      'estética',
      'estetica',
      'nutrição',
      'nutricao',
      'fisioterapia',
    ],
    compatibleSegments: ['Saúde'],
    objects: [
      component(
        'patient',
        'Pacientes',
        'Centraliza contato, responsável pelo atendimento e histórico de retorno.',
      ),
      component(
        'appointment',
        'Atendimentos',
        'Registra horário, profissional, procedimento e desfecho de presença.',
      ),
      component(
        'treatmentPlan',
        'Protocolos',
        'Organiza pacote de sessões, sessões consumidas e alta.',
      ),
    ],
    pipelines: [
      component(
        'patient-journey',
        'Jornada do paciente',
        'Conecta interesse, agendamento, comparecimento, tratamento e retorno.',
      ),
    ],
    pages: [
      page(
        'clinic-agenda',
        'Agenda da clínica',
        'Mostra ocupação do dia, confirmações pendentes e faltas a recuperar.',
        {
          renderer: 'CALENDAR',
          icon: 'calendar',
          navigationGroup: 'Execução',
          capabilities: ['scheduling'],
          dataSources: ['pacientes', 'atendimentos', 'tarefas'],
          primaryAction: 'Confirmar presença e recuperar faltas',
        },
      ),
    ],
    dashboards: [
      component(
        'clinic-occupancy',
        'Ocupação e comparecimento',
        'Expõe agenda ociosa, faltas e retorno pendente.',
      ),
    ],
    metrics: [
      'taxa_de_comparecimento',
      'faltas',
      'ocupacao',
      'taxa_de_retorno',
      'sessoes_consumidas',
      'ticket_medio',
      'custo_por_paciente_agendado',
    ],
    operationalRules: [
      'Todo atendimento precisa de profissional responsável, horário e desfecho: compareceu, faltou ou remarcou.',
      'Falta registrada gera tentativa de reagendamento com responsável e prazo.',
      'Protocolo com sessão pendente mantém próxima ação agendada até a alta.',
    ],
    aiInstructions: [
      'Trate qualquer menção a sintoma, diagnóstico, procedimento, medicamento ou exame como dado pessoal sensível.',
      'Em mensagem para paciente, limite-se a confirmar presença, orientar preparo, reagendar falta e lembrar retorno.',
      'Não inicie oferta clínica nem sugira tratamento: a indicação é ato da profissional responsável.',
    ],
    // Acrescenta à baseline. A publicidade médica é regulada e o descumprimento
    // recai sobre a profissional, não sobre a ferramenta, então o sistema recusa
    // gerar o conteúdo em vez de deixar a decisão para quem estiver operando a
    // automação no dia.
    forbiddenRules: [
      'Não prometer, garantir ou sugerir resultado de tratamento em mensagem, campanha ou automação.',
      'Não usar imagem de antes e depois, depoimento de paciente ou caso clínico com finalidade publicitária.',
      'Não anunciar preço, desconto, promoção, sorteio ou condição comercial de procedimento.',
      'Não afirmar especialidade, título ou exclusividade de técnica sem registro informado pela responsável.',
      'Não registrar diagnóstico, prescrição, evolução ou resultado de exame: este CRM não é prontuário eletrônico.',
      'Não expor dado de saúde em assunto de e-mail, prévia de notificação ou mensagem que terceiro possa ler.',
    ],
    readinessCriteria: [
      'scheduling_configured',
      'responsavel_tecnica_definida',
      'consentimento_de_contato_registrado',
    ],
    glossary: {
      paciente:
        'Pessoa sob cuidado da profissional responsável pelo workspace.',
      atendimento: 'Encontro agendado, com desfecho de presença registrado.',
      protocolo: 'Pacote de sessões contratado, com consumo e alta.',
      falta:
        'Atendimento agendado sem comparecimento, elegível a reagendamento.',
      retorno:
        'Novo atendimento da mesma paciente após alta ou intervalo previsto.',
    },
    dependencies: [
      'diex.base.universal',
      'diex.capability.scheduling',
      'diex.capability.acquisition',
      'diex.capability.support',
    ],
  }),
];

type CapabilityDefinition = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  metrics: string[];
  icon: string;
  navigationGroup: string;
  renderer: string;
  blockType: string;
  dataSources: string[];
  route?: string;
  nativeRoute?: string;
};

// A niche is a combination of these operational capabilities. Adding a new
// segment should normally mean adding keywords or a capability pack, not a new
// page, route, controller or hardcoded navigation branch.
const capabilityDefinitions: CapabilityDefinition[] = [
  {
    id: 'acquisition',
    name: 'Aquisição',
    description:
      'Organiza canais, campanhas, origem e velocidade de entrada de leads.',
    keywords: [
      'aquisição',
      'marketing',
      'inbound',
      'outbound',
      'lead',
      'captação',
      'campanha',
    ],
    metrics: ['leads_gerados', 'origem_dos_leads', 'taxa_de_resposta'],
    icon: 'megaphone',
    navigationGroup: 'Receita',
    renderer: 'DASHBOARD',
    blockType: 'KPI',
    dataSources: ['contatos', 'conversas', 'campanhas', 'origens'],
  },
  {
    id: 'prospecting',
    name: 'Prospecção',
    description: 'Cria listas, cadências e sinais de abordagem.',
    keywords: [
      'prospecção',
      'lista de prospecção',
      'cadência',
      'abordagem',
      'sd r',
      'sdr',
    ],
    metrics: ['contatos_prospectados', 'taxa_de_resposta', 'reunioes_geradas'],
    icon: 'target',
    navigationGroup: 'Receita',
    renderer: 'PIPELINE',
    blockType: 'PIPELINE',
    dataSources: ['contatos', 'tarefas', 'conversas', 'oportunidades'],
  },
  {
    id: 'pre-sales',
    name: 'Pré-vendas',
    description: 'Qualifica demanda antes da oportunidade.',
    keywords: [
      'qualificação',
      'qualificar',
      'mql',
      'sql',
      'pré-vendas',
      'pre vendas',
    ],
    metrics: ['leads_qualificados', 'taxa_mql_sql', 'tempo_de_qualificacao'],
    icon: 'filter',
    navigationGroup: 'Receita',
    renderer: 'PIPELINE',
    blockType: 'CHECKLIST',
    dataSources: ['contatos', 'conversas', 'tarefas'],
  },
  {
    id: 'sales',
    name: 'Comercial',
    description: 'Governa oportunidade, próximo passo e forecast.',
    keywords: [
      'vendas',
      'venda',
      'comercial',
      'oportunidade',
      'proposta',
      'forecast',
      'fechamento',
    ],
    metrics: ['receita_em_pipeline', 'win_rate', 'sales_cycle', 'forecast'],
    icon: 'chart',
    navigationGroup: 'Receita',
    renderer: 'PIPELINE',
    blockType: 'PIPELINE',
    dataSources: ['oportunidades', 'contatos', 'empresas', 'tarefas'],
  },
  {
    id: 'quoting',
    name: 'Orçamentos e propostas',
    description: 'Controla cotação, proposta, aprovação e conversão.',
    keywords: [
      'orçamento',
      'orcamento',
      'cotação',
      'cotacao',
      'proposta comercial',
      'licitação',
      'licitacao',
    ],
    metrics: ['propostas_abertas', 'taxa_de_conversao', 'tempo_de_aprovacao'],
    icon: 'document',
    navigationGroup: 'Receita',
    renderer: 'PIPELINE',
    blockType: 'LIST',
    dataSources: ['oportunidades', 'ofertas', 'tarefas', 'aprovacoes'],
  },
  {
    id: 'scheduling',
    name: 'Agenda e reservas',
    description:
      'Organiza horários, visitas, reservas e capacidade disponível.',
    keywords: [
      'agenda',
      'agendamento',
      'agendar',
      'visita',
      'consulta',
      'reserva',
      'booking',
      'appointment',
    ],
    metrics: ['compromissos_agendados', 'taxa_de_comparecimento', 'ocupacao'],
    icon: 'calendar',
    navigationGroup: 'Execução',
    renderer: 'CALENDAR',
    blockType: 'CALENDAR',
    dataSources: ['tarefas', 'compromissos', 'visitas', 'oportunidades'],
  },
  {
    id: 'field-service',
    name: 'Serviço em campo',
    description: 'Distribui instalações, visitas técnicas, manutenção e rotas.',
    keywords: [
      'serviço em campo',
      'servico em campo',
      'assistência técnica',
      'assistencia tecnica',
      'instalação',
      'instalacao',
      'técnico',
      'tecnico',
      'manutenção externa',
      'manutencao externa',
    ],
    metrics: ['ordens_em_campo', 'tempo_de_atendimento', 'sla_em_campo'],
    icon: 'map',
    navigationGroup: 'Execução',
    renderer: 'OPERATIONS',
    blockType: 'TIMELINE',
    dataSources: ['ordens_de_servico', 'tarefas', 'compromissos', 'contatos'],
  },
  {
    id: 'implementation',
    name: 'Implantação',
    description: 'Organiza onboarding de clientes, marcos e go-live.',
    keywords: [
      'implantação',
      'implantacao',
      'go-live',
      'go live',
      'onboarding de cliente',
      'ativação de cliente',
      'ativacao de cliente',
    ],
    metrics: ['clientes_em_implantacao', 'time_to_value', 'tempo_de_go_live'],
    icon: 'rocket',
    navigationGroup: 'Execução',
    renderer: 'OPERATIONS',
    blockType: 'CHECKLIST',
    dataSources: ['empresas', 'oportunidades', 'tarefas', 'marcos'],
  },
  {
    id: 'delivery',
    name: 'Entrega e projetos',
    description:
      'Controla escopo, marcos, prazos, capacidade e evidência de valor.',
    keywords: [
      'projeto',
      'projetos',
      'entrega',
      'marco',
      'escopo',
      'obra',
      'construção',
      'construcao',
    ],
    metrics: ['projetos_ativos', 'entregas_no_prazo', 'margem_do_projeto'],
    icon: 'briefcase',
    navigationGroup: 'Execução',
    renderer: 'OPERATIONS',
    blockType: 'TIMELINE',
    dataSources: ['projetos', 'tarefas', 'empresas', 'oportunidades'],
  },
  {
    id: 'production',
    name: 'Produção e fabricação',
    description: 'Acompanha ordens, capacidade, etapas e prazo de produção.',
    keywords: [
      'produção',
      'producao',
      'fabricação',
      'fabricacao',
      'fábrica',
      'fabrica',
      'manufatura',
      'sob medida',
      'linha de produção',
      'linha de producao',
    ],
    metrics: [
      'ordens_de_producao',
      'producao_no_prazo',
      'capacidade_utilizada',
    ],
    icon: 'factory',
    navigationGroup: 'Operação',
    renderer: 'OPERATIONS',
    blockType: 'PIPELINE',
    dataSources: ['ordens_de_producao', 'produtos', 'tarefas', 'empresas'],
  },
  {
    id: 'inventory',
    name: 'Estoque e catálogo',
    description: 'Controla produtos, insumos, disponibilidade e giro.',
    keywords: [
      'estoque',
      'inventário',
      'inventario',
      'insumo',
      'materiais',
      'produto físico',
      'produto fisico',
      'catálogo',
      'catalogo',
    ],
    metrics: ['itens_em_estoque', 'giro_de_estoque', 'rupturas'],
    icon: 'box',
    navigationGroup: 'Operação',
    renderer: 'OPERATIONS',
    blockType: 'LIST',
    dataSources: ['produtos', 'estoque', 'pedidos', 'fornecedores'],
  },
  {
    id: 'procurement',
    name: 'Compras e fornecedores',
    description:
      'Organiza fornecedores, cotações, pedidos e prazos de entrada.',
    keywords: [
      'compras',
      'fornecedor',
      'fornecedores',
      'suprimentos',
      'cotação de fornecedor',
      'cotacao de fornecedor',
    ],
    metrics: [
      'pedidos_de_compra',
      'compras_em_aberto',
      'prazo_medio_de_fornecedor',
    ],
    icon: 'truck',
    navigationGroup: 'Operação',
    renderer: 'OPERATIONS',
    blockType: 'LIST',
    dataSources: ['fornecedores', 'pedidos_de_compra', 'produtos', 'tarefas'],
  },
  {
    id: 'fulfillment',
    name: 'Pedidos e logística',
    description: 'Acompanha pedido, separação, entrega e exceções.',
    keywords: [
      'logística',
      'logistica',
      'entrega ao cliente',
      'expedição',
      'expedicao',
      'pedido',
      'pedidos',
      'fulfillment',
      'distribuição',
      'distribuicao',
    ],
    metrics: ['pedidos_abertos', 'entregas_no_prazo', 'tempo_de_entrega'],
    icon: 'truck',
    navigationGroup: 'Operação',
    renderer: 'OPERATIONS',
    blockType: 'TIMELINE',
    dataSources: ['pedidos', 'entregas', 'tarefas', 'contatos'],
  },
  {
    id: 'support',
    name: 'Atendimento e suporte',
    description: 'Organiza solicitações, prioridade, SLA e resolução.',
    keywords: ['atendimento', 'suporte', 'sac', 'chamado', 'ticket', 'sla'],
    metrics: ['tickets_abertos', 'sla_cumprido', 'tempo_de_resolucao'],
    icon: 'headset',
    navigationGroup: 'Atendimento',
    renderer: 'INBOX',
    blockType: 'INBOX',
    dataSources: ['conversas', 'contatos', 'empresas', 'tarefas'],
  },
  {
    id: 'customer-success',
    name: 'Customer Success',
    description: 'Acompanha adoção, saúde, valor e risco.',
    keywords: [
      'customer success',
      'sucesso do cliente',
      'adoção',
      'adocao',
      'saúde da carteira',
      'saude da carteira',
    ],
    metrics: [
      'health_score',
      'time_to_value',
      'adocao',
      'churn_risk',
      'expansion',
    ],
    icon: 'users',
    navigationGroup: 'Relacionamento',
    renderer: 'DASHBOARD',
    blockType: 'KPI',
    dataSources: ['empresas', 'oportunidades', 'tarefas', 'planos_de_sucesso'],
    route: '/diex/pages/customer-success-operations',
    nativeRoute: '/diex/customer-success',
  },
  {
    id: 'renewal',
    name: 'Renovação e expansão',
    description: 'Antecipação de risco e negociação de renovação.',
    keywords: [
      'renovação',
      'renovacao',
      'vigência',
      'vigencia',
      'churn',
      'expansão',
      'expansao',
    ],
    metrics: ['renovacoes', 'churn_risk', 'expansion', 'receita_renovavel'],
    icon: 'refresh',
    navigationGroup: 'Relacionamento',
    renderer: 'PIPELINE',
    blockType: 'PIPELINE',
    dataSources: ['empresas', 'oportunidades', 'contratos', 'tarefas'],
    route: '/diex/pages/renewal-operations',
    nativeRoute: '/diex/renewals',
  },
  {
    id: 'billing',
    name: 'Cobrança e financeiro',
    description: 'Acompanha vencimento, inadimplência, recebimento e margem.',
    keywords: [
      'cobrança',
      'cobranca',
      'inadimplência',
      'inadimplencia',
      'vencimento',
      'financeiro',
      'recebimento',
      'contas a receber',
    ],
    metrics: ['recebimentos_em_aberto', 'inadimplencia', 'receita_realizada'],
    icon: 'currency',
    navigationGroup: 'Financeiro',
    renderer: 'DASHBOARD',
    blockType: 'KPI',
    dataSources: ['empresas', 'oportunidades', 'faturas', 'tarefas'],
  },
  {
    id: 'contracts',
    name: 'Contratos e obrigações',
    description:
      'Controla vigência, documentos, aprovações e riscos contratuais.',
    keywords: [
      'contrato',
      'contratos',
      'jurídico',
      'juridico',
      'vigência contratual',
      'vigencia contratual',
      'documentos',
    ],
    metrics: [
      'contratos_ativos',
      'contratos_a_vencer',
      'pendencias_contratuais',
    ],
    icon: 'document',
    navigationGroup: 'Governança',
    renderer: 'OPERATIONS',
    blockType: 'CHECKLIST',
    dataSources: ['contratos', 'empresas', 'tarefas', 'documentos'],
  },
  {
    id: 'subscriptions',
    name: 'Assinaturas e recorrência',
    description: 'Liga planos, receita recorrente, uso e renovação.',
    keywords: [
      'assinatura',
      'assinaturas',
      'recorrência',
      'recorrencia',
      'mensalidade',
      'mrr',
      'arr',
    ],
    metrics: ['mrr', 'arr', 'nrr', 'churn'],
    icon: 'repeat',
    navigationGroup: 'Receita',
    renderer: 'DASHBOARD',
    blockType: 'KPI',
    dataSources: ['empresas', 'assinaturas', 'oportunidades', 'tarefas'],
  },
  {
    id: 'education',
    name: 'Turmas e aprendizagem',
    description: 'Organiza alunos, turmas, matrículas, presença e evolução.',
    keywords: [
      'escola',
      'educação',
      'educacao',
      'curso',
      'cursos',
      'aluno',
      'turma',
      'treinamento',
      'capacitação',
      'capacitacao',
    ],
    metrics: ['alunos_ativos', 'matriculas', 'conclusao'],
    icon: 'book',
    navigationGroup: 'Operação',
    renderer: 'OPERATIONS',
    blockType: 'LIST',
    dataSources: ['contatos', 'turmas', 'tarefas', 'oportunidades'],
  },
  {
    id: 'events',
    name: 'Eventos e experiências',
    description: 'Acompanha inscrições, agenda, presença, parceiros e retorno.',
    keywords: [
      'evento',
      'eventos',
      'inscrição',
      'inscricao',
      'congresso',
      'feira',
      'experiência',
      'experiencia',
    ],
    metrics: ['inscritos', 'comparecimento', 'receita_por_evento'],
    icon: 'calendar',
    navigationGroup: 'Operação',
    renderer: 'CALENDAR',
    blockType: 'CALENDAR',
    dataSources: ['contatos', 'compromissos', 'tarefas', 'oportunidades'],
  },
  {
    id: 'recruitment',
    name: 'Recrutamento e seleção',
    description: 'Organiza candidatos, vagas, entrevistas e contratação.',
    keywords: [
      'recrutamento',
      'seleção',
      'selecao',
      'candidato',
      'candidatos',
      'vaga',
      'talentos',
      'rh',
    ],
    metrics: [
      'vagas_abertas',
      'candidatos_em_processo',
      'tempo_de_contratacao',
    ],
    icon: 'users',
    navigationGroup: 'Operação',
    renderer: 'PIPELINE',
    blockType: 'PIPELINE',
    dataSources: ['contatos', 'vagas', 'tarefas', 'compromissos'],
  },
  {
    id: 'partner-channel',
    name: 'Canais e parceiros',
    description:
      'Governa parceiros, indicações, distribuição e receita compartilhada.',
    keywords: [
      'parceiro',
      'parceiros',
      'revenda',
      'representante',
      'indicação',
      'indicacao',
      'canal de vendas',
    ],
    metrics: ['receita_por_canal', 'leads_por_parceiro', 'comissao_em_aberto'],
    icon: 'share',
    navigationGroup: 'Receita',
    renderer: 'DASHBOARD',
    blockType: 'LIST',
    dataSources: ['empresas', 'contatos', 'oportunidades', 'tarefas'],
  },
  {
    id: 'quality-compliance',
    name: 'Qualidade e conformidade',
    description:
      'Registra controles, evidências, incidentes e planos corretivos.',
    keywords: [
      'qualidade',
      'conformidade',
      'compliance',
      'auditoria',
      'incidente',
      'iso',
      'lgpd',
    ],
    metrics: [
      'pendencias_de_conformidade',
      'incidentes_abertos',
      'auditorias_no_prazo',
    ],
    icon: 'shield',
    navigationGroup: 'Governança',
    renderer: 'OPERATIONS',
    blockType: 'CHECKLIST',
    dataSources: ['tarefas', 'documentos', 'empresas', 'incidentes'],
  },
  {
    id: 'case-management',
    name: 'Casos e processos',
    description: 'Acompanha casos, etapas, responsáveis, prazos e documentos.',
    keywords: [
      'casos',
      'processo',
      'processos',
      'contencioso',
      'atendimento especializado',
      'dossiê',
      'dossie',
    ],
    metrics: ['casos_abertos', 'casos_em_risco', 'prazos_vencendo'],
    icon: 'briefcase',
    navigationGroup: 'Operação',
    renderer: 'PIPELINE',
    blockType: 'TIMELINE',
    dataSources: ['casos', 'contatos', 'empresas', 'tarefas'],
  },
  {
    id: 'ai-governance',
    name: 'Governança de IA',
    description: 'Mantém ações de IA aprováveis, explicáveis e auditáveis.',
    keywords: [
      'ia',
      'inteligência artificial',
      'inteligencia artificial',
      'aprovação',
      'aprovacao',
      'auditoria',
    ],
    metrics: ['acoes_de_ia_pendentes', 'acoes_aprovadas', 'acoes_bloqueadas'],
    icon: 'sparkles',
    navigationGroup: 'Governança',
    renderer: 'DASHBOARD',
    blockType: 'AI_SUMMARY',
    dataSources: ['acoes_de_ia', 'tarefas', 'conversas', 'oportunidades'],
    route: '/diex/pages/ai-governance-operations',
    nativeRoute: '/diex/ai-command-center',
  },
  {
    id: 'multi-unit',
    name: 'Operação multiunidade',
    description: 'Separa metas, carteira, acesso e performance por unidade.',
    keywords: [
      'unidades',
      'filiais',
      'franquias',
      'lojas',
      'regional',
      'multiunidade',
      'multi unidade',
    ],
    metrics: [
      'unidades_ativas',
      'receita_por_unidade',
      'performance_por_unidade',
    ],
    icon: 'building',
    navigationGroup: 'Governança',
    renderer: 'DASHBOARD',
    blockType: 'KPI',
    dataSources: ['unidades', 'empresas', 'oportunidades', 'tarefas'],
  },
];

const capabilities = capabilityDefinitions.map((capability) => {
  const pageKey = `${capability.id}-operations`;

  return defineTemplate({
    id: `diex.capability.${capability.id}`,
    name: capability.name,
    description: capability.description,
    kind: 'CAPABILITY',
    activationCriteria: capability.keywords,
    compatibleSegments: ['*'],
    pages: [
      page(pageKey, capability.name, capability.description, {
        renderer: capability.renderer,
        icon: capability.icon,
        navigationGroup: capability.navigationGroup,
        capabilities: [capability.id],
        dataSources: capability.dataSources,
        primaryAction: `Executar a próxima ação de ${capability.name.toLowerCase()}`,
        ...(capability.route ? { route: capability.route } : {}),
        ...(capability.nativeRoute
          ? { nativeRoute: capability.nativeRoute }
          : {}),
      }),
    ],
    pipelines: [
      component(
        `${capability.id}-pipeline`,
        `Fluxo de ${capability.name}`,
        `Organiza etapas, responsáveis e próximos passos de ${capability.name.toLowerCase()}.`,
      ),
    ],
    views: [
      component(
        `${capability.id}-queue`,
        `Fila de ${capability.name}`,
        `Mostra o trabalho de ${capability.name.toLowerCase()} que exige ação.`,
      ),
    ],
    blocks: [
      pageBlock(
        `${capability.id}-overview`,
        `Visão de ${capability.name}`,
        capability.description,
        pageKey,
        capability.blockType,
        capability.dataSources,
      ),
      pageBlock(
        `${capability.id}-next-actions`,
        'Próximas ações',
        `Transforma sinais de ${capability.name.toLowerCase()} em execução.`,
        pageKey,
        'CHECKLIST',
        [...capability.dataSources, 'tarefas'],
      ),
      pageBlock(
        `${capability.id}-ai-summary`,
        'Leitura da IA',
        'Resume risco, prioridade e oportunidade de receita.',
        pageKey,
        'AI_SUMMARY',
        [...capability.dataSources, 'indicadores'],
      ),
    ],
    dashboards: [
      component(
        `${capability.id}-dashboard`,
        `Indicadores de ${capability.name}`,
        `Mede resultado e gargalos de ${capability.name}.`,
      ),
    ],
    automations: [
      component(
        `${capability.id}-alerts`,
        `Alertas de ${capability.name}`,
        `Sinaliza desvios e próximos passos de ${capability.name}.`,
      ),
    ],
    metrics: capability.metrics,
    operationalRules: [
      `Toda entrada de ${capability.name.toLowerCase()} deve ter responsável e próxima ação.`,
    ],
    aiInstructions: [
      `Use os sinais de ${capability.name.toLowerCase()} para priorizar receita, risco e tempo de resposta.`,
    ],
    readinessCriteria: [`${capability.id}_configured`],
    dependencies: ['diex.base.universal'],
  });
});

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
