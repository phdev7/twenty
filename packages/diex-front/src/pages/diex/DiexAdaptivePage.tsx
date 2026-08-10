import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'diex-ui';

import {
  CommandCenterCard,
  CommandCenterGrid,
  CommandCenterList,
  CommandCenterMetric,
  CommandCenterMetrics,
  CommandCenterPage,
  CommandCenterRow,
  CommandCenterStartState,
} from '@/diex-command-centers/components/CommandCenterLayout';
import {
  type DiexCommercialReadiness,
  type DiexPageBlock,
  type DiexPageCatalogItem,
  type DiexPageCatalogState,
  type DiexPageDataSource,
  type DiexPageDataState,
} from '@/diex-onboarding/types/diexOnboardingTypes';
import { getDiexOnboardingRoute } from '@/diex-onboarding/utils/diexOnboardingApi';

const formatCurrency = (micros: number, currencyCode: string): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode || 'BRL',
    maximumFractionDigits: 0,
  }).format(micros / 1_000_000);

const getDashboard = (readiness: DiexCommercialReadiness | null) =>
  readiness?.dashboard ?? {
    pipelineValueMicros: 0,
    pipelineCurrencyCode: 'BRL',
    unassignedOpportunities: 0,
    overdueFollowUps: 0,
    unansweredLeads: 0,
    averageResponseMinutes: null,
    nextActions: 0,
    commercialRisks: 0,
  };

const getCounts = (readiness: DiexCommercialReadiness | null) =>
  readiness?.counts ?? {
    activeOffers: 0,
    activeOwners: 0,
    conversations: 0,
    opportunities: 0,
    followUps: 0,
  };

const UNIVERSAL_Diex_OBJECTS = new Set([
  'person',
  'company',
  'opportunity',
  'task',
  'customerRenewal',
  'offer',
]);

const getRuntimeSource = (
  pageData: DiexPageDataState | null,
  source: string,
): DiexPageDataSource | null =>
  pageData?.sources.find(
    ({ source: contractSource }) => contractSource === source,
  ) ?? null;

const formatRecordValue = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .filter(
        (entry): entry is string | number =>
          typeof entry === 'string' || typeof entry === 'number',
      )
      .slice(0, 2)
      .join(' · ');
  }

  return '';
};

const getRecordTitle = (record: Record<string, unknown>): string => {
  const preferredKeys = ['name', 'title', 'label', 'email', 'phone'];
  const preferredValue = preferredKeys
    .map((key) => formatRecordValue(record[key]))
    .find((value) => value.length > 0);

  if (preferredValue) {
    return preferredValue;
  }

  return (
    Object.values(record)
      .map(formatRecordValue)
      .find((value) => value.length > 0) ?? 'Registro operacional'
  );
};

const getRuntimeSourceDetail = (
  source: DiexPageDataSource,
  fallback?: string,
): string => {
  if (source.count === 0) {
    return (
      source.error ??
      source.fallback ??
      fallback ??
      'Nenhum registro encontrado; execute a próxima ação para iniciar.'
    );
  }

  if (source.count !== null) {
    return `${source.count} registro${source.count === 1 ? '' : 's'} disponível${source.count === 1 ? '' : 'eis'} na operação.`;
  }

  return fallback ?? source.fallback;
};

const getPageIsCamaleonic = (page: DiexPageCatalogItem): boolean =>
  page.lifecycle === 'CUSTOM' ||
  page.renderer === 'CUSTOM' ||
  (page.dataContracts ?? []).some(
    ({ objectName }) =>
      objectName !== null && !UNIVERSAL_Diex_OBJECTS.has(objectName),
  );

const JOURNEY_PHASE_LABELS: Record<string, string> = {
  DISCOVERY_REVIEW: 'Revisão do entendimento',
  ARCHITECTURE_APPROVAL: 'Aprovação da arquitetura',
  CHANNEL_CONNECTION: 'Conexão do canal',
  FIRST_REVENUE_FLOW: 'Primeiro fluxo de resultado',
  TEAM_ENABLEMENT: 'Configuração da equipe',
  COCKPIT_OPERATIONAL: 'Cockpit operacional',
  SELLING_READY: 'Pronto para vender',
};

