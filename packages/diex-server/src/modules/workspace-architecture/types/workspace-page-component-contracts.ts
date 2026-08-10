import {
  type WorkspacePageAction,
  type WorkspacePageBlockType,
  type WorkspacePageDataContract,
  type WorkspacePageRenderer,
} from 'src/modules/workspace-architecture/types/workspace-page-catalog.schema';

export const WORKSPACE_PAGE_CONTRACT_VERSION = '2.0.0';

export type WorkspacePageMetadataField = {
  id: string;
  name: string;
  label: string;
  type: string;
  isNullable: boolean;
};

export type WorkspacePageMetadataObject = {
  id: string;
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  isCustom: boolean;
  fields: WorkspacePageMetadataField[];
};

export type WorkspacePageComponentContract = {
  renderer: WorkspacePageRenderer;
  supportedBlockTypes: WorkspacePageBlockType[];
  emptyStateStrategy: 'GUIDED_ACTION' | 'FIRST_STEPS' | 'CREATE_RECORD';
};

export const WORKSPACE_PAGE_COMPONENT_REGISTRY: Record<
  WorkspacePageRenderer,
  WorkspacePageComponentContract
> = {
  INBOX: {
    renderer: 'INBOX',
    supportedBlockTypes: ['INBOX', 'LIST', 'CHECKLIST', 'AI_SUMMARY'],
    emptyStateStrategy: 'GUIDED_ACTION',
  },
  DASHBOARD: {
    renderer: 'DASHBOARD',
    supportedBlockTypes: ['KPI', 'LIST', 'PIPELINE', 'AI_SUMMARY'],
    emptyStateStrategy: 'FIRST_STEPS',
  },
  PIPELINE: {
    renderer: 'PIPELINE',
    supportedBlockTypes: ['PIPELINE', 'LIST', 'CHECKLIST', 'AI_SUMMARY'],
    emptyStateStrategy: 'CREATE_RECORD',
  },
  CALENDAR: {
    renderer: 'CALENDAR',
    supportedBlockTypes: ['CALENDAR', 'LIST', 'CHECKLIST', 'AI_SUMMARY'],
    emptyStateStrategy: 'CREATE_RECORD',
  },
  OPERATIONS: {
    renderer: 'OPERATIONS',
    supportedBlockTypes: [
      'KPI',
      'LIST',
      'PIPELINE',
      'INBOX',
      'CALENDAR',
      'TIMELINE',
      'CHECKLIST',
      'AI_SUMMARY',
    ],
    emptyStateStrategy: 'GUIDED_ACTION',
  },
  CUSTOM: {
    renderer: 'CUSTOM',
    supportedBlockTypes: [
      'KPI',
      'LIST',
      'PIPELINE',
      'INBOX',
      'CALENDAR',
      'TIMELINE',
      'CHECKLIST',
      'AI_SUMMARY',
    ],
    emptyStateStrategy: 'FIRST_STEPS',
  },
};

