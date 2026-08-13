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

const COMMERCIAL_INTELLIGENCE_QUERY = gql`
  query DiexCommercialIntelligence {
    commercialSignals(first: 100, orderBy: [{ capturedAt: DescNullsLast }]) {
      totalCount
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
          updatedAt
          recommendedAction {
            markdown
          }
          opportunity {
            id
            name
          }
          company {
            id
            name
          }
          person {
            id
            name {
              firstName
              lastName
            }
          }
        }
      }
    }
    opportunities(first: 100, orderBy: [{ commercialScore: DescNullsLast }]) {
      totalCount
      edges {
        node {
          id
          name
          stage
          commercialScore
          dealRisk
          nextCommercialAction
          nextCommercialActionAt
          updatedAt
          amount {
            amountMicros
            currencyCode
          }
          company {
            id
            name
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
  company?: NamedRecord | null;
};
type QueryData = {
  commercialSignals?: {
    totalCount?: number;
    edges?: Array<{ node: Signal }>;
  };
  opportunities?: {
    totalCount?: number;
    edges?: Array<{ node: Opportunity }>;
  };
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
  const { data, loading, error, refetch } = useQuery<QueryData>(
    COMMERCIAL_INTELLIGENCE_QUERY,
    {
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    },
  );
  const [updateSignal, { loading: isUpdating }] = useMutation(
    UPDATE_COMMERCIAL_SIGNAL,
  );
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const signals = data?.commercialSignals?.edges?.map(({ node }) => node) ?? [];
  const opportunities =
    data?.opportunities?.edges?.map(({ node }) => node) ?? [];
  const signalTotalCount =
    data?.commercialSignals?.totalCount ?? signals.length;
  const opportunityTotalCount =
    data?.opportunities?.totalCount ?? opportunities.length;
  const isSampled =
    signalTotalCount > signals.length ||
    opportunityTotalCount > opportunities.length;
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
    if (data) {
      setLastRefreshedAt(new Date());
    }
  }, [data]);

  const dataStatus = error
    ? hasCommercialData
      ? 'Falha ao atualizar · dados anteriores preservados'
      : 'Dados indisponíveis'
    : loading
      ? 'Atualizando dados reais'
      : lastRefreshedAt
        ? `Atualizado às ${lastRefreshedAt.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : 'Aguardando dados reais';
  const transition = async (id: string, status: 'IN_REVIEW' | 'ACTIONED') => {
    if (error) {
      enqueueErrorSnackBar({
        message:
          'Atualize o radar antes de mudar um sinal; os dados atuais não foram confirmados.',
      });
      return;
    }

    try {
      await updateSignal({ variables: { id, data: { status } } });
      await refetch();
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
      {loading && signals.length === 0 && opportunities.length === 0 ? (
        <CommandCenterLoadingState />
      ) : null}
      {error && signals.length === 0 && opportunities.length === 0 ? (
        <CommandCenterCard title="Inteligência Comercial">
          <CommandCenterEmptyState message="Não foi possível carregar o cockpit de inteligência comercial." />
          <Button
            title="Tentar novamente"
            size="small"
            variant="secondary"
            onClick={() => void refetch()}
          />
        </CommandCenterCard>
      ) : null}
      {error && hasCommercialData ? (
        <CommandCenterCard title="Qualidade dos dados">
          <CommandCenterRow
            title="A atualização do cockpit falhou"
            detail="Os números abaixo pertencem à última consulta concluída. Atualize antes de tomar uma decisão comercial."
            action={
              <Button
                title="Tentar novamente"
                size="small"
                variant="secondary"
                onClick={() => void refetch()}
              />
            }
          />
        </CommandCenterCard>
      ) : null}
      {!loading && !error && !hasCommercialData ? (
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
              detail={`${signalTotalCount} sinais e ${opportunityTotalCount} oportunidades na base${isSampled ? '; métricas abaixo calculadas sobre os 100 registros mais prioritários de cada fonte' : ''}.${expiredActiveSignals > 0 ? ` ${expiredActiveSignals} sinais vencidos foram retirados da fila.` : ''}`}
              action={
                <Button
                  title="Atualizar radar"
                  size="small"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void refetch()}
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
                        title={signal.name}
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
                                disabled={isUpdating || Boolean(error)}
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
                <CommandCenterEmptyState message="Nenhuma oportunidade cadastrada." />
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
              <CommandCenterEmptyState message="Nenhuma próxima ação definida nas oportunidades." />
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
