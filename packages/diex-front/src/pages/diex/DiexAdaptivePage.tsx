import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
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
  if (source.error) {
    return source.error;
  }

  if (source.count === 0) {
    return (
      source.fallback ??
      fallback ??
      'Nenhum registro encontrado; execute a próxima ação para iniciar.'
    );
  }

  if (source.count !== null) {
    if (source.isPartial && source.totalCount !== null) {
      return `${source.returnedCount} de ${source.totalCount} registros exibidos. Abra o módulo completo para consultar toda a base.`;
    }

    return `${source.count} registro${source.count === 1 ? '' : 's'} ${source.count === 1 ? 'disponível' : 'disponíveis'} na operação.`;
  }

  return fallback ?? source.fallback;
};

const JOURNEY_PHASE_LABELS: Record<string, string> = {
  DISCOVERY_REVIEW: 'Revisão do entendimento',
  ARCHITECTURE_APPROVAL: 'Aprovação da arquitetura',
  CHANNEL_CONNECTION: 'Conexão do canal',
  FIRST_REVENUE_FLOW: 'Primeiro fluxo de resultado',
  TEAM_ENABLEMENT: 'Configuração da equipe',
  COCKPIT_OPERATIONAL: 'Cockpit operacional',
  READY: 'CRM pronto para operar',
  SELLING_READY: 'Pronto para vender',
};

const getSafeInternalRoute = (
  route: string | null | undefined,
): string | null =>
  typeof route === 'string' && route.startsWith('/') && !route.startsWith('//')
    ? route
    : null;

const AdaptivePageBlock = ({
  block,
  pageData,
}: {
  block: DiexPageBlock;
  pageData: DiexPageDataState | null;
}) => {
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
            to={actionRoute}
          />
        ) : null
      }
    >
      {content}
    </CommandCenterCard>
  );

  const contracts = block.dataContracts?.length
    ? block.dataContracts
    : block.dataSources.map((source, position) => ({
        key: `${block.key}:${position}`,
        source,
        fallback: 'Execute a próxima ação para gerar o primeiro registro.',
      }));
  const effectiveContracts =
    contracts.length > 0
      ? contracts
      : [
          {
            key: `${block.key}:guidance`,
            source: block.label,
            fallback: block.description,
          },
        ];
  const rows = effectiveContracts.slice(0, 6).flatMap((contract) => {
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

    return runtimeSource.records
      .slice(0, 4)
      .map((record, index) => (
        <CommandCenterRow
          key={`${contract.key}:${index}`}
          title={getRecordTitle(record)}
          detail={`${contract.source} · ${getRuntimeSourceDetail(runtimeSource)}`}
        />
      ));
  });

  return renderCard(
    block.type === 'KPI' ? (
      <CommandCenterMetrics>
        {effectiveContracts.slice(0, 4).map((contract) => {
          const runtimeSource = getRuntimeSource(pageData, contract.source);

          return (
            <CommandCenterMetric
              key={contract.key}
              label={contract.source}
              value={
                runtimeSource?.error
                  ? '—'
                  : (runtimeSource?.count ??
                    runtimeSource?.fallback ??
                    contract.fallback)
              }
            />
          );
        })}
      </CommandCenterMetrics>
    ) : (
      <CommandCenterList>{rows}</CommandCenterList>
    ),
  );
};

