import { type WorkspaceProductUpdateDefinition } from 'src/modules/workspace-architecture/types/workspace-product-update.type';

export const WORKSPACE_PRODUCT_UPDATE_REGISTRY_VERSION = '2026-08-18';

// O portão de ativação em duas confirmações (contexto revisado e estrutura
// publicada) não tem entrada aqui de propósito: ele só remove exigências. Para
// workspace existente a adoção é automática, porque a trava de configuração
// passa a se resolver contra a evidência que o workspace já tem, e nenhum dado
// novo é pedido. As exigências que ele deixou de bloquear continuam contando
// para a prontidão e visíveis em Primeiros passos.

export const WORKSPACE_PRODUCT_UPDATE_REGISTRY: WorkspaceProductUpdateDefinition[] =
  [
    {
      key: 'commercial-ai-context-2026-08',
      version: '1.0.0',
      title: 'Complete o novo contexto comercial da IA',
      summary:
        'O Diex agora separa regras, objeções, provas e limites para orientar respostas, triagens e automações com mais precisão.',
      revenueImpact:
        'Reduz respostas genéricas, promessas indevidas e perda de conversão por falta de contexto comercial.',
      releasedAt: '2026-08-13T00:00:00.000Z',
      importance: 'REQUIRED',
      blocksReadiness: true,
      readinessWeight: 2,
      actionLabel: 'Revisar contexto comercial',
      actionRoute: '/diex/first-steps?update=commercial-ai-context-2026-08',
      completion: {
        kind: 'CONTEXT_FIELDS',
        requiresAdminConfirmation: true,
        fields: [
          { key: 'commercialRules', label: 'Regras comerciais' },
          { key: 'objectionPlaybook', label: 'Objeções e respostas' },
          { key: 'competitiveLandscape', label: 'Provas e diferenciais' },
          { key: 'forbiddenClaims', label: 'Promessas proibidas' },
        ],
      },
    },
    {
      key: 'commercial-data-scoping-2026-08',
      version: '1.0.0',
      title: 'Revise quem enxerga o painel comercial',
      summary:
        'O painel de prontidão passou a ocultar pipeline, agregados comerciais e ids de registro para quem não administra o workspace, e a entrada no CS agora exige permissão de workspace.',
      revenueImpact:
        'Impede que colaborador de cargo restrito ou cliente convidado veja o pipeline e a carteira inteira da operação.',
      releasedAt: '2026-08-14T00:00:00.000Z',
      importance: 'RECOMMENDED',
      blocksReadiness: false,
      readinessWeight: 1,
      actionLabel: 'Revisar cargos e permissões',
      actionRoute: '/settings/roles',
      completion: { kind: 'ACKNOWLEDGEMENT' },
    },
    {
      key: 'onboarding-primary-channel-2026-08',
      version: '1.0.0',
      title: 'Defina a forma principal de entrada',
      summary:
        'O Diex passou a exigir um canal primário explícito. Workspaces antigos com o campo vazio precisam escolher WhatsApp, e-mail, importação ou cadastro manual.',
      revenueImpact:
        'Sem canal definido a operação não valida a primeira entrada e a prontidão comercial fica incompleta.',
      releasedAt: '2026-08-17T00:00:00.000Z',
      importance: 'REQUIRED',
      blocksReadiness: true,
      readinessWeight: 2,
      actionLabel: 'Escolher canal principal',
      actionRoute:
        '/diex/first-steps?update=onboarding-primary-channel-2026-08',
      completion: { kind: 'PRIMARY_CHANNEL' },
    },
    {
      key: 'crm-multi-operation-foundation-2026-08',
      version: '1.0.0',
      title: 'Configure a operação compartilhada do CRM',
      summary:
        'O Diex agora modela agências, agendas individuais, canais comerciais, contas e resultados de Meta Ads e Google Ads e acessos restritos de clientes.',
      revenueImpact:
        'A configuração separa operações, consolida aquisição paga e permite colaboração do cliente sem expor toda a carteira.',
      releasedAt: '2026-08-18T00:00:00.000Z',
      importance: 'REQUIRED',
      blocksReadiness: true,
      readinessWeight: 3,
      actionLabel: 'Configurar operação compartilhada',
      actionRoute:
        '/diex/first-steps?update=crm-multi-operation-foundation-2026-08',
      completion: { kind: 'MULTI_OPERATION_CONFIGURATION' },
    },
  ];

export const getWorkspaceProductUpdateDefinition = (
  key: string,
): WorkspaceProductUpdateDefinition | undefined =>
  WORKSPACE_PRODUCT_UPDATE_REGISTRY.find((update) => update.key === key);
