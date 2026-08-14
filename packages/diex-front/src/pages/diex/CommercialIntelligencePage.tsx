import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';

import {
  CommandCenterCard,
  CommandCenterEmptyState,
  CommandCenterGrid,
  CommandCenterList,
  CommandCenterLoadingState,
  CommandCenterMetric,
  CommandCenterMetrics,
  CommandCenterPage,
  CommandCenterRow,
  CommandCenterStartState,
} from '@/diex-command-centers/components/CommandCenterLayout';
import { getRecordName } from '@/diex-command-centers/customer-success/utils';
import { useDiexPagePresentation } from '@/diex-onboarding/hooks/useDiexPagePresentation';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button, Tag } from 'diex-ui';
import { isDefined } from 'diex-shared/utils';

const COMMERCIAL_SIGNALS_QUERY = gql`
  query DiexCommercialSignals {
    commercialSignals(first: 100, orderBy: [{ capturedAt: DescNullsLast }]) {
      edges {
        node {
          id
          name
          signalType
          source
          status
          strength
          confidence
          capturedAt
          validUntil
          recommendedAction {
            markdown
          }
          opportunityId
          companyId
          personId
        }
      }
    }
  }
`;

const COMMERCIAL_OPPORTUNITIES_QUERY = gql`
  query DiexCommercialOpportunities {
    opportunities(first: 100, orderBy: [{ commercialScore: DescNullsLast }]) {
      edges {
        node {
          id
          name
          stage
          commercialScore
          dealRisk
          nextCommercialAction
          nextCommercialActionAt
          amount {
            amountMicros
            currencyCode
          }
          companyId
        }
      }
    }
  }
`;

const COMMERCIAL_COMPANIES_QUERY = gql`
  query DiexCommercialCompanies {
    companies(first: 200) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const COMMERCIAL_PEOPLE_QUERY = gql`
  query DiexCommercialPeople {
    people(first: 200) {
      edges {
        node {
          id
          name {
            firstName
            lastName
          }
        }
      }
    }
  }
`;
const UPDATE_COMMERCIAL_SIGNAL = gql`
  mutation DiexUpdateCommercialSignal(
    $id: UUID!
    $data: CommercialSignalUpdateInput!
  ) {
    updateCommercialSignal(id: $id, data: $data) {
      id
    }
  }