const getSafeInternalRoute = (route: string | null | undefined): string | null =>
  typeof route === 'string' && route.startsWith('/') && !route.startsWith('//')
    ? route
    : null;

const getDataSourceValue = (
  source: string,
  readiness: DiexCommercialReadiness | null,
  pageData: DiexPageDataState | null,
  fallback?: string,
): string => {
  const runtimeSource = getRuntimeSource(pageData, source);

  if (runtimeSource?.objectName !== null && runtimeSource?.objectName !== undefined) {
    return getRuntimeSourceDetail(runtimeSource, fallback);
  }

  const dashboard = getDashboard(readiness);
  const counts = getCounts(readiness);
  const normalizedSource = source.toLowerCase();

  if (normalizedSource.includes('convers')) {
    return `${counts.conversations} conversas acompanhadas`;
  }

  if (normalizedSource.includes('oportun')) {
    return `${counts.opportunities} oportunidades no fluxo`;
  }

  if (normalizedSource.includes('tarefa') || normalizedSource.includes('follow')) {
    return `${counts.followUps} próximos passos, ${dashboard.overdueFollowUps} vencidos`;
  }

  if (normalizedSource.includes('empresa') || normalizedSource.includes('contato')) {
    return 'Relacionamentos identificados e prontos para vinculação';
  }

  if (normalizedSource.includes('indicador') || normalizedSource.includes('receita')) {
    return formatCurrency(
      dashboard.pipelineValueMicros,
      dashboard.pipelineCurrencyCode,
    );
  }

  return fallback ?? 'Aguardando a primeira execução desta operação.';
};

