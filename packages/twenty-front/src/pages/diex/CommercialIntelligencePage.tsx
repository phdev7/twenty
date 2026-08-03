import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';

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
} from '@/diex-command-centers/components/CommandCenterLayout';
import { getRecordName } from '@/diex-command-centers/customer-success/utils';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button, Tag } from 'twenty-ui';

const COMMERCIAL_INTELLIGENCE_QUERY = gql`
  query DiexCommercialIntelligence {
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
  amount?: {
    amountMicros?: number | null;
    currencyCode?: string | null;
  } | null;
  company?: NamedRecord | null;
};
type QueryData = {
  commercialSignals?: { edges?: Array<{ node: Signal }> };
  opportunities?: { edges?: Array<{ node: Opportunity }> };
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
  const { data, loading, error, refetch } = useQuery<QueryData>(
    COMMERCIAL_INTELLIGENCE_QUERY,
  );
  const [updateSignal, { loading: isUpdating }] = useMutation(
    UPDATE_COMMERCIAL_SIGNAL,
  );
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const signals = data?.commercialSignals?.edges?.map(({ node }) => node) ?? [];
  const opportunities =
    data?.opportunities?.edges?.map(({ node }) => node) ?? [];
  const activeSignals = signals.filter(
    ({ status }) => status === 'NEW' || status === 'IN_REVIEW',
  );
  const buyingSignals = activeSignals.filter(
    ({ signalType }) => signalType === 'INTENT' || signalType === 'EXPANSION',
  );
  const riskSignals = activeSignals.filter(({ signalType }) =>
    ['RISK', 'CHURN_RISK', 'OBJECTION'].includes(signalType),
  );
  const overdueActions = opportunities.filter(
    ({ nextCommercialActionAt }) =>
      nextCommercialActionAt &&
      new Date(nextCommercialActionAt).getTime() < Date.now(),
  );
  const prioritized = [...activeSignals]
    .sort((left, right) => priority(right) - priority(left))
    .slice(0, 8);
  const ranked = [...opportunities]
    .sort(
      (left, right) =>
        (right.commercialScore ?? 0) - (left.commercialScore ?? 0),
    )
    .slice(0, 6);
  const nextActions = opportunities
    .filter(({ nextCommercialAction }) => Boolean(nextCommercialAction))
    .sort(
      (left, right) =>
        new Date(left.nextCommercialActionAt ?? '2999-12-31').getTime() -
        new Date(right.nextCommercialActionAt ?? '2999-12-31').getTime(),
    )
    .slice(0, 6);
  const pipelineMicros = opportunities.reduce(
    (total, item) =>
      item.amount?.currencyCode === 'BRL'
        ? total + (item.amount.amountMicros ?? 0)
        : total,
    0,
  );
  const transition = async (id: string, status: 'IN_REVIEW' | 'ACTIONED') => {
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
      title="Inteligência Comercial"
      description="Sinais do CRM, WhatsApp, IA e Customer Success priorizados pelo impacto real na receita."
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
      {!error || signals.length > 0 || opportunities.length > 0 ? (
        <>
          <CommandCenterCard title="Evidência comercial antes de opinião.">
            <CommandCenterRow
              title={`${activeSignals.length} sinais ativos`}
              detail="A equipe começa pelo que exige ação agora."
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
              label="Sinais em operação"
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
                                disabled={isUpdating}
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
              {pipelineMicros > 0 ? (
                <Tag
                  color="green"
                  text={`Pipeline BRL mapeado: ${formatCurrency({ amountMicros: pipelineMicros, currencyCode: 'BRL' })}`}
                />
              ) : null}
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
