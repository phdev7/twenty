import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

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
import { postLogicFunction } from '@/diex-command-centers/utils/useLogicFunctionRequest';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button, Tag } from 'twenty-ui';

const CUSTOMER_SUCCESS_QUERY = gql`
  query DiexCustomerSuccessCommandCenter {
    successPlans(first: 100, orderBy: [{ renewalDate: AscNullsLast }]) {
      edges {
        node {
          id name lifecycle health healthScore expansionSignal renewalDate nextReviewAt
          recurringRevenue { amountMicros currencyCode }
          company { id name }
          milestones { edges { node { id name status dueAt impact } } }
          aiActions { edges { node { id name status requestedAt } } }
        }
      }
    }
    opportunities(first: 100, filter: { stage: { eq: CUSTOMER } }, orderBy: [{ updatedAt: DescNullsLast }]) {
      edges { node { id name company { id name } amount { amountMicros currencyCode } } }
    }
  }
`;

type Money = { amountMicros?: number | null; currencyCode?: string | null };
type Milestone = { id: string; name: string; status: string; dueAt?: string | null };
type SuccessPlan = {
  id: string;
  name: string;
  lifecycle?: string | null;
  health?: string | null;
  healthScore?: number | null;
  expansionSignal?: boolean | null;
  renewalDate?: string | null;
  nextReviewAt?: string | null;
  recurringRevenue?: Money | null;
  company?: { id: string; name?: string | null } | null;
  milestones?: { edges?: Array<{ node: Milestone }> } | null;
  aiActions?: { edges?: Array<{ node: { id: string; name: string; status: string } }> } | null;
};
type HandoffOpportunity = {
  id: string;
  name?: string | null;
  company?: { id: string; name?: string | null } | null;
  amount?: Money | null;
};
type CustomerSuccessData = {
  successPlans?: { edges?: Array<{ node: SuccessPlan }> };
  opportunities?: { edges?: Array<{ node: HandoffOpportunity }> };
};

const daysUntil = (date?: string | null): number | null => {
  if (!date) return null;
  const value = new Date(date).getTime();
  return Number.isNaN(value) ? null : Math.ceil((value - Date.now()) / 86_400_000);
};

const formatMoney = (money?: Money | null): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: money?.currencyCode ?? 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format((money?.amountMicros ?? 0) / 1_000_000);

const healthColor = (health?: string | null): 'green' | 'orange' | 'red' | 'gray' =>
  health === 'HEALTHY' ? 'green' : health === 'CRITICAL' ? 'red' : health === 'ATTENTION' ? 'orange' : 'gray';

export const CustomerSuccessCommandCenterPage = () => {
  const { data, loading, error, refetch } = useQuery<CustomerSuccessData>(CUSTOMER_SUCCESS_QUERY);
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const plans = data?.successPlans?.edges?.map(({ node }) => node) ?? [];
  const handoffOpportunities = data?.opportunities?.edges?.map(({ node }) => node) ?? [];
  const riskPlans = plans.filter(({ health, lifecycle }) =>
    health === 'ATTENTION' || health === 'CRITICAL' || lifecycle === 'AT_RISK',
  );
  const renewalsIn90Days = plans.filter((plan) => {
    const days = daysUntil(plan.renewalDate);
    return days !== null && days >= 0 && days <= 90;
  });
  const overdueReviews = plans.filter((plan) => (daysUntil(plan.nextReviewAt) ?? 0) < 0);
  const prioritizedPlans = [...plans]
    .sort((left, right) => {
      const leftRisk = healthColor(left.health) === 'red' ? 2 : healthColor(left.health) === 'orange' ? 1 : 0;
      const rightRisk = healthColor(right.health) === 'red' ? 2 : healthColor(right.health) === 'orange' ? 1 : 0;
      return rightRisk - leftRisk || (daysUntil(left.renewalDate) ?? 9999) - (daysUntil(right.renewalDate) ?? 9999);
    })
    .slice(0, 12);

  const previewReview = async (successPlanId: string) => {
    try {
      await postLogicFunction<{ summary: string }>('/diex/customer-success/review', {
        successPlanId,
        mode: 'PREVIEW',
      });
      enqueueSuccessSnackBar({ message: 'Prévia da revisão concluída sem alterar o plano.' });
    } catch {
      enqueueErrorSnackBar({ message: 'Não foi possível revisar este plano de sucesso.' });
    }
  };

  return (
    <CommandCenterPage title="Customer Success" description="Carteira, saúde do cliente, marcos e renovação em uma operação priorizada.">
      <CommandCenterMetrics>
        <CommandCenterMetric label="Planos ativos" value={plans.length} />
        <CommandCenterMetric label="Em risco" value={riskPlans.length} />
        <CommandCenterMetric label="Renovam em 90 dias" value={renewalsIn90Days.length} />
        <CommandCenterMetric label="Revisões vencidas" value={overdueReviews.length} />
      </CommandCenterMetrics>
      {loading ? <CommandCenterLoadingState /> : null}
      {error ? <CommandCenterEmptyState message="Não foi possível carregar Customer Success." /> : null}
      {!loading && !error ? <CommandCenterGrid>
        <CommandCenterCard title="Carteira priorizada">
          {prioritizedPlans.length === 0 ? <CommandCenterEmptyState message="Nenhum plano encontrado neste recorte." /> : <CommandCenterList>
            {prioritizedPlans.map((plan) => {
              const pendingMilestones = plan.milestones?.edges?.filter(({ node }) => node.status !== 'COMPLETED').length ?? 0;
              return <CommandCenterRow key={plan.id} title={plan.name} detail={`${plan.company?.name ?? 'Empresa não vinculada'} · ${formatMoney(plan.recurringRevenue)} · ${pendingMilestones} marco(s) em aberto`} action={<><Tag color={healthColor(plan.health)} text={plan.health ?? 'UNKNOWN'} /><Button title="Abrir" size="small" variant="tertiary" onClick={() => openRecordInSidePanel({ recordId: plan.id, objectNameSingular: 'successPlan' })} /><Button title="Revisar" size="small" variant="secondary" onClick={() => void previewReview(plan.id)} /></>} />;
            })}
          </CommandCenterList>}
        </CommandCenterCard>
        <CommandCenterCard title="Entrada de novos clientes">
          {handoffOpportunities.length === 0 ? <CommandCenterEmptyState message="Nenhuma oportunidade em Fechado ganho está sem plano de sucesso." /> : <CommandCenterList>
            {handoffOpportunities.map((opportunity) => <CommandCenterRow key={opportunity.id} title={opportunity.name ?? 'Oportunidade sem nome'} detail={`${opportunity.company?.name ?? 'Empresa não vinculada'} · ${formatMoney(opportunity.amount)}`} action={<Button title="Abrir venda" size="small" variant="tertiary" onClick={() => openRecordInSidePanel({ recordId: opportunity.id, objectNameSingular: 'opportunity' })} />} />)}
          </CommandCenterList>}
        </CommandCenterCard>
      </CommandCenterGrid> : null}
    </CommandCenterPage>
  );
};