`;
type NamedRecord = {
  id: string;
  name?:
    | string
    | { firstName?: string | null; lastName?: string | null }
    | null;
};
type Signal = {
  id: string;
  name: string;
  signalType: string;
  source?: string | null;
  status: string;
  strength?: string | null;
  confidence?: number | null;
  capturedAt?: string | null;
  validUntil?: string | null;
  updatedAt?: string | null;
  recommendedAction?: { markdown?: string | null } | null;
  opportunityId?: string | null;
  companyId?: string | null;
  personId?: string | null;
  opportunity?: NamedRecord | null;
  company?: NamedRecord | null;
  person?: NamedRecord | null;
};
type Opportunity = NamedRecord & {
  stage?: string | null;
  commercialScore?: number | null;
  dealRisk?: string | null;
  nextCommercialAction?: string | null;
  nextCommercialActionAt?: string | null;
  updatedAt?: string | null;
  amount?: {
    amountMicros?: number | null;
    currencyCode?: string | null;
  } | null;
  companyId?: string | null;
  company?: NamedRecord | null;
};
type CommercialSignalsQueryData = {
  commercialSignals?: {
    edges?: Array<{ node: Signal }>;
  };
};
type CommercialOpportunitiesQueryData = {
  opportunities?: {
    edges?: Array<{ node: Opportunity }>;
  };
};
type CompaniesQueryData = {
  companies?: { edges?: Array<{ node: NamedRecord }> };
};
type PeopleQueryData = {
  people?: { edges?: Array<{ node: NamedRecord }> };
};

const strength = (value?: string | null) => {
  const parsed = Number.parseInt(value?.replace('RATING_', '') ?? '', 10);
  return Number.isFinite(parsed) ? parsed : 0;
};
const priority = (signal: Signal) =>
  (signal.signalType === 'CHURN_RISK' || signal.signalType === 'RISK'
    ? 40
    : signal.signalType === 'OBJECTION'
      ? 30
      : signal.signalType === 'INTENT' || signal.signalType === 'EXPANSION'
        ? 25
        : 10) +
  (signal.status === 'NEW' ? 20 : 10) +
  strength(signal.strength) * 4 +
  (signal.confidence ?? 0) / 10;
const signalLabel = (type: string) =>
  ({
    INTENT: 'Intenção',
    ENGAGEMENT: 'Engajamento',
    OBJECTION: 'Objeção',
    RISK: 'Risco',
    EXPANSION: 'Expansão',
    CHURN_RISK: 'Risco de churn',
    COMPETITOR: 'Concorrente',
  })[type] ?? type;
const statusLabel = (status: string) =>
  ({
    NEW: 'Novo',
    IN_REVIEW: 'Em análise',
    ACTIONED: 'Tratado',
    DISMISSED: 'Descartado',
  })[status] ?? status;
const formatCurrency = (amount?: Opportunity['amount']) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: amount?.currencyCode ?? 'BRL',
    maximumFractionDigits: 0,
  }).format((amount?.amountMicros ?? 0) / 1_000_000);
const relativeDate = (date?: string | null) => {
  if (!date) return 'sem data';
  const days = Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
  return days === 0
    ? 'hoje'
    : days === 1
      ? 'amanhã'
      : days === -1
        ? 'ontem'
        : days > 0
          ? `em ${days} dias`
          : `${Math.abs(days)} dias atrasada`;
};

export const CommercialIntelligencePage = () => {
  const pagePresentation = useDiexPagePresentation({
    pageKey: 'commercial-intelligence',
    fallbackLabel: 'Inteligência Comercial',
    fallbackDescription:
      'Sinais dos canais, CRM, IA e relacionamento priorizados pelo impacto real no resultado.',
  });
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const {
    data: signalsData,
    loading: signalsLoading,
    error: signalsError,
    refetch: refetchSignals,
  } = useQuery<CommercialSignalsQueryData>(COMMERCIAL_SIGNALS_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });
  const {
    data: opportunitiesData,
    loading: opportunitiesLoading,
    error: opportunitiesError,
    refetch: refetchOpportunities,
  } = useQuery<CommercialOpportunitiesQueryData>(
    COMMERCIAL_OPPORTUNITIES_QUERY,
    {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
  );
  const {
    data: companiesData,
    error: companiesError,
    refetch: refetchCompanies,
  } = useQuery<CompaniesQueryData>(COMMERCIAL_COMPANIES_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });
  const {
    data: peopleData,
    error: peopleError,
    refetch: refetchPeople,
  } = useQuery<PeopleQueryData>(COMMERCIAL_PEOPLE_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });
  const [updateSignal, { loading: isUpdating }] = useMutation(
    UPDATE_COMMERCIAL_SIGNAL,
  );
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const companiesById = new Map(
    (companiesData?.companies?.edges ?? []).map(({ node }) => [node.id, node]),
  );
  const peopleById = new Map(
    (peopleData?.people?.edges ?? []).map(({ node }) => [node.id, node]),
  );
  const opportunities = (
    opportunitiesData?.opportunities?.edges?.map(({ node }) => node) ?? []
  ).map((opportunity) => ({
    ...opportunity,
    company: opportunity.companyId
      ? companiesById.get(opportunity.companyId)
      : null,
  }));
  const opportunitiesById = new Map(
    opportunities.map((opportunity) => [opportunity.id, opportunity]),
  );
  const signals = (
    signalsData?.commercialSignals?.edges?.map(({ node }) => node) ?? []
  ).map((signal) => ({
    ...signal,
    opportunity: signal.opportunityId
      ? opportunitiesById.get(signal.opportunityId)
      : null,
    company: signal.companyId ? companiesById.get(signal.companyId) : null,
    person: signal.personId ? peopleById.get(signal.personId) : null,
  }));
  const loading = signalsLoading || opportunitiesLoading;
  const coreError = signalsError || opportunitiesError;
  const relationshipError = companiesError || peopleError;
  const hasCoreResponse = Boolean(signalsData || opportunitiesData);
  const hasCompleteFailure = Boolean(
    signalsError && opportunitiesError && !hasCoreResponse,
  );
  const signalTotalCount = signals.length;
  const opportunityTotalCount = opportunities.length;
  const now = Date.now();
  const activeSignals = signals.filter(
    ({ status, validUntil }) =>
      (status === 'NEW' || status === 'IN_REVIEW') &&
      (!validUntil || new Date(validUntil).getTime() >= now),
  );
  const expiredActiveSignals = signals.filter(
    ({ status, validUntil }) =>
      (status === 'NEW' || status === 'IN_REVIEW') &&
      Boolean(validUntil) &&
      new Date(validUntil ?? 0).getTime() < now,
  ).length;
  const buyingSignals = activeSignals.filter(
    ({ signalType }) => signalType === 'INTENT' || signalType === 'EXPANSION',
  );
  const riskSignals = activeSignals.filter(({ signalType }) =>
    ['RISK', 'CHURN_RISK', 'OBJECTION'].includes(signalType),
  );
  const pipelineOpportunities = opportunities.filter(
    ({ stage }) => !['CUSTOMER', 'LOST'].includes(stage ?? ''),
  );
  const overdueActions = pipelineOpportunities.filter(
    ({ nextCommercialActionAt }) =>
      isDefined(nextCommercialActionAt) &&
      new Date(nextCommercialActionAt).getTime() < now,
  );
  const prioritized = [...activeSignals]
    .sort((left, right) => priority(right) - priority(left))
    .slice(0, 8);
  const ranked = [...pipelineOpportunities]
    .sort(
      (left, right) =>
        (right.commercialScore ?? 0) - (left.commercialScore ?? 0),
    )
    .slice(0, 6);
  const nextActions = pipelineOpportunities
    .filter(({ nextCommercialAction }) => Boolean(nextCommercialAction))
    .sort(
      (left, right) =>
        new Date(left.nextCommercialActionAt ?? '2999-12-31').getTime() -
        new Date(right.nextCommercialActionAt ?? '2999-12-31').getTime(),
    )
    .slice(0, 6);
  const pipelineByCurrency = Object.entries(
    pipelineOpportunities.reduce<Record<string, number>>((totals, item) => {
      const currencyCode = item.amount?.currencyCode?.trim() || 'BRL';

      totals[currencyCode] =
        (totals[currencyCode] ?? 0) + (item.amount?.amountMicros ?? 0);

      return totals;
    }, {}),
  ).filter(([, amountMicros]) => amountMicros > 0);
  const hasCommercialData = signals.length > 0 || opportunities.length > 0;

  useEffect(() => {
    if (signalsData || opportunitiesData) {
      setLastRefreshedAt(new Date());
    }
  }, [opportunitiesData, signalsData]);

  const dataStatus = coreError
    ? hasCompleteFailure
      ? 'Dados indisponíveis'
      : 'Dados parciais · operação preservada'
    : relationshipError
      ? 'Dados atuais · vínculos resumidos'
      : loading
        ? 'Atualizando dados reais'
        : lastRefreshedAt
          ? `Atualizado às ${lastRefreshedAt.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'Aguardando dados reais';
  const refetchAll = async () => {
    await Promise.all([
      refetchSignals(),
      refetchOpportunities(),
      refetchCompanies(),
      refetchPeople(),
    ]);
  };
  const transition = async (id: string, status: 'IN_REVIEW' | 'ACTIONED') => {
    if (signalsError) {
      enqueueErrorSnackBar({
        message:
          'Atualize o radar antes de mudar um sinal; os dados atuais não foram confirmados.',
      });
      return;
    }

    try {
      await updateSignal({ variables: { id, data: { status } } });
      await refetchSignals();
      enqueueSuccessSnackBar({
        message:
          status === 'IN_REVIEW'
            ? 'Sinal movido para análise.'
            : 'Sinal marcado como tratado.',
      });
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível atualizar o sinal comercial.',
      });
    }
  };

  return (
    <CommandCenterPage
      title={pagePresentation.label}
      description={pagePresentation.description}
      statusText={dataStatus}
    >
      {loading && !hasCoreResponse ? <CommandCenterLoadingState /> : null}
      {hasCompleteFailure && !hasCommercialData ? (
        <CommandCenterCard title="Inteligência Comercial">
          <CommandCenterEmptyState
            message="Não foi possível carregar o cockpit de inteligência comercial. As oportunidades continuam disponíveis no CRM."
            actionLabel="Abrir oportunidades"
            to="/objects/opportunities"
          />
          <Button
            title="Tentar novamente"
            size="small"
            variant="secondary"
            onClick={() => void refetchAll()}
          />
        </CommandCenterCard>
      ) : null}
      {coreError && !hasCompleteFailure ? (
        <CommandCenterCard title="Qualidade dos dados">
          <CommandCenterRow
            title="Uma fonte do cockpit não respondeu"
            detail="As demais fontes continuam disponíveis. Atualize para recuperar o recorte completo antes de tomar uma decisão comercial."
            action={
              <Button
                title="Tentar novamente"
                size="small"
                variant="secondary"
                onClick={() => void refetchAll()}
              />
            }
          />
        </CommandCenterCard>
      ) : null}
      {!loading && !hasCompleteFailure && !hasCommercialData ? (
        <CommandCenterCard title="Seu cockpit comercial está pronto">
          <CommandCenterStartState
            title="O próximo ganho vem do primeiro lead registrado."
            message="Escolha WhatsApp, e-mail, importação ou cadastro manual; revise a arquitetura e transforme o primeiro contato em oportunidade e follow-up. Este painel será alimentado somente por dados reais."
          />
        </CommandCenterCard>
      ) : null}
      {hasCommercialData ? (
        <>
          <CommandCenterCard title="Evidência comercial antes de opinião.">
            <CommandCenterRow
              title={`${activeSignals.length} sinais ativos no recorte`}
              detail={`${signalTotalCount} sinais e ${opportunityTotalCount} oportunidades no recorte operacional.${expiredActiveSignals > 0 ? ` ${expiredActiveSignals} sinais vencidos foram retirados da fila.` : ''}`}
              action={
                <Button
                  title="Atualizar radar"
                  size="small"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void refetchAll()}
                />
              }
            />
          </CommandCenterCard>
          <CommandCenterMetrics>
            <CommandCenterMetric
              label="Sinais ativos no recorte"
              value={activeSignals.length}
            />
            <CommandCenterMetric
              label="Compra e expansão"
              value={buyingSignals.length}
            />
            <CommandCenterMetric
              label="Riscos e objeções"
              value={riskSignals.length}
            />
            <CommandCenterMetric
              label="Ações vencidas"
              value={overdueActions.length}
            />
          </CommandCenterMetrics>
          <CommandCenterGrid>
            <CommandCenterCard title="Fluxo de sinais prioritários">
              {prioritized.length === 0 ? (
                <CommandCenterEmptyState message="Nenhum sinal ativo. A fila está limpa." />
              ) : (
                <CommandCenterList>
                  {prioritized.map((signal) => {
                    const context =
                      getRecordName(signal.opportunity) ||
                      getRecordName(signal.company) ||
                      getRecordName(signal.person) ||
                      'Sem vínculo no CRM';
                    const nextStatus =
                      signal.status === 'NEW'
                        ? 'IN_REVIEW'
                        : signal.status === 'IN_REVIEW'
                          ? 'ACTIONED'
                          : null;
                    return (
                      <CommandCenterRow
                        key={signal.id}
                        title={signal.name || signalLabel(signal.signalType)}
                        detail={`${signalLabel(signal.signalType)} · ${statusLabel(signal.status)} · ${context} · ${strength(signal.strength)}/5 força · ${signal.recommendedAction?.markdown || 'Abra o sinal para definir a próxima ação.'}`}
                        action={
                          <>
                            <Button
                              title="Abrir"
                              size="small"
                              variant="tertiary"
                              onClick={() =>
                                openRecordInSidePanel({
                                  recordId: signal.id,
                                  objectNameSingular: 'commercialSignal',
                                })
                              }
                            />
                            {nextStatus ? (
                              <Button
                                title={
                                  nextStatus === 'IN_REVIEW'
                                    ? 'Analisar'
                                    : 'Tratar'
                                }
                                size="small"
                                variant="secondary"
                                disabled={isUpdating || Boolean(signalsError)}
                                onClick={() =>
                                  void transition(signal.id, nextStatus)
                                }
                              />
                            ) : null}
                          </>
                        }
                      />
                    );
                  })}
                </CommandCenterList>
              )}
            </CommandCenterCard>
            <CommandCenterCard title="Ranking de oportunidades">
              {ranked.length === 0 ? (
                <CommandCenterEmptyState
                  message="Nenhuma oportunidade cadastrada."
                  actionLabel="Abrir oportunidades"
                  to="/objects/opportunities"
                />
              ) : (
                <CommandCenterList>
                  {ranked.map((opportunity) => {
                    const score = Math.max(
                      0,
                      Math.min(100, opportunity.commercialScore ?? 0),
                    );
                    return (
                      <CommandCenterRow
                        key={opportunity.id}
                        title={
                          getRecordName(opportunity) || 'Oportunidade sem nome'
                        }
                        detail={`${getRecordName(opportunity.company) || 'Empresa não vinculada'} · ${opportunity.stage || 'Sem etapa'} · ${formatCurrency(opportunity.amount)}`}
                        action={
                          <Button
                            title={`${Math.round(score)} pts · ${opportunity.dealRisk ?? 'UNKNOWN'}`}
                            size="small"
                            variant="tertiary"
                            onClick={() =>
                              openRecordInSidePanel({
                                recordId: opportunity.id,
                                objectNameSingular: 'opportunity',
                              })
                            }
                          />
                        }
                      />
                    );
                  })}
                </CommandCenterList>
              )}
              {pipelineByCurrency.map(([currencyCode, amountMicros]) => (
                <Tag
                  key={currencyCode}
                  color="green"
                  text={`Pipeline ${currencyCode} no recorte: ${formatCurrency({ amountMicros, currencyCode })}`}
                />
              ))}
            </CommandCenterCard>
          </CommandCenterGrid>
          <CommandCenterCard title="Próximas ações comerciais">
            {nextActions.length === 0 ? (
              <CommandCenterEmptyState
                message="Nenhuma próxima ação definida nas oportunidades."
                actionLabel="Abrir oportunidades"
                to="/objects/opportunities"
              />
            ) : (
              <CommandCenterList>
                {nextActions.map((opportunity) => (
                  <CommandCenterRow
                    key={opportunity.id}
                    title={opportunity.nextCommercialAction ?? 'Próxima ação'}
                    detail={`${getRecordName(opportunity) || 'Oportunidade sem nome'} · ${relativeDate(opportunity.nextCommercialActionAt)}`}
                    action={
                      <>
                        <Tag
                          color={
                            opportunity.nextCommercialActionAt &&
                            new Date(
                              opportunity.nextCommercialActionAt,
                            ).getTime() < Date.now()
                              ? 'red'
                              : 'blue'
                          }
                          text={relativeDate(
                            opportunity.nextCommercialActionAt,
                          )}
                        />
                        <Button
                          title="Abrir"
                          size="small"
                          variant="tertiary"
                          onClick={() =>
                            openRecordInSidePanel({
                              recordId: opportunity.id,
                              objectNameSingular: 'opportunity',
                            })
                          }
                        />
                      </>
                    }
                  />
                ))}
              </CommandCenterList>
            )}
          </CommandCenterCard>
        </>
      ) : null}
    </CommandCenterPage>
  );
};