const AdaptivePageBlock = ({
  block,
  readiness,
  pageData,
  camaleonic,
}: {
  block: DiexPageBlock;
  readiness: DiexCommercialReadiness | null;
  pageData: DiexPageDataState | null;
  camaleonic: boolean;
}) => {
  const dashboard = getDashboard(readiness);
  const counts = getCounts(readiness);
  const navigate = useNavigate();
  const nextAction =
    readiness?.nextAction ??
    'Conecte o canal principal e transforme a primeira conversa em oportunidade.';
  const configuredAction = block.actions?.find(({ route }) =>
    getSafeInternalRoute(route),
  );
  const actionRoute = getSafeInternalRoute(
    configuredAction?.route ?? block.actionRoute,
  );
  const renderCard = (content: ReactNode) => (
    <CommandCenterCard
      title={block.title}
      action={
        actionRoute ? (
          <Button
            title={configuredAction?.label ?? block.actionLabel}
            variant="secondary"
            onClick={() => navigate(actionRoute)}
          />
        ) : null
      }
    >
      {content}
    </CommandCenterCard>
  );

  const renderCamaleonicBlock = () => {
    const contracts = block.dataContracts?.length
      ? block.dataContracts
      : block.dataSources.map((source, position) => ({
          key: `${block.key}:${position}`,
          source,
          fallback: 'Execute a próxima ação para gerar o primeiro registro.',
        }));
    const rows = contracts.slice(0, 6).flatMap((contract) => {
      const runtimeSource = getRuntimeSource(pageData, contract.source);

      if (!runtimeSource || runtimeSource.records.length === 0) {
        return [
          <CommandCenterRow
            key={contract.key}
            title={contract.source}
            detail={
              runtimeSource
                ? getRuntimeSourceDetail(runtimeSource, contract.fallback)
                : contract.fallback
            }
          />,
        ];
      }

      return runtimeSource.records.slice(0, 4).map((record, index) => (
        <CommandCenterRow
          key={`${contract.key}:${index}`}
          title={getRecordTitle(record)}
          detail={`${contract.source} · ${getRuntimeSourceDetail(runtimeSource)}`}
        />
      ));
    });

    return renderCard(
      <>
        {block.type === 'KPI' ? (
          <CommandCenterMetrics>
            {contracts.slice(0, 4).map((contract) => {
              const runtimeSource = getRuntimeSource(pageData, contract.source);

              return (
                <CommandCenterMetric
                  key={contract.key}
                  label={contract.source}
                  value={
                    runtimeSource?.count ??
                    runtimeSource?.fallback ??
                    'Aguardando dados'
                  }
                />
              );
            })}
          </CommandCenterMetrics>
        ) : (
          <CommandCenterList>
            {rows.length > 0 ? rows : (
              <CommandCenterRow
                title="Operação pronta para começar"
                detail={block.description}
              />
            )}
          </CommandCenterList>
        )}
      </>,
    );
  };

  if (camaleonic) {
    return renderCamaleonicBlock();
  }

  switch (block.type) {
    case 'KPI':
      return renderCard(
        <>
          <CommandCenterMetrics>
            <CommandCenterMetric
              label="Valor no pipeline"
              value={formatCurrency(
                dashboard.pipelineValueMicros,
                dashboard.pipelineCurrencyCode,
              )}
            />
            <CommandCenterMetric
              label="Oportunidades"
              value={counts.opportunities}
            />
            <CommandCenterMetric
              label="Próximas ações"
              value={dashboard.nextActions}
            />
            <CommandCenterMetric
              label="Riscos comerciais"
              value={dashboard.commercialRisks}
            />
          </CommandCenterMetrics>
        </>,
      );
    case 'INBOX':
      return renderCard(
        <>
          <CommandCenterList>
            <CommandCenterRow
              title="Conversas recebidas"
              detail={`${counts.conversations} conversas identificadas no workspace.`}
            />
            <CommandCenterRow
              title="Leads sem resposta"
              detail={`${dashboard.unansweredLeads} conversas exigem resposta.`}
            />
            <CommandCenterRow
              title="Próxima ação"
              detail="Responder, classificar intenção e criar o follow-up do lead."
            />
          </CommandCenterList>
        </>,
      );
    case 'PIPELINE':
      return renderCard(
        <>
          <CommandCenterList>
            <CommandCenterRow
              title="Receita em negociação"
              detail={formatCurrency(
                dashboard.pipelineValueMicros,
                dashboard.pipelineCurrencyCode,
              )}
            />
            <CommandCenterRow
              title="Oportunidades sem responsável"
              detail={`${dashboard.unassignedOpportunities} precisam de distribuição.`}
            />
            <CommandCenterRow
              title="Decisão recomendada"
              detail={nextAction}
            />
          </CommandCenterList>
        </>,
      );
    case 'CALENDAR':
    case 'TIMELINE':
      return renderCard(
        <>
          <CommandCenterList>
            <CommandCenterRow
              title="Próximas ações"
              detail={`${dashboard.nextActions} tarefas e compromissos para executar.`}
            />
            <CommandCenterRow
              title="Atrasos que podem custar receita"
              detail={`${dashboard.overdueFollowUps} follow-ups vencidos.`}
            />
            <CommandCenterRow
              title="Prioridade da agenda"
              detail={nextAction}
            />
          </CommandCenterList>
        </>,
      );
    case 'CHECKLIST':
      return renderCard(
        <>
          <CommandCenterList>
            {(readiness?.items ?? []).slice(0, 5).map((item) => (
              <CommandCenterRow
                key={item.key}
                title={item.label}
                detail={item.ready ? 'Concluído' : 'Próximo bloqueio operacional'}
              />
            ))}
            {readiness?.items.length ? null : (
              <CommandCenterRow
                title="Contexto operacional"
                detail="A IA está pronta para transformar as respostas em configuração revisável."
              />
            )}
          </CommandCenterList>
        </>,
      );
    case 'AI_SUMMARY':
      return renderCard(
        <>
          <CommandCenterList>
            <CommandCenterRow title="Leitura atual" detail={block.description} />
            <CommandCenterRow title="Ação com maior potencial de receita" detail={nextAction} />
            <CommandCenterRow
              title="Tempo médio de resposta"
              detail={
                dashboard.averageResponseMinutes === null
                  ? 'Ainda sem histórico; o primeiro lead cria a linha de base.'
                  : `${dashboard.averageResponseMinutes} minutos`
              }
            />
          </CommandCenterList>
        </>,
      );
    case 'LIST':
    default:
      return renderCard(
        <>
          <CommandCenterList>
            {block.dataSources.slice(0, 5).map((source) => {
              const contract = block.dataContracts?.find(
                ({ source: contractSource }) => contractSource === source,
              );

              return (
                <CommandCenterRow
                  key={source}
                  title={source}
                  detail={getDataSourceValue(
                    source,
                    readiness,
                    pageData,
                    contract?.fallback,
                  )}
                />
              );
            })}
            <CommandCenterRow title="Próxima decisão" detail={nextAction} />
          </CommandCenterList>
        </>,
      );
  }
};