const AdaptivePageActions = ({ page }: { page: DiexPageCatalogItem }) => {
  const actions = (page.actions ?? [])
    .map((action) => ({
      ...action,
      route: getSafeInternalRoute(action.route),
    }))
    .filter(
      (action): action is typeof action & { route: string } =>
        action.route !== null && action.route !== page.route,
    )
    .slice(0, 6);

  if (actions.length === 0) {
    return null;
  }

  return (
    <CommandCenterCard title="Ações disponíveis">
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
                  : 'Abra esta ação para avançar a operação.'
              }
              action={
                <Button
                  title={action.label}
                  variant="secondary"
                  to={action.route}
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
  const [didCatalogLoadFail, setDidCatalogLoadFail] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setPage(null);
    setReadiness(null);
    setPageData(null);
    setDidCatalogLoadFail(false);

    void Promise.all([
      getDiexOnboardingRoute<DiexPageCatalogState>(
        '/rest/diex/onboarding/pages',
      )
        .then((value) => ({ value, failed: false }))
        .catch(() => ({ value: null, failed: true })),
      getDiexOnboardingRoute<DiexCommercialReadiness>(
        '/rest/diex/onboarding/readiness',
      ).catch(() => null),
      getDiexOnboardingRoute<DiexPageDataState>(
        `/rest/diex/onboarding/pages/${encodeURIComponent(pageKey)}/data`,
      ).catch(() => null),
    ])
      .then(([catalogResult, nextReadiness, nextPageData]) => {
        if (!cancelled) {
          const nextPage =
            catalogResult.value?.items.find((item) => item.key === pageKey) ??
            null;

          setPage(nextPage);
          setDidCatalogLoadFail(catalogResult.failed);
          if (nextReadiness) {
            setReadiness(nextReadiness);
          }
          setPageData(nextPageData?.pageKey === pageKey ? nextPageData : null);
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
              message="A página será preenchida com o contexto desta operação."
            />
          </CommandCenterCard>
        </CommandCenterGrid>
      </CommandCenterPage>
    );
  }

  if (!page) {
    const catalogMessage = didCatalogLoadFail
      ? 'A configuração desta página não pôde ser consultada. Nenhuma estrutura foi removida.'
      : 'Revise a arquitetura recomendada e crie páginas a partir do contexto real da empresa.';

    return (
      <CommandCenterPage
        title={
          didCatalogLoadFail
            ? 'Configuração temporariamente indisponível'
            : 'Página operacional'
        }
        description={
          didCatalogLoadFail
            ? 'Atualize antes de concluir que a página não existe neste workspace.'
            : 'Esta página ainda não está ativa neste workspace.'
        }
        statusText={didCatalogLoadFail ? 'Dados indisponíveis' : undefined}
      >
        <CommandCenterGrid columns={1}>
          <CommandCenterCard title="Próxima ação">
            <CommandCenterStartState
              title={
                didCatalogLoadFail
                  ? 'Recarregue a configuração'
                  : 'Configure esta operação'
              }
              message={catalogMessage}
              actionLabel={
                didCatalogLoadFail ? 'Tentar novamente' : 'Abrir páginas e menu'
              }
              to="/diex/pages"
              onAction={
                didCatalogLoadFail ? () => window.location.reload() : undefined
              }
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
              message="O conteúdo e os dados foram preservados. Restaure a página em Páginas e menu quando ela voltar a apoiar uma decisão da operação."
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
    '/diex/first-steps';
  const nativeRoute = getSafeInternalRoute(page.nativeRoute);
  const runtimeObjectSources = (pageData?.sources ?? []).filter(
    ({ count, error, freshnessStatus, objectName }) =>
      objectName !== null &&
      count !== null &&
      error === null &&
      (freshnessStatus === 'LIVE' || freshnessStatus === 'PARTIAL'),
  );
  const runtimeCountsByObject = new Map<string, number>();

  for (const source of runtimeObjectSources) {
    const objectName = source.objectName as string;

    runtimeCountsByObject.set(
      objectName,
      Math.max(runtimeCountsByObject.get(objectName) ?? 0, source.count ?? 0),
    );
  }

  const runtimeRecordCount = [...runtimeCountsByObject.values()].reduce(
    (total, count) => total + count,
    0,
  );
  const dataStatusText = pageData
    ? `${pageData.hasErrors || pageData.isPartial ? 'Dados parciais' : 'Dados atuais'} · ${new Date(
        pageData.generatedAt,
      ).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'Dados indisponíveis';

  return (
    <CommandCenterPage
      title={page.label}
      description={page.description}
      statusText={dataStatusText}
    >
      <CommandCenterGrid columns={1}>
        <CommandCenterMetrics>
          <CommandCenterMetric
            label="Registros na operação"
            value={runtimeObjectSources.length > 0 ? runtimeRecordCount : '—'}
          />
          <CommandCenterMetric
            label="Fontes ativas"
            value={
              runtimeObjectSources.length > 0 ? runtimeCountsByObject.size : '—'
            }
          />
          <CommandCenterMetric
            label="Próxima decisão"
            value={page.primaryAction}
          />
          <CommandCenterMetric
            label="Estado da configuração"
            value={
              JOURNEY_PHASE_LABELS[readiness?.onboardingJourney?.phase ?? ''] ??
              'Em preparação'
            }
          />
        </CommandCenterMetrics>
        {(page.blocks ?? []).length > 0 ? (
          (page.blocks ?? [])
            .slice()
            .sort((left, right) => left.position - right.position)
            .map((block) => (
              <AdaptivePageBlock
                key={block.key}
                block={block}
                pageData={pageData}
              />
            ))
        ) : (
          <CommandCenterCard title="Operação preparada">
            <CommandCenterStartState
              title="A página já tem uma direção operacional"
              message={page.description}
              actionLabel="Executar próxima ação"
              to={fallbackRoute}
            />
          </CommandCenterCard>
        )}
        <AdaptivePageActions page={page} />
        {!pageData || pageData.hasErrors || pageData.isPartial ? (
          <CommandCenterCard
            title="Qualidade dos dados"
            action={
              <Button
                title="Atualizar dados"
                variant="secondary"
                onClick={() => window.location.reload()}
              />
            }
          >
            <CommandCenterRow
              title={
                !pageData
                  ? 'As fontes não responderam nesta abertura'
                  : pageData.hasErrors
                    ? 'Uma fonte não respondeu'
                    : 'A página mostra um recorte da base'
              }
              detail={
                !pageData
                  ? 'A configuração da página foi preservada. Atualize antes de usar seus indicadores para decidir.'
                  : pageData.hasErrors
                    ? 'Os blocos disponíveis continuam utilizáveis. Atualize a página ou abra o módulo completo antes de decidir com base em uma fonte ausente.'
                    : 'Os totais consideram a base atual, mas as listas exibem até 25 registros por fonte para manter a página rápida.'
              }
            />
          </CommandCenterCard>
        ) : null}
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
        <CommandCenterCard title="Orientação da operação">
          <CommandCenterList>
            <CommandCenterRow title="Objetivo" detail={page.description} />
            <CommandCenterRow
              title="Dados usados nesta página"
              detail={
                page.dataSources.length > 0
                  ? page.dataSources.join(' · ')
                  : page.dataContracts
                      ?.map(({ source }) => source)
                      .join(' · ') ||
                    'Dados operacionais e próxima ação prioritária'
              }
            />
            <CommandCenterRow
              title="Próxima ação"
              detail={page.primaryAction}
            />
            <CommandCenterRow
              title="Atualização dos dados"
              detail={
                pageData
                  ? `Consulta feita em ${new Date(
                      pageData.generatedAt,
                    ).toLocaleString('pt-BR')}${
                      pageData.isPartial
                        ? ' · listas limitadas, totais preservados'
                        : ''
                    }.`
                  : 'A fonte de dados não respondeu nesta abertura.'
              }
            />
          </CommandCenterList>
        </CommandCenterCard>
      </CommandCenterGrid>
    </CommandCenterPage>
  );
};
