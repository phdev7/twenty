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
          recommendedAction { markdown }
          opportunity { id name }
          company { id name }
          person { id name { firstName lastName } }
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
          amount { amountMicros currencyCode }
          company { id name }
        }
      }
    }
  }
`;

const UPDATE_COMMERCIAL_SIGNAL = gql`
  mutation DiexUpdateCommercialSignal($id: UUID!, $data: CommercialSignalUpdateInput!) {
    updateCommercialSignal(id: $id, data: $data) { id }
  }
`;

type NamedRecord = { id: string; name?: string | null };
type CommercialSignal = {
  id: string;
  name: string;
  signalType: string;
  source?: string | null;
  status: string;
  strength?: number | null;
  confidence?: number | null;
  capturedAt?: string | null;
  recommendedAction?: { markdown?: string | null } | null;
  opportunity?: NamedRecord | null;
  company?: NamedRecord | null;
};
type CommercialOpportunity = NamedRecord & {
  stage?: string | null;
  commercialScore?: number | null;
  dealRisk?: string | null;
  nextCommercialAction?: string | null;
  nextCommercialActionAt?: string | null;
  amount?: { amountMicros?: number | null; currencyCode?: string | null } | null;
  company?: NamedRecord | null;
};
type CommercialData = {
  commercialSignals?: { edges?: Array<{ node: CommercialSignal }> };
  opportunities?: { edges?: Array<{ node: CommercialOpportunity }> };
};

const getTone = (value: string): 'blue' | 'green' | 'orange' | 'red' | 'gray' =>
  value === 'ACTIONED'
    ? 'green'
    : value === 'RISK' || value === 'CHURN_RISK'
      ? 'red'
      : value === 'IN_REVIEW'
        ? 'orange'
        : 'blue';

const formatCurrency = (amount?: CommercialOpportunity['amount']): string => {
  if (!amount?.amountMicros) {
    return '—';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: amount.currencyCode ?? 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount.amountMicros / 1_000_000);
};

export const CommercialIntelligencePage = () => {
  const { data, loading, error, refetch } = useQuery<CommercialData>(
    COMMERCIAL_INTELLIGENCE_QUERY,
  );
  const [updateSignal, { loading: isUpdating }] = useMutation(
    UPDATE_COMMERCIAL_SIGNAL,
  );
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const signals = data?.commercialSignals?.edges?.map(({ node }) => node) ?? [];
  const opportunities = data?.opportunities?.edges?.map(({ node }) => node) ?? [];
  const activeSignals = signals.filter(
    ({ status }) => status === 'NEW' || status === 'IN_REVIEW',
  );
  const buyingSignals = activeSignals.filter(({ signalType }) =>
    ['INTENT', 'EXPANSION'].includes(signalType),
  );
  const riskSignals = activeSignals.filter(({ signalType }) =>
    ['RISK', 'CHURN_RISK', 'OBJECTION'].includes(signalType),
  );
  const prioritizedSignals = [...activeSignals]
    .sort(
      (left, right) =>
        (right.strength ?? 0) + (right.confidence ?? 0) -
        ((left.strength ?? 0) + (left.confidence ?? 0)),
    )
    .slice(0, 8);
  const rankedOpportunities = [...opportunities]
    .sort((left, right) => (right.commercialScore ?? 0) - (left.commercialScore ?? 0))
    .slice(0, 6);

  const changeSignalStatus = async (
    signalId: string,
    status: 'IN_REVIEW' | 'ACTIONED',
  ) => {
    try {
      await updateSignal({ variables: { id: signalId, data: { status } } });
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
      description="Sinais, prioridades e próximos movimentos do pipeline comercial."
    >
      <CommandCenterMetrics>
        <CommandCenterMetric label="Sinais ativos" value={activeSignals.length} />
        <CommandCenterMetric label="Intenção e expansão" value={buyingSignals.length} />
        <CommandCenterMetric label="Riscos em aberto" value={riskSignals.length} />
        <CommandCenterMetric label="Oportunidades monitoradas" value={opportunities.length} />
      </CommandCenterMetrics>
      {loading ? <CommandCenterLoadingState /> : null}
      {error ? (
        <CommandCenterEmptyState message="Não foi possível carregar o cockpit de inteligência comercial." />
      ) : null}
      {!loading && !error ? (
        <CommandCenterGrid>
          <CommandCenterCard title="Sinais priorizados">
            {prioritizedSignals.length === 0 ? (
              <CommandCenterEmptyState message="Nenhum sinal comercial requer atenção agora." />
            ) : (
              <CommandCenterList>
                {prioritizedSignals.map((signal) => (
                  <CommandCenterRow
                    key={signal.id}
                    title={signal.name}
                    detail={`${signal.signalType} · ${signal.company?.name ?? signal.opportunity?.name ?? signal.source ?? 'Sem vínculo'}`}
                    action={
                      <>
                        <Tag color={getTone(signal.status)} text={signal.status} />
                        <Button
                          title={signal.status === 'NEW' ? 'Analisar' : 'Tratar'}
                          size="small"
                          variant="secondary"
                          disabled={isUpdating}
                          onClick={() =>
                            void changeSignalStatus(
                              signal.id,
                              signal.status === 'NEW' ? 'IN_REVIEW' : 'ACTIONED',
                            )
                          }
                        />
                      </>
                    }
                  />
                ))}
              </CommandCenterList>
            )}
          </CommandCenterCard>
          <CommandCenterCard title="Oportunidades por pontuação">
            {rankedOpportunities.length === 0 ? (
              <CommandCenterEmptyState message="Nenhuma oportunidade elegível para priorização." />
            ) : (
              <CommandCenterList>
                {rankedOpportunities.map((opportunity) => (
                  <CommandCenterRow
                    key={opportunity.id}
                    title={opportunity.name ?? 'Oportunidade sem nome'}
                    detail={`${opportunity.company?.name ?? 'Sem empresa'} · ${opportunity.stage ?? 'Sem etapa'} · ${formatCurrency(opportunity.amount)}`}
                    action={
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
                    }
                  />
                ))}
              </CommandCenterList>
            )}
          </CommandCenterCard>
        </CommandCenterGrid>
      ) : null}
    </CommandCenterPage>
  );
};
