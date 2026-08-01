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

const RENEWAL_QUERY = gql`
  query DiexRenewalCommandCenter {
    customerRenewals(first: 200, orderBy: [{ targetDate: AscNullsLast }]) {
      edges {
        node {
          id name stage risk forecast probability targetDate nextAction nextActionAt lastTouchAt
          renewalValue { amountMicros currencyCode }
          successPlan { id name }
          company { id name }
          owner { id name { firstName lastName } }
          renewalEvents { edges { node { id eventType summary occurredAt } } }
        }
      }
    }
    successPlans(first: 200, orderBy: [{ renewalDate: AscNullsLast }]) {
      edges { node { id name health renewalDate recurringRevenue { amountMicros currencyCode } company { id name } } }
    }
  }
`;

const UPDATE_RENEWAL = gql`
  mutation DiexRecordRenewalTouch($id: UUID!, $data: CustomerRenewalUpdateInput!) {
    updateCustomerRenewal(id: $id, data: $data) { id }
  }
`;

type Money = { amountMicros?: number | null; currencyCode?: string | null };
type Renewal = {
  id: string;
  name: string;
  stage: string;
  risk: string;
  forecast: string;
  probability?: number | null;
  targetDate?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  lastTouchAt?: string | null;
  renewalValue?: Money | null;
  successPlan?: { id: string; name: string } | null;
  company?: { id: string; name?: string | null } | null;
  owner?: { id: string; name?: { firstName?: string | null; lastName?: string | null } | null } | null;
};
type SuccessPlan = { id: string; name: string; health?: string | null; renewalDate?: string | null; company?: { name?: string | null } | null };
type RenewalData = {
  customerRenewals?: { edges?: Array<{ node: Renewal }> };
  successPlans?: { edges?: Array<{ node: SuccessPlan }> };
};

const formatMoney = (money?: Money | null): string => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: money?.currencyCode ?? 'BRL', notation: 'compact', maximumFractionDigits: 1,
}).format((money?.amountMicros ?? 0) / 1_000_000);

const daysUntil = (date?: string | null): number | null => {
  if (!date) return null;
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? null : Math.ceil((timestamp - Date.now()) / 86_400_000);
};

const toneForRisk = (risk: string): 'green' | 'orange' | 'red' | 'gray' =>
  risk === 'CRITICAL' || risk === 'HIGH' ? 'red' : risk === 'MEDIUM' ? 'orange' : risk === 'LOW' ? 'green' : 'gray';

export const RenewalCommandCenterPage = () => {
  const { data, loading, error, refetch } = useQuery<RenewalData>(RENEWAL_QUERY);
  const [updateRenewal, { loading: isSaving }] = useMutation(UPDATE_RENEWAL);
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const renewals = data?.customerRenewals?.edges?.map(({ node }) => node) ?? [];
  const successPlans = data?.successPlans?.edges?.map(({ node }) => node) ?? [];
  const activeRenewals = renewals.filter(({ stage }) => ['PLANNING', 'VALUE_PROOF', 'NEGOTIATION', 'COMMITMENT'].includes(stage));
  const atRisk = activeRenewals.filter(({ risk }) => risk === 'HIGH' || risk === 'CRITICAL');
  const dueIn90Days = activeRenewals.filter((renewal) => {
    const days = daysUntil(renewal.targetDate);
    return days !== null && days >= 0 && days <= 90;
  });
  const weightedForecast = activeRenewals.reduce((sum, renewal) => sum + ((renewal.renewalValue?.amountMicros ?? 0) * Math.max(0, Math.min(100, renewal.probability ?? 0))) / 100, 0);

  const recordTouch = async (renewalId: string) => {
    try {
      await updateRenewal({ variables: { id: renewalId, data: { lastTouchAt: new Date().toISOString() } } });
      await refetch();
      enqueueSuccessSnackBar({ message: 'Contato registrado no histórico da renovação.' });
    } catch {
      enqueueErrorSnackBar({ message: 'Não foi possível registrar o contato.' });
    }
  };

  return (
    <CommandCenterPage title="Renovações" description="Acompanhamento de valor, risco, previsão e próximos passos de cada renovação.">
      <CommandCenterMetrics>
        <CommandCenterMetric label="Renovações ativas" value={activeRenewals.length} />
        <CommandCenterMetric label="Em risco" value={atRisk.length} />
        <CommandCenterMetric label="Vencem em 90 dias" value={dueIn90Days.length} />
        <CommandCenterMetric label="Forecast ponderado" value={formatMoney({ amountMicros: weightedForecast })} />
      </CommandCenterMetrics>
      {loading ? <CommandCenterLoadingState /> : null}
      {error ? <CommandCenterEmptyState message="Não foi possível carregar o Centro de Renovações." /> : null}
      {!loading && !error ? <CommandCenterGrid>
        <CommandCenterCard title="Workbench de renovações">
          {renewals.length === 0 ? <CommandCenterEmptyState message="Nenhuma renovação foi criada ainda." /> : <CommandCenterList>
            {renewals.map((renewal) => <CommandCenterRow key={renewal.id} title={renewal.name} detail={`${renewal.company?.name ?? 'Empresa não vinculada'} · ${formatMoney(renewal.renewalValue)} · próxima ação: ${renewal.nextAction ?? 'não definida'}`} action={<><Tag color={toneForRisk(renewal.risk)} text={`risco ${renewal.risk}`} /><Button title="Contato" size="small" variant="secondary" disabled={isSaving} onClick={() => void recordTouch(renewal.id)} /><Button title="Abrir" size="small" variant="tertiary" onClick={() => openRecordInSidePanel({ recordId: renewal.id, objectNameSingular: 'customerRenewal' })} /></>} />)}
          </CommandCenterList>}
        </CommandCenterCard>
        <CommandCenterCard title="Planos de sucesso sem renovação">
          {successPlans.filter((plan) => !renewals.some((renewal) => renewal.successPlan?.id === plan.id)).length === 0 ? <CommandCenterEmptyState message="Todos os planos já estão cobertos por uma renovação." /> : <CommandCenterList>
            {successPlans.filter((plan) => !renewals.some((renewal) => renewal.successPlan?.id === plan.id)).slice(0, 12).map((plan) => <CommandCenterRow key={plan.id} title={plan.name} detail={`${plan.company?.name ?? 'Empresa não vinculada'} · renovação ${plan.renewalDate ?? 'sem data'}`} action={<Button title="Abrir plano" size="small" variant="tertiary" onClick={() => openRecordInSidePanel({ recordId: plan.id, objectNameSingular: 'successPlan' })} />} />)}
          </CommandCenterList>}
        </CommandCenterCard>
      </CommandCenterGrid> : null}
    </CommandCenterPage>
  );
};
