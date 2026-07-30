import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconClock,
  IconCurrencyReal,
  IconHeart,
  IconRefresh,
  IconTimelineEvent,
  IconTrendingUp,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { CUSTOMER_SUCCESS_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import { HandoffPanel } from 'src/modules/customer-success-command-center/front-components/components/handoff-panel';
import { MetricCard } from 'src/modules/customer-success-command-center/front-components/components/metric-card';
import { PlanDetail } from 'src/modules/customer-success-command-center/front-components/components/plan-detail';
import { PortfolioList } from 'src/modules/customer-success-command-center/front-components/components/portfolio-list';
import { customerSuccessCommandCenterStyles as styles } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.styles';
import {
  type CustomerSuccessHandoffDraft,
  type CustomerSuccessMilestoneActionDraft,
  type CustomerSuccessPlan,
} from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.types';
import { useCustomerSuccessCommandCenter } from 'src/modules/customer-success-command-center/front-components/use-customer-success-command-center';
import {
  LIFECYCLE_STAGES,
  buildHandoffDraft,
  daysUntil,
  formatDate,
  formatMoney,
  formatPlanMoney,
  getDatePressureLabel,
  getHealthLabel,
  getHealthTone,
  getRecordName,
  isRiskPlan,
  moneyAmount,
} from 'src/modules/customer-success-command-center/front-components/utils/customer-success-formatters';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Skeleton,
} from 'src/ui/shadcn-twenty';