export const inferWorkspacePageDataContracts = ({
  pageKey,
  dataSources,
  metadataObjects = [],
}: {
  pageKey: string;
  dataSources: string[];
  metadataObjects?: WorkspacePageMetadataObject[];
}): WorkspacePageDataContract[] => {
  const normalize = (value: string): string =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const normalizedMetadata = metadataObjects.map((object) => ({
    object,
    candidates: [
      normalize(object.nameSingular),
      normalize(object.namePlural),
      normalize(object.labelSingular),
    ].filter(Boolean),
  }));
  const findObject = (source: string) => {
    const normalizedSource = normalize(source);
    const sourceTokens = normalizedSource.split(' ');
    const exactMatch = normalizedMetadata.find(({ candidates }) =>
      candidates.some(
        (candidate) =>
          candidate === normalizedSource ||
          normalizedSource.includes(candidate) ||
          candidate.includes(normalizedSource),
      ),
    );

    if (exactMatch) {
      return exactMatch.object;
    }

    const semanticMatch = normalizedMetadata.find(({ candidates }) =>
      candidates.some((candidate) => {
        const candidateTokens = candidate.split(' ');

        return (
          candidateTokens.length > 0 &&
          candidateTokens.every((candidateToken) =>
            sourceTokens.some(
              (sourceToken) =>
                sourceToken.startsWith(candidateToken.slice(0, 4)) ||
                candidateToken.startsWith(sourceToken.slice(0, 4)),
            ),
          )
        );
      }),
    );

    if (semanticMatch) {
      return semanticMatch.object;
    }

    const aliases: Record<string, string[]> = {
      contato: ['person', 'people', 'contact', 'contato', 'contatos'],
      contatos: ['person', 'people', 'contact', 'contato', 'contatos'],
      pessoa: ['person', 'people', 'contact', 'contato', 'contatos'],
      pessoas: ['person', 'people', 'contact', 'contato', 'contatos'],
      lead: ['person', 'people', 'contact', 'lead', 'leads'],
      leads: ['person', 'people', 'contact', 'lead', 'leads'],
      empresa: ['company', 'companies', 'empresa', 'empresas'],
      empresas: ['company', 'companies', 'empresa', 'empresas'],
      cliente: ['company', 'companies', 'customer', 'client', 'clientes'],
      clientes: ['company', 'companies', 'customer', 'client', 'clientes'],
      oportunidade: ['opportunity', 'opportunities', 'oportunidade', 'lead'],
      oportunidades: ['opportunity', 'opportunities', 'oportunidade', 'leads'],
      negocio: ['opportunity', 'opportunities', 'deal', 'negocio'],
      negocios: ['opportunity', 'opportunities', 'deal', 'negocios'],
      tarefa: ['task', 'tasks', 'tarefa', 'tarefas'],
      tarefas: ['task', 'tasks', 'tarefa', 'tarefas'],
      follow: ['task', 'tasks', 'follow up', 'follow-up'],
      followups: ['task', 'tasks', 'follow up', 'follow-up'],
      renovacao: ['customerRenewal', 'renewal', 'renovacao'],
      renovacoes: ['customerRenewal', 'renewal', 'renovacao'],
      oferta: ['offer', 'offers', 'oferta', 'ofertas'],
      ofertas: ['offer', 'offers', 'oferta', 'ofertas'],
      produto: ['offer', 'offers', 'product', 'products', 'produto'],
      produtos: ['offer', 'offers', 'product', 'products', 'produto'],
      servico: ['offer', 'offers', 'service', 'services', 'servico'],
      servicos: ['offer', 'offers', 'service', 'services', 'servico'],
    };
    const aliasCandidates = sourceTokens.flatMap(
      (token) => aliases[token] ?? [],
    );
    const aliasMatch = normalizedMetadata.find(({ candidates }) =>
      candidates.some((candidate) =>
        aliasCandidates.some(
          (alias) => normalize(alias) === candidate || candidate.includes(normalize(alias)),
        ),
      ),
    );

    return aliasMatch?.object ?? null;
  };
  const pickFields = (object: WorkspacePageMetadataObject): string[] => {
    const sensitiveTokens = [
      'password',
      'token',
      'secret',
      'apikey',
      'accesskey',
      'authorization',
      'credential',
      'privatekey',
      'refresh',
      'webhook',
      'qrcode',
    ];
    const safeFields = object.fields.filter((field) => {
      const normalizedField = normalize(`${field.name} ${field.label}`);

      return !sensitiveTokens.some((token) => normalizedField.includes(token));
    });
    const preferredNames = [
      'name',
      'title',
      'status',
      'stage',
      'email',
      'phone',
      'amount',
      'createdAt',
      'updatedAt',
    ];
    const byName = new Map(safeFields.map((field) => [field.name, field.name]));
    const preferred = preferredNames
      .map((fieldName) => byName.get(fieldName))
      .filter((fieldName): fieldName is string => Boolean(fieldName));
    const remaining = safeFields
      .map((field) => field.name)
      .filter((fieldName) => !preferred.includes(fieldName));

    return [...preferred, ...remaining].slice(0, 8);
  };

  return dataSources.map((source, position) => {
    const normalizedSource = normalize(source);
    const object = findObject(source);
    const isTask =
      normalizedSource.includes('tarefa') ||
      normalizedSource.includes('follow') ||
      normalizedSource.includes('agenda');
    const isInbox =
      normalizedSource.includes('conversa') ||
      normalizedSource.includes('whatsapp') ||
      normalizedSource.includes('inbox');
    const isMetric =
      normalizedSource.includes('indicador') ||
      normalizedSource.includes('valor') ||
      normalizedSource.includes('receita') ||
      normalizedSource.includes('metric');
    const kind: WorkspacePageDataContract['kind'] = isTask
      ? 'TASK'
      : isInbox
        ? 'INBOX'
        : isMetric
          ? 'METRIC'
          : 'OBJECT';

    return {
      key: `${pageKey}:data:${position}`,
      source,
      kind,
      objectName: object?.nameSingular ?? null,
      objectMetadataId: object?.id ?? null,
      fieldNames: object ? pickFields(object) : [],
      required: position === 0,
      fallback: object
        ? `Nenhum registro de ${object.labelSingular.toLowerCase()} foi encontrado. Use a ação configurada para iniciar esta operação.`
        : isMetric
          ? 'Os indicadores serão calculados assim que esta operação gerar dados.'
          : 'A operação está configurada; execute a próxima ação para gerar o primeiro registro.',
    };
  });
};

export const buildWorkspacePageActions = ({
  pageKey,
  route,
  nativeRoute,
}: {
  pageKey: string;
  route: string;
  nativeRoute: string | null;
}): WorkspacePageAction[] => [
  {
    key: `${pageKey}:primary`,
    label: 'Executar próxima ação',
    route: nativeRoute ?? route,
    confirmationRequired: false,
    requiresApproval: false,
    requiredPermission: 'workspace_access',
  },
  {
    key: `${pageKey}:onboarding`,
    label: 'Continuar ativação da operação',
    route: '/diex/pages/first-steps',
    confirmationRequired: false,
    requiresApproval: false,
    requiredPermission: 'workspace_access',
  },
];