const AdaptivePageActions = ({ page }: { page: DiexPageCatalogItem }) => {
  const navigate = useNavigate();
  const actions = (page.actions ?? [])
    .map((action) => ({
      ...action,
      route: getSafeInternalRoute(action.route),
    }))
    .filter(
      (action): action is typeof action & { route: string } =>
        action.route !== null,
    )
    .slice(0, 6);

  if (actions.length === 0) {
    return null;
  }

  return (
    <CommandCenterCard title="Ações configuradas para esta operação">
      <CommandCenterList>
        {actions.map((action) => {
          const safeguards = [
            action.confirmationRequired ? 'confirmação' : null,
            action.requiresApproval ? 'aprovação' : null,
          ].filter((value): value is string => value !== null);

          return (
            <CommandCenterRow
              key={action.key}
              title={action.label}
              detail={
                safeguards.length > 0
                  ? `Esta ação exige ${safeguards.join(' e ')} antes da execução.`
                  : `Permissão: ${action.requiredPermission}.`
              }
              action={
                <Button
                  title={action.label}
                  variant="secondary"
                  onClick={() => navigate(action.route)}
                />
              }
            />
          );
        })}
      </CommandCenterList>
    </CommandCenterCard>
  );
};

export const DiexAdaptivePage = () => {
  const { pageKey = '' } = useParams<{ pageKey: string }>();
  const [page, setPage] = useState<DiexPageCatalogItem | null>(null);
  const [readiness, setReadiness] = useState<DiexCommercialReadiness | null>(
    null,
  );
  const [pageData, setPageData] = useState<DiexPageDataState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      getDiexOnboardingRoute<DiexPageCatalogState>(
        '/rest/diex/onboarding/pages',
      ),
      getDiexOnboardingRoute<DiexCommercialReadiness>(
        '/rest/diex/onboarding/readiness',
      ),
      getDiexOnboardingRoute<DiexPageDataState>(
        `/rest/diex/onboarding/pages/${encodeURIComponent(pageKey)}/data`,
      ).catch(() => null),
    ])
      .then(([catalog, nextReadiness, nextPageData]) => {
        if (!cancelled) {
          const nextPage = catalog.items.find((item) => item.key === pageKey) ?? null;

          setPage(nextPage);
          setReadiness(nextReadiness);
          setPageData(
            nextPageData?.pageKey === pageKey ? nextPageData : null,
          );
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  if (isLoading) {
    return (
      <CommandCenterPage
        title="Carregando operação"
        description="Preparando a página adaptada para este workspace."
      >
        <CommandCenterGrid columns={1}>
          <CommandCenterCard title="Configuração operacional">
            <CommandCenterStartState
              title="Estamos preparando os dados"
              message="A página será preenchida com o contexto comercial deste workspace."
            />
          </CommandCenterCard>
        </CommandCenterGrid>
      </CommandCenterPage>
    );
  }

  if (!page) {
    return (
      <CommandCenterPage
        title="Página operacional"
        description="Esta página ainda não está ativa neste workspace."
      >
        <CommandCenterGrid columns={1}>
          <CommandCenterCard title="Próxima ação">
            <CommandCenterStartState
              title="Configure esta operação"
              message="Revise a arquitetura recomendada e crie páginas a partir do contexto real da empresa."
            />
          </CommandCenterCard>
        </CommandCenterGrid>
      </CommandCenterPage>
    );
  }

  if (page.status !== 'ACTIVE') {
    return (
      <CommandCenterPage
        title={page.label}
        description="Esta página foi preservada, mas não está ativa no menu deste workspace."
      >
        <CommandCenterGrid columns={1}>
          <CommandCenterCard title="Página preservada">
            <CommandCenterStartState
              title="Página fora da operação ativa"
              message="O conteúdo e os dados foram preservados. Restaure a página em Páginas e menu quando ela voltar a apoiar uma decisão comercial."
              actionLabel="Abrir páginas e menu"
              to="/diex/pages"
            />
          </CommandCenterCard>
        </CommandCenterGrid>
      </CommandCenterPage>
    );
  }

  const fallbackRoute =
    getSafeInternalRoute(page.emptyState.actionRoute) ??
    getSafeInternalRoute(page.capabilityContract?.fallbackRoute) ??
    '/diex/pages/first-steps';
  const nativeRoute = getSafeInternalRoute(page.nativeRoute);
  const camaleonic = getPageIsCamaleonic(page);
  const runtimeObjectSources = (pageData?.sources ?? []).filter(
    ({ objectName }) => objectName !== null,
  );
  const runtimeRecordCount = runtimeObjectSources.reduce(
    (total, source) => total + (source.count ?? 0),
    0,
  );

  return (
    <CommandCenterPage title={page.label} description={page.description}>
      <CommandCenterGrid columns={1}>
        <CommandCenterMetrics>
          {camaleonic ? (
            <>
              <CommandCenterMetric
                label="Registros na operação"
                value={runtimeRecordCount}
              />
              <CommandCenterMetric
                label="Fontes ativas"
                value={runtimeObjectSources.length}
              />
              <CommandCenterMetric
                label="Próxima decisão"
                value={page.primaryAction}
              />
              <CommandCenterMetric
                label="Estado da configuração"
                value={
                  JOURNEY_PHASE_LABELS[
                    readiness?.onboardingJourney?.phase ?? ''
                  ] ?? 'Em preparação'
                }
              />
            </>
          ) : (
            <>
              <CommandCenterMetric
                label="Prontidão para vender"
                value={`${readiness?.score ?? 0}%`}
              />
              <CommandCenterMetric
                label="Valor no pipeline"
                value={formatCurrency(
                  getDashboard(readiness).pipelineValueMicros,
                  getDashboard(readiness).pipelineCurrencyCode,
                )}
              />
              <CommandCenterMetric
                label="Próximas ações"
                value={getDashboard(readiness).nextActions}
              />
              <CommandCenterMetric
                label="Ação que gera receita"
                value={page.primaryAction}
              />
            </>
          )}
        </CommandCenterMetrics>
        {(page.blocks ?? []).length > 0 ? (
          (page.blocks ?? [])
            .slice()
            .sort((left, right) => left.position - right.position)
            .map((block) => (
              <AdaptivePageBlock
                key={block.key}
                block={block}
                readiness={readiness}
                pageData={pageData}
                camaleonic={camaleonic}
              />
            ))
        ) : (
          <CommandCenterCard title="Operação preparada">
            <CommandCenterStartState
              title="A página já tem uma direção comercial"
              message={page.description}
              actionLabel="Executar próxima ação"
              to={fallbackRoute}
            />
          </CommandCenterCard>
        )}
        <AdaptivePageActions page={page} />
        {nativeRoute ? (
          <CommandCenterCard title="Operação completa">
            <CommandCenterStartState
              title={`Abrir o módulo completo de ${page.label.toLowerCase()}`}
              message="A página adaptativa organiza a operação deste workspace. O módulo completo mantém as ações profundas, registros e automações disponíveis."
              actionLabel={`Abrir ${page.label}`}
              to={nativeRoute}
            />
          </CommandCenterCard>
        ) : null}
        <CommandCenterCard title="Fontes e composição">
          <CommandCenterList>
            <CommandCenterRow
              title="Capacidades ativas"
              detail={
                page.capabilities.length > 0
                  ? page.capabilities.join(' · ')
                  : 'Núcleo universal Diex'
              }
            />
            <CommandCenterRow
              title="Fontes conectadas"
              detail={
                page.dataSources.length > 0
                  ? page.dataSources.join(' · ')
                  : page.dataContracts?.map(({ source }) => source).join(' · ') ||
                    'Dados operacionais e próxima ação comercial'
              }
            />
            <CommandCenterRow
              title="Origem da configuração"
              detail={
                page.lifecycle === 'CUSTOM'
                  ? page.aiGenerated
                    ? 'Página personalizada proposta pela IA.'
                    : 'Página personalizada pelo administrador.'
                  : 'Composição declarativa do perfil operacional.'
              }
            />
          </CommandCenterList>
        </CommandCenterCard>
      </CommandCenterGrid>
    </CommandCenterPage>
  );
};