export const CustomerSuccessCommandCenterFrontComponent = () => {
  const {
    plans,
    handoffOpportunities,
    workspaceMembers,
    currentWorkspaceMemberId,
    reviews,
    handoffPreviews,
    milestoneActionPreviews,
    isLoading,
    busyReview,
    busyHandoff,
    busyMilestoneAction,
    errorMessage,
    load,
    reviewPlan,
    previewHandoff,
    confirmHandoff,
    clearHandoffPreview,
    previewMilestoneAction,
    confirmMilestoneAction,
    clearMilestoneActionPreview,
  } = useCustomerSuccessCommandCenter();
  const [filter, setFilter] = useState('ALL');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedHandoffOpportunityId, setSelectedHandoffOpportunityId] =
    useState<string | null>(null);
  const [handoffDraft, setHandoffDraft] =
    useState<CustomerSuccessHandoffDraft | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null,
  );
  const [milestoneActionDraft, setMilestoneActionDraft] =
    useState<CustomerSuccessMilestoneActionDraft>({
      action: 'START',
      outcome: '',
      evidence: '',
      impact: 'RATING_3',
    });

  const metrics = useMemo(() => {
    const currencyCounts = plans.reduce<Record<string, number>>(
      (counts, plan) => {
        const code = plan.recurringRevenue?.currencyCode?.trim();

        if (code) {
          counts[code] = (counts[code] ?? 0) + 1;
        }

        return counts;
      },
      {},
    );
    const primaryCurrency =
      Object.entries(currencyCounts).sort(
        ([, leftCount], [, rightCount]) => rightCount - leftCount,
      )[0]?.[0] ?? 'BRL';
    const plansInPrimaryCurrency = plans.filter(
      (plan) =>
        (plan.recurringRevenue?.currencyCode?.trim() || primaryCurrency) ===
        primaryCurrency,
    );
    const totalRevenue = plansInPrimaryCurrency.reduce(
      (total, plan) => total + moneyAmount(plan.recurringRevenue),
      0,
    );
    const riskRevenue = plansInPrimaryCurrency
      .filter(isRiskPlan)
      .reduce((total, plan) => total + moneyAmount(plan.recurringRevenue), 0);
    const renewalsIn90Days = plans.filter((plan) => {
      const days = daysUntil(plan.renewalDate);

      return days !== null && days >= 0 && days <= 90;
    });
    const overdueReviews = plans.filter((plan) => {
      const days = daysUntil(plan.nextReviewAt);

      return days !== null && days < 0;
    });
    const healthCounts = {
      healthy: plans.filter(({ health }) => health === 'HEALTHY').length,
      attention: plans.filter(({ health }) => health === 'ATTENTION').length,
      critical: plans.filter(({ health }) => health === 'CRITICAL').length,
      unknown: plans.filter(({ health }) => !health || health === 'UNKNOWN')
        .length,
    };

    return {
      primaryCurrency,
      totalRevenue,
      riskRevenue,
      renewalsIn90Days,
      overdueReviews,
      healthCounts,
    };
  }, [plans]);

  const visiblePlans = useMemo(() => {
    const filtered = plans.filter((plan) => {
      if (filter === 'RISK') {
        return isRiskPlan(plan);
      }

      if (filter === 'RENEWAL') {
        const days = daysUntil(plan.renewalDate);

        return days !== null && days >= 0 && days <= 90;
      }

      if (filter === 'EXPANSION') {
        return plan.expansionSignal === true || plan.lifecycle === 'EXPANSION';
      }

      if (filter === 'OVERDUE') {
        const days = daysUntil(plan.nextReviewAt);

        return days !== null && days < 0;
      }

      if (LIFECYCLE_STAGES.some(([value]) => value === filter)) {
        return plan.lifecycle === filter;
      }

      return true;
    });

    return [...filtered].sort((left, right) => {
      const priority = (plan: CustomerSuccessPlan): number => {
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

      return priority(right) - priority(left);
    });
  }, [filter, plans]);

  const selectedHandoffOpportunity =
    handoffOpportunities.find(
      ({ id }) => id === selectedHandoffOpportunityId,
    ) ??
    handoffOpportunities[0] ??
    null;
  const handoffPreview = selectedHandoffOpportunity
    ? (handoffPreviews[selectedHandoffOpportunity.id] ?? null)
    : null;
  const selectedPlan =
    plans.find(({ id }) => id === selectedPlanId) ?? visiblePlans[0] ?? null;
  const selectedReview = selectedPlan ? reviews[selectedPlan.id] : undefined;
  const selectedMilestones = useMemo(
    () =>
      selectedPlan
        ? [...selectedPlan.milestones].sort((left, right) => {
            const leftCompleted = left.status === 'COMPLETED' ? 1 : 0;
            const rightCompleted = right.status === 'COMPLETED' ? 1 : 0;

            if (leftCompleted !== rightCompleted) {
              return leftCompleted - rightCompleted;
            }

            return (
              new Date(left.dueAt ?? '2999-12-31').getTime() -
              new Date(right.dueAt ?? '2999-12-31').getTime()
            );
          })
        : [],
    [selectedPlan],
  );
  const selectedMilestone =
    selectedMilestones.find(({ id }) => id === selectedMilestoneId) ??
    selectedMilestones.find(
      ({ status }) => status !== 'COMPLETED' && status !== 'CANCELLED',
    ) ??
    selectedMilestones[0] ??
    null;
  const milestoneActionPreview = selectedMilestone
    ? (milestoneActionPreviews[selectedMilestone.id] ?? null)
    : null;
  const renewalHorizon = useMemo(
    () =>
      plans
        .filter((plan) => {
          const days = daysUntil(plan.renewalDate);

          return days !== null && days >= -30;
        })
        .sort(
          (left, right) =>
            new Date(left.renewalDate ?? '2999-12-31').getTime() -
            new Date(right.renewalDate ?? '2999-12-31').getTime(),
        )
        .slice(0, 6),
    [plans],
  );

  useEffect(() => {
    if (
      selectedHandoffOpportunityId === null ||
      !handoffOpportunities.some(
        ({ id }) => id === selectedHandoffOpportunityId,
      )
    ) {
      setSelectedHandoffOpportunityId(handoffOpportunities[0]?.id ?? null);
    }
  }, [handoffOpportunities, selectedHandoffOpportunityId]);

  useEffect(() => {
    if (!selectedHandoffOpportunity) {
      setHandoffDraft(null);

      return;
    }

    setHandoffDraft(
      buildHandoffDraft({
        opportunity: selectedHandoffOpportunity,
        currentWorkspaceMemberId,
        fallbackOwnerId: workspaceMembers[0]?.id ?? '',
      }),
    );
  }, [currentWorkspaceMemberId, selectedHandoffOpportunity, workspaceMembers]);

  useEffect(() => {
    if (
      selectedPlanId === null ||
      !visiblePlans.some(({ id }) => id === selectedPlanId)
    ) {
      setSelectedPlanId(visiblePlans[0]?.id ?? null);
    }
  }, [selectedPlanId, visiblePlans]);

  useEffect(() => {
    if (
      selectedMilestoneId === null ||
      !selectedMilestones.some(({ id }) => id === selectedMilestoneId)
    ) {
      setSelectedMilestoneId(
        selectedMilestones.find(
          ({ status }) => status !== 'COMPLETED' && status !== 'CANCELLED',
        )?.id ??
          selectedMilestones[0]?.id ??
          null,
      );
    }
  }, [selectedMilestoneId, selectedMilestones]);

  useEffect(() => {
    if (!selectedMilestone) {
      return;
    }

    setMilestoneActionDraft({
      action: selectedMilestone.status === 'IN_PROGRESS' ? 'COMPLETE' : 'START',
      outcome: selectedMilestone.outcome?.markdown?.trim() || '',
      evidence: selectedMilestone.evidence?.markdown?.trim() || '',
      impact: selectedMilestone.impact || 'RATING_3',
    });
  }, [selectedMilestone?.id, selectedMilestone?.status]);

  const updateHandoffDraft = (
    patch: Partial<CustomerSuccessHandoffDraft>,
  ): void => {
    if (!selectedHandoffOpportunity) {
      return;
    }

    clearHandoffPreview(selectedHandoffOpportunity.id);
    setHandoffDraft((current) =>
      current
        ? {
            ...current,
            ...patch,
          }
        : current,
    );
  };

  const updateMilestoneActionDraft = (
    patch: Partial<CustomerSuccessMilestoneActionDraft>,
  ): void => {
    if (!selectedMilestone) {
      return;
    }

    clearMilestoneActionPreview(selectedMilestone.id);
    setMilestoneActionDraft((current) => ({
      ...current,
      ...patch,
    }));
  };

  const totalForRing = Math.max(plans.length, 1);
  const healthyEnd = (metrics.healthCounts.healthy / totalForRing) * 360;
  const attentionEnd =
    healthyEnd + (metrics.healthCounts.attention / totalForRing) * 360;
  const criticalEnd =
    attentionEnd + (metrics.healthCounts.critical / totalForRing) * 360;
  const healthRingBackground = `conic-gradient(
    ${themeCssVariables.color.green} 0deg ${healthyEnd}deg,
    ${themeCssVariables.color.orange} ${healthyEnd}deg ${attentionEnd}deg,
    ${themeCssVariables.color.red} ${attentionEnd}deg ${criticalEnd}deg,
    ${themeCssVariables.color.gray} ${criticalEnd}deg 360deg
  )`;

  if (isLoading && plans.length === 0) {
    return (
      <div style={styles.root}>
        <Skeleton style={{ minHeight: 220 }} />
        <div style={styles.metricGrid}>
          <Skeleton style={{ minHeight: 104 }} />
          <Skeleton style={{ minHeight: 104 }} />
          <Skeleton style={{ minHeight: 104 }} />
          <Skeleton style={{ minHeight: 104 }} />
        </div>
        <Skeleton style={{ minHeight: 120 }} />
        <div style={styles.workspaceGrid}>
          <Skeleton style={{ minHeight: 360 }} />
          <Skeleton style={{ minHeight: 360 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Card style={styles.hero}>
        <div style={styles.heroCopy}>
          <div>
            <p style={styles.eyebrow}>
              <IconHeart
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              Customer Success
            </p>
            <h1 style={styles.title}>
              Proteja receita antes que a renovação vire urgência.
            </h1>
            <p style={styles.subtitle}>
              Saúde, adoção, valor entregue, marcos, risco e expansão em uma
              jornada única ligada aos dados reais do CRM.
            </p>
          </div>
          <div style={styles.heroActions}>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => void load()}
            >
              <IconRefresh
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              Atualizar carteira
            </Button>
            <Badge tone="blue">
              {plans.length} plano{plans.length === 1 ? '' : 's'} ativo
              {plans.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </div>
        <div style={styles.healthPulse}>
          <div
            aria-label="Distribuição da saúde da carteira"
            style={{
              ...styles.healthRing,
              background: healthRingBackground,
            }}
          >
            <div style={styles.healthRingCenter}>
              <span style={styles.healthRingValue}>
                {metrics.healthCounts.healthy}
              </span>
              <span style={styles.smallMuted}>saudáveis</span>
            </div>
          </div>
          <div style={styles.planMeta}>
            <Badge tone="green">{metrics.healthCounts.healthy} saudáveis</Badge>
            <Badge tone="orange">
              {metrics.healthCounts.attention} atenção
            </Badge>
            <Badge tone="red">{metrics.healthCounts.critical} críticos</Badge>
          </div>
        </div>
      </Card>

      {errorMessage ? (
        <Card variant="danger">
          <CardContent style={{ paddingTop: themeCssVariables.spacing[4] }}>
            {errorMessage}
          </CardContent>
        </Card>
      ) : null}

      <HandoffPanel
        opportunities={handoffOpportunities}
        selectedOpportunity={selectedHandoffOpportunity}
        draft={handoffDraft}
        preview={handoffPreview}
        workspaceMembers={workspaceMembers}
        busyHandoff={busyHandoff}
        onSelectOpportunity={setSelectedHandoffOpportunityId}
        onDraftChange={updateHandoffDraft}
        onPreview={previewHandoff}
        onConfirm={confirmHandoff}
      />

      <section style={styles.metricGrid}>
        <MetricCard
          label="Receita acompanhada"
          value={formatMoney(
            metrics.totalRevenue,
            metrics.primaryCurrency,
            true,
          )}
          note={`moeda principal: ${metrics.primaryCurrency}`}
          tone="blue"
          icon={
            <IconCurrencyReal
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <MetricCard
          label="Receita sob risco"
          value={formatMoney(
            metrics.riskRevenue,
            metrics.primaryCurrency,
            true,
          )}
          note={`${plans.filter(isRiskPlan).length} cliente(s) exigem intervenção`}
          tone={metrics.riskRevenue > 0 ? 'red' : 'green'}
          icon={
            <IconAlertTriangle
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <MetricCard
          label="Renovações em 90 dias"
          value={metrics.renewalsIn90Days.length}
          note="janela que exige prova de valor"
          tone="orange"
          icon={
            <IconCalendarDue
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <MetricCard
          label="Revisões vencidas"
          value={metrics.overdueReviews.length}
          note="planos sem cadência atualizada"
          tone={metrics.overdueReviews.length > 0 ? 'red' : 'green'}
          icon={
            <IconClock
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
      </section>

      <Card style={styles.journeyCard}>
        <div style={styles.sectionHeading}>
          <div>
            <CardTitle>Jornada da carteira</CardTitle>
            <CardDescription>
              Clique em uma etapa para isolar os clientes e a receita que exigem
              movimento.
            </CardDescription>
          </div>
          <Button
            variant={filter === 'ALL' ? 'default' : 'ghost'}
            onClick={() => setFilter('ALL')}
          >
            Toda a carteira
          </Button>
        </div>
        <div style={styles.journeyTrack}>
          {LIFECYCLE_STAGES.map(([value, label]) => {
            const stagePlans = plans.filter(
              ({ lifecycle }) => lifecycle === value,
            );

            return (
              <button
                key={value}
                type="button"
                style={{
                  ...styles.journeyStage,
                  ...(filter === value ? styles.journeyStageSelected : {}),
                }}
                onClick={() => setFilter(value)}
              >
                <p style={styles.metricLabel}>{label}</p>
                <p style={styles.journeyCount}>{stagePlans.length}</p>
                <p style={styles.smallMuted}>
                  {stagePlans.filter(isRiskPlan).length} em risco
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      <section style={styles.workspaceGrid}>
        <PortfolioList
          plans={visiblePlans}
          selectedPlanId={selectedPlan?.id ?? null}
          filter={filter}
          onFilterChange={setFilter}
          onSelectPlan={setSelectedPlanId}
        />

        <PlanDetail
          selectedPlan={selectedPlan}
          selectedReview={selectedReview}
          selectedMilestones={selectedMilestones}
          selectedMilestone={selectedMilestone}
          milestoneActionDraft={milestoneActionDraft}
          milestoneActionPreview={milestoneActionPreview}
          busyMilestoneAction={busyMilestoneAction}
          busyReview={busyReview}
          onSelectMilestone={setSelectedMilestoneId}
          onMilestoneDraftChange={updateMilestoneActionDraft}
          onMilestonePreview={previewMilestoneAction}
          onMilestoneConfirm={confirmMilestoneAction}
          onReviewPlan={reviewPlan}
          isLoading={isLoading}
        />
      </section>

      <section>
        <div style={styles.sectionHeading}>
          <div>
            <CardTitle>Horizonte de renovação</CardTitle>
            <CardDescription>
              Próximos contratos para provar valor, recuperar saúde ou preparar
              expansão.
            </CardDescription>
          </div>
          <Badge tone="orange">
            <IconTimelineEvent
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            próximos movimentos
          </Badge>
        </div>
        <div style={styles.renewalGrid}>
          {renewalHorizon.length === 0 ? (
            <Card style={{ gridColumn: '1 / -1' }}>
              <div style={styles.empty}>
                Nenhuma renovação futura foi registrada.
              </div>
            </Card>
          ) : (
            renewalHorizon.map((plan) => (
              <Card
                key={plan.id}
                variant={isRiskPlan(plan) ? 'danger' : 'muted'}
                style={styles.renewalCard}
                onClick={() => {
                  setFilter('ALL');
                  setSelectedPlanId(plan.id);
                }}
              >
                <div style={styles.planTop}>
                  <p style={styles.renewalDate}>
                    {formatDate(plan.renewalDate)}
                  </p>
                  <Badge tone={getHealthTone(plan.health)}>
                    {getHealthLabel(plan.health)}
                  </Badge>
                </div>
                <CardTitle style={{ marginTop: themeCssVariables.spacing[3] }}>
                  {plan.name}
                </CardTitle>
                <CardDescription>
                  {getRecordName(plan.company) || 'Empresa não vinculada'}
                </CardDescription>
                <div style={styles.planMeta}>
                  <span>{getDatePressureLabel(plan.renewalDate)}</span>
                  <span>
                    <IconTrendingUp
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />{' '}
                    {formatPlanMoney(plan.recurringRevenue)}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier:
    CUSTOMER_SUCCESS_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-customer-success-command-center',
  description:
    'Portfolio visual de Customer Success para proteger receita, revisar saúde e governar intervenções.',
  component: CustomerSuccessCommandCenterFrontComponent,
});
