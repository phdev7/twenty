import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';

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
import { CustomerSuccessHandoff } from '@/diex-command-centers/customer-success/CustomerSuccessHandoff';
import { CustomerSuccessPlanOperation } from '@/diex-command-centers/customer-success/CustomerSuccessPlanOperation';
import { useCustomerSuccessCommandCenter } from '@/diex-command-centers/customer-success/useCustomerSuccessCommandCenter';
import {
  LIFECYCLE_STAGES,
  daysUntil,
  formatMoney,
  formatPlanMoney,
  getDatePressureLabel,
  getRecordName,
  healthColor,
  healthLabel,
  isRiskPlan,
  lifecycleLabel,
  moneyAmount,
} from '@/diex-command-centers/customer-success/utils';
import { Button, Tag } from 'twenty-ui';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledJourney = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  overflow-x: auto;
`;
const StyledJourneyButton = styled.button<{ selected: boolean }>`
  background: ${({ selected }) =>
    selected
      ? themeCssVariables.background.transparent.blue
      : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ selected }) =>
      selected
        ? themeCssVariables.border.color.blue
        : themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  min-height: 90px;
  text-align: left;
`;
const StyledStageName = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  margin: ${themeCssVariables.spacing[2]};
`;
const StyledStageValue = styled.p`
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: ${themeCssVariables.spacing[2]};
`;
const StyledStageNote = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin: ${themeCssVariables.spacing[2]};
`;

const filters = [
  ['ALL', 'Todos'],
  ['RISK', 'Risco'],
  ['RENEWAL', 'Renovação'],
  ['EXPANSION', 'Expansão'],
  ['OVERDUE', 'Revisão vencida'],
] as const;

export const CustomerSuccessCommandCenterPage = () => {
  const {
    plans,
    handoffOpportunities,
    workspaceMembers,
    currentWorkspaceMemberId,
    isLoading,
    errorMessage,
    load,
  } = useCustomerSuccessCommandCenter();
  const [filter, setFilter] = useState('ALL');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const metrics = useMemo(() => {
    const currencyCounts = plans.reduce<Record<string, number>>(
      (counts, plan) => {
        const currency = plan.recurringRevenue?.currencyCode?.trim();
        if (currency) counts[currency] = (counts[currency] ?? 0) + 1;
        return counts;
      },
      {},
    );
    const primaryCurrency =
      Object.entries(currencyCounts).sort(
        ([, left], [, right]) => right - left,
      )[0]?.[0] ?? 'BRL';
    const plansInCurrency = plans.filter(
      (plan) =>
        (plan.recurringRevenue?.currencyCode?.trim() || primaryCurrency) ===
        primaryCurrency,
    );
    const renewalsIn90Days = plans.filter((plan) => {
      const days = daysUntil(plan.renewalDate);
      return days !== null && days >= 0 && days <= 90;
    });
    const overdueReviews = plans.filter(
      (plan) => (daysUntil(plan.nextReviewAt) ?? 0) < 0,
    );
    return {
      primaryCurrency,
      totalRevenue: plansInCurrency.reduce(
        (total, plan) => total + moneyAmount(plan.recurringRevenue),
        0,
      ),
      riskRevenue: plansInCurrency
        .filter(isRiskPlan)
        .reduce((total, plan) => total + moneyAmount(plan.recurringRevenue), 0),
      renewalsIn90Days,
      overdueReviews,
      healthy: plans.filter(({ health }) => health === 'HEALTHY').length,
      attention: plans.filter(({ health }) => health === 'ATTENTION').length,
      critical: plans.filter(({ health }) => health === 'CRITICAL').length,
    };
  }, [plans]);
  const visiblePlans = useMemo(() => {
    const selected = plans.filter((plan) => {
      if (filter === 'RISK') return isRiskPlan(plan);
      if (filter === 'RENEWAL') {
        const days = daysUntil(plan.renewalDate);
        return days !== null && days >= 0 && days <= 90;
      }
      if (filter === 'EXPANSION')
        return plan.expansionSignal === true || plan.lifecycle === 'EXPANSION';
      if (filter === 'OVERDUE') return (daysUntil(plan.nextReviewAt) ?? 0) < 0;
      if (LIFECYCLE_STAGES.some(([value]) => value === filter))
        return plan.lifecycle === filter;
      return true;
    });
    const priority = (plan: (typeof plans)[number]) => {
      const renewalDays = daysUntil(plan.renewalDate);
      const reviewDays = daysUntil(plan.nextReviewAt);
      return (
        (plan.health === 'CRITICAL'
          ? 500
          : plan.health === 'ATTENTION'
            ? 350
            : plan.health === 'UNKNOWN'
              ? 120
              : 0) +
        (reviewDays !== null && reviewDays < 0 ? 100 : 0) +
        (renewalDays !== null && renewalDays >= 0 && renewalDays <= 90
          ? 90 - renewalDays
          : 0)
      );
    };
    return [...selected].sort(
      (left, right) => priority(right) - priority(left),
    );
  }, [filter, plans]);
  const selectedPlan =
    plans.find(({ id }) => id === selectedPlanId) ?? visiblePlans[0] ?? null;
  const renewalHorizon = [...plans]
    .filter((plan) => (daysUntil(plan.renewalDate) ?? -31) >= -30)
    .sort(
      (left, right) =>
        new Date(left.renewalDate ?? '2999-12-31').getTime() -
        new Date(right.renewalDate ?? '2999-12-31').getTime(),
    )
    .slice(0, 6);

  return (
    <CommandCenterPage
      title="Customer Success"
      description="Saúde, adoção, valor entregue, marcos, risco e expansão ligados aos dados reais do CRM."
    >
      {isLoading && plans.length === 0 ? <CommandCenterLoadingState /> : null}
      {errorMessage ? (
        <CommandCenterCard title="Customer Success">
          <CommandCenterEmptyState message={errorMessage} />
          <Button
            title="Tentar novamente"
            size="small"
            variant="secondary"
            onClick={() => void load()}
          />
        </CommandCenterCard>
      ) : null}
      {!errorMessage ? (
        <>
          <CommandCenterCard title="Proteja receita antes que a renovação vire urgência.">
            <CommandCenterRow
              title={`${plans.length} plano${plans.length === 1 ? '' : 's'} ativo${plans.length === 1 ? '' : 's'}`}
              detail="Distribuição da saúde da carteira"
              action={
                <Button
                  title="Atualizar carteira"
                  size="small"
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() => void load()}
                />
              }
            />
            <StyledFilters>
              <Tag color="green" text={`${metrics.healthy} saudáveis`} />
              <Tag color="orange" text={`${metrics.attention} atenção`} />
              <Tag color="red" text={`${metrics.critical} críticos`} />
            </StyledFilters>
          </CommandCenterCard>
          <CommandCenterGrid>
            <CustomerSuccessHandoff
              opportunities={handoffOpportunities}
              workspaceMembers={workspaceMembers}
              currentWorkspaceMemberId={currentWorkspaceMemberId}
              onCompleted={load}
            />
          </CommandCenterGrid>
          <CommandCenterMetrics>
            <CommandCenterMetric
              label="Receita acompanhada"
              value={formatMoney(
                metrics.totalRevenue,
                metrics.primaryCurrency,
                true,
              )}
            />
            <CommandCenterMetric
              label="Receita sob risco"
              value={formatMoney(
                metrics.riskRevenue,
                metrics.primaryCurrency,
                true,
              )}
            />
            <CommandCenterMetric
              label="Renovações em 90 dias"
              value={metrics.renewalsIn90Days.length}
            />
            <CommandCenterMetric
              label="Revisões vencidas"
              value={metrics.overdueReviews.length}
            />
          </CommandCenterMetrics>
          <CommandCenterCard title="Jornada da carteira">
            <StyledFilters>
              <Button
                title="Toda a carteira"
                size="small"
                variant={filter === 'ALL' ? 'secondary' : 'tertiary'}
                onClick={() => setFilter('ALL')}
              />
            </StyledFilters>
            <StyledJourney>
              {LIFECYCLE_STAGES.map(([value, label]) => {
                const stagePlans = plans.filter(
                  ({ lifecycle }) => lifecycle === value,
                );
                return (
                  <StyledJourneyButton
                    key={value}
                    selected={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    <StyledStageName>{label}</StyledStageName>
                    <StyledStageValue>{stagePlans.length}</StyledStageValue>
                    <StyledStageNote>
                      {stagePlans.filter(isRiskPlan).length} em risco
                    </StyledStageNote>
                  </StyledJourneyButton>
                );
              })}
            </StyledJourney>
          </CommandCenterCard>
          <CommandCenterGrid>
            <CommandCenterCard title="Carteira priorizada">
              <StyledFilters>
                {filters.map(([value, label]) => (
                  <Button
                    key={value}
                    title={label}
                    size="small"
                    variant={filter === value ? 'secondary' : 'tertiary'}
                    onClick={() => setFilter(value)}
                  />
                ))}
              </StyledFilters>
              {visiblePlans.length === 0 ? (
                <CommandCenterEmptyState message="Nenhum plano encontrado neste recorte." />
              ) : (
                <CommandCenterList>
                  {visiblePlans.map((plan) => (
                    <CommandCenterRow
                      key={plan.id}
                      title={plan.name}
                      detail={`${getRecordName(plan.company) || 'Empresa não vinculada'} · ${lifecycleLabel(plan.lifecycle)} · ${formatPlanMoney(plan.recurringRevenue)} · renovação ${getDatePressureLabel(plan.renewalDate)}`}
                      action={
                        <>
                          <Tag
                            color={healthColor(plan.health)}
                            text={healthLabel(plan.health)}
                          />
                          <Button
                            title={
                              selectedPlan?.id === plan.id
                                ? 'Selecionado'
                                : 'Selecionar'
                            }
                            size="small"
                            variant="tertiary"
                            onClick={() => setSelectedPlanId(plan.id)}
                          />
                        </>
                      }
                    />
                  ))}
                </CommandCenterList>
              )}
            </CommandCenterCard>
            <CustomerSuccessPlanOperation
              plan={selectedPlan}
              onCompleted={load}
            />
          </CommandCenterGrid>
          <CommandCenterCard title="Horizonte de renovação">
            {renewalHorizon.length === 0 ? (
              <CommandCenterEmptyState message="Nenhuma renovação futura foi registrada." />
            ) : (
              <CommandCenterList>
                {renewalHorizon.map((plan) => (
                  <CommandCenterRow
                    key={plan.id}
                    title={plan.name}
                    detail={`${getRecordName(plan.company) || 'Empresa não vinculada'} · ${formatPlanMoney(plan.recurringRevenue)} · ${getDatePressureLabel(plan.renewalDate)}`}
                    action={
                      <>
                        <Tag
                          color={healthColor(plan.health)}
                          text={healthLabel(plan.health)}
                        />
                        <Button
                          title="Abrir plano"
                          size="small"
                          variant="tertiary"
                          onClick={() => {
                            setFilter('ALL');
                            setSelectedPlanId(plan.id);
                          }}
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
