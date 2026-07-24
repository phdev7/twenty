import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  SidePanelPages,
  enqueueSnackbar,
  openSidePanelPage,
} from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconCheck,
  IconClock,
  IconCurrencyReal,
  IconExternalLink,
  IconFlag,
  IconHeart,
  IconRefresh,
  IconRobot,
  IconTarget,
  IconTimelineEvent,
  IconTrendingUp,
  IconUsers,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { CUSTOMER_SUCCESS_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';
import { customerSuccessCommandCenterStyles as styles } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.styles';
import {
  type CustomerSuccessMoney,
  type CustomerSuccessPlan,
  type CustomerSuccessRecordReference,
} from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.types';
import { useCustomerSuccessCommandCenter } from 'src/modules/customer-success-command-center/front-components/use-customer-success-command-center';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
} from 'src/ui/shadcn-twenty';

type BadgeTone =
  'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'turquoise' | 'gray';

const LIFECYCLE_STAGES = [
  ['ONBOARDING', 'Onboarding'],
  ['ADOPTION', 'Adoção'],
  ['VALUE_DELIVERED', 'Valor entregue'],
  ['EXPANSION', 'Expansão'],
  ['RENEWAL', 'Renovação'],
  ['AT_RISK', 'Em risco'],
] as const;

const getRecordName = (
  record?: CustomerSuccessRecordReference | null,
): string => {
  if (!record?.name) {
    return '';
  }

  if (typeof record.name === 'string') {
    return record.name;
  }

  return [record.name.firstName, record.name.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const getHealthLabel = (health?: string | null): string =>
  ({
    UNKNOWN: 'Sem diagnóstico',
    HEALTHY: 'Saudável',
    ATTENTION: 'Atenção',
    CRITICAL: 'Crítico',
  })[health ?? 'UNKNOWN'] ?? 'Sem diagnóstico';

const getHealthTone = (health?: string | null): BadgeTone =>
  (
    ({
      UNKNOWN: 'gray',
      HEALTHY: 'green',
      ATTENTION: 'orange',
      CRITICAL: 'red',
    }) as Record<string, BadgeTone>
  )[health ?? 'UNKNOWN'] ?? 'gray';

const getLifecycleLabel = (lifecycle?: string | null): string =>
  ({
    ONBOARDING: 'Onboarding',
    ADOPTION: 'Adoção',
    VALUE_DELIVERED: 'Valor entregue',
    EXPANSION: 'Expansão',
    RENEWAL: 'Renovação',
    AT_RISK: 'Em risco',
    CHURNED: 'Churn',
  })[lifecycle ?? ''] ?? 'Jornada não definida';

const getMilestoneStatusLabel = (status?: string | null): string =>
  ({
    PLANNED: 'Planejado',
    IN_PROGRESS: 'Em andamento',
    BLOCKED: 'Bloqueado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
  })[status ?? ''] ?? 'Sem status';

const getMilestoneTone = (status?: string | null): BadgeTone =>
  (
    ({
      PLANNED: 'gray',
      IN_PROGRESS: 'blue',
      BLOCKED: 'red',
      COMPLETED: 'green',
      CANCELLED: 'orange',
    }) as Record<string, BadgeTone>
  )[status ?? ''] ?? 'gray';

const moneyAmount = (money?: CustomerSuccessMoney | null): number =>
  (money?.amountMicros ?? 0) / 1_000_000;

const formatMoney = (
  value: number,
  currencyCode = 'BRL',
  compact = true,
): string => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
    }).format(value);
  } catch {
    return `${currencyCode} ${value.toLocaleString('pt-BR')}`;
  }
};

const formatPlanMoney = (
  money?: CustomerSuccessMoney | null,
  compact = true,
): string =>
  money?.amountMicros
    ? formatMoney(
        moneyAmount(money),
        money.currencyCode?.trim() || 'BRL',
        compact,
      )
    : 'Sem receita';

const formatDate = (value?: string | null): string => {
  if (!value) {
    return 'Sem data';
  }

  const date = new Date(value);

  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('pt-BR')
    : 'Sem data';
};

const daysUntil = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? Math.ceil((timestamp - Date.now()) / 86_400_000)
    : null;
};

const getDatePressureLabel = (value?: string | null): string => {
  const days = daysUntil(value);

  if (days === null) {
    return 'sem prazo';
  }

  if (days < 0) {
    return `${Math.abs(days)}d atrasado`;
  }

  if (days === 0) {
    return 'hoje';
  }

  return `em ${days}d`;
};

const isRiskPlan = (plan: CustomerSuccessPlan): boolean =>
  plan.health === 'CRITICAL' ||
  plan.health === 'ATTENTION' ||
  plan.lifecycle === 'AT_RISK';

const openRecord = async (
  recordId: string,
  objectNameSingular: string,
): Promise<void> => {
  try {
    await openSidePanelPage({
      page: SidePanelPages.ViewRecord,
      recordId,
      objectNameSingular,
    });
  } catch {
    await enqueueSnackbar({
      message: 'Não foi possível abrir este registro.',
      variant: 'error',
    });
  }
};

const MetricCard = ({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  tone: BadgeTone;
  icon: ReactNode;
}) => (
  <Card style={styles.metricCard}>
    <div style={styles.metricTop}>
      <p style={styles.metricLabel}>{label}</p>
      <Badge tone={tone}>{icon}</Badge>
    </div>
    <p style={styles.metricValue}>{value}</p>
    <p style={styles.smallMuted}>{note}</p>
  </Card>
);

export const CustomerSuccessCommandCenterFrontComponent = () => {
  const {
    plans,
    reviews,
    isLoading,
    busyReview,
    errorMessage,
    load,
    reviewPlan,
  } = useCustomerSuccessCommandCenter();
  const [filter, setFilter] = useState('ALL');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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
      selectedPlanId === null ||
      !visiblePlans.some(({ id }) => id === selectedPlanId)
    ) {
      setSelectedPlanId(visiblePlans[0]?.id ?? null);
    }
  }, [selectedPlanId, visiblePlans]);

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
          <Skeleton style={{ minHeight: 600 }} />
          <Skeleton style={{ minHeight: 600 }} />
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
        <Card style={styles.portfolioCard}>
          <CardHeader style={styles.portfolioHeader}>
            <CardTitle>Carteira priorizada</CardTitle>
            <CardDescription>
              Risco, revisão vencida e renovação próxima aparecem primeiro.
            </CardDescription>
            <div style={styles.filterRow}>
              {[
                ['ALL', 'Todos'],
                ['RISK', 'Risco'],
                ['RENEWAL', 'Renovação'],
                ['EXPANSION', 'Expansão'],
                ['OVERDUE', 'Revisão vencida'],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={filter === value ? 'default' : 'ghost'}
                  style={{ height: themeCssVariables.spacing[7] }}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <div style={styles.portfolioList}>
            {visiblePlans.length === 0 ? (
              <div style={styles.empty}>
                Nenhum plano encontrado neste recorte.
              </div>
            ) : (
              visiblePlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  style={{
                    ...styles.planButton,
                    ...(selectedPlan?.id === plan.id
                      ? styles.planButtonSelected
                      : {}),
                  }}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div style={styles.planTop}>
                    <p style={styles.planName}>{plan.name}</p>
                    <Badge tone={getHealthTone(plan.health)}>
                      {getHealthLabel(plan.health)}
                    </Badge>
                  </div>
                  <p style={styles.planCompany}>
                    {getRecordName(plan.company) || 'Empresa não vinculada'} ·{' '}
                    {getLifecycleLabel(plan.lifecycle)}
                  </p>
                  <Progress
                    value={plan.healthScore ?? 0}
                    tone={getHealthTone(plan.health)}
                  />
                  <div style={styles.planMeta}>
                    <span>{formatPlanMoney(plan.recurringRevenue)}</span>
                    <span>
                      renovação {getDatePressureLabel(plan.renewalDate)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card style={styles.detailCard}>
          {selectedPlan === null ? (
            <div style={styles.empty}>
              Selecione um plano para abrir a operação de Customer Success.
            </div>
          ) : (
            <>
              <CardHeader style={styles.detailHeader}>
                <div style={styles.planTop}>
                  <div>
                    <div style={styles.filterRow}>
                      <Badge tone={getHealthTone(selectedPlan.health)}>
                        {getHealthLabel(selectedPlan.health)}
                      </Badge>
                      <Badge tone="blue">
                        {getLifecycleLabel(selectedPlan.lifecycle)}
                      </Badge>
                      {selectedPlan.expansionSignal ? (
                        <Badge tone="turquoise">Expansão validada</Badge>
                      ) : null}
                    </div>
                    <CardTitle
                      style={{
                        fontSize: themeCssVariables.font.size.lg,
                        marginTop: themeCssVariables.spacing[2],
                      }}
                    >
                      {selectedPlan.name}
                    </CardTitle>
                    <CardDescription>
                      {getRecordName(selectedPlan.company) ||
                        'Empresa não vinculada'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void openRecord(selectedPlan.id, 'successPlan')
                    }
                  >
                    <IconExternalLink
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    Abrir plano
                  </Button>
                </div>
              </CardHeader>

              <div style={styles.detailBody}>
                <div style={styles.detailColumn}>
                  <div style={styles.factGrid}>
                    <div style={styles.fact}>
                      <p style={styles.metricLabel}>Receita recorrente</p>
                      <p style={styles.factValue}>
                        {formatPlanMoney(selectedPlan.recurringRevenue, false)}
                      </p>
                    </div>
                    <div style={styles.fact}>
                      <p style={styles.metricLabel}>Renovação</p>
                      <p style={styles.factValue}>
                        {formatDate(selectedPlan.renewalDate)} ·{' '}
                        {getDatePressureLabel(selectedPlan.renewalDate)}
                      </p>
                    </div>
                    <div style={styles.fact}>
                      <p style={styles.metricLabel}>Responsável de CS</p>
                      <p style={styles.factValue}>
                        {getRecordName(selectedPlan.owner) || 'Não definido'}
                      </p>
                    </div>
                    <div style={styles.fact}>
                      <p style={styles.metricLabel}>Próxima revisão</p>
                      <p style={styles.factValue}>
                        {formatDate(selectedPlan.nextReviewAt)} ·{' '}
                        {getDatePressureLabel(selectedPlan.nextReviewAt)}
                      </p>
                    </div>
                  </div>

                  <Card variant="muted">
                    <CardHeader>
                      <CardTitle>Valor reconhecido e riscos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p style={styles.narrative}>
                        {selectedPlan.executiveSummary?.markdown ||
                          selectedPlan.objectives?.markdown ||
                          'O resumo executivo ainda não foi construído. Rode a prévia de IA para consolidar os fatos do plano, marcos, sinais e conversas.'}
                      </p>
                      {selectedPlan.risks?.markdown ? (
                        <div
                          style={{
                            ...styles.reviewBlock,
                            borderLeftColor:
                              themeCssVariables.border.color.danger,
                            marginTop: themeCssVariables.spacing[3],
                          }}
                        >
                          <p style={styles.metricLabel}>Riscos registrados</p>
                          <p style={styles.narrative}>
                            {selectedPlan.risks.markdown}
                          </p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <div>
                    <div style={styles.sectionHeading}>
                      <div>
                        <CardTitle>Marcos da jornada</CardTitle>
                        <CardDescription>
                          Resultados e bloqueios ligados ao plano.
                        </CardDescription>
                      </div>
                      <Badge
                        tone={
                          selectedMilestones.some(
                            ({ status }) => status === 'BLOCKED',
                          )
                            ? 'red'
                            : 'blue'
                        }
                      >
                        {
                          selectedMilestones.filter(
                            ({ status }) => status !== 'COMPLETED',
                          ).length
                        }{' '}
                        abertos
                      </Badge>
                    </div>
                    <div style={styles.milestoneList}>
                      {selectedMilestones.length === 0 ? (
                        <Card variant="muted">
                          <div style={{ ...styles.empty, minHeight: 88 }}>
                            Nenhum marco foi cadastrado para este plano.
                          </div>
                        </Card>
                      ) : (
                        selectedMilestones.slice(0, 5).map((milestone) => (
                          <button
                            key={milestone.id}
                            type="button"
                            style={styles.milestoneButton}
                            onClick={() =>
                              void openRecord(milestone.id, 'successMilestone')
                            }
                          >
                            <IconFlag
                              size={themeCssVariables.icon.size.sm}
                              stroke={themeCssVariables.icon.stroke.md}
                            />
                            <span>
                              <strong>{milestone.name}</strong>
                              <br />
                              <span style={styles.smallMuted}>
                                {milestone.category || 'Sem categoria'} ·{' '}
                                {formatDate(milestone.dueAt)}
                              </span>
                            </span>
                            <Badge tone={getMilestoneTone(milestone.status)}>
                              {getMilestoneStatusLabel(milestone.status)}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <aside style={styles.detailColumn}>
                  <Card
                    variant={
                      selectedPlan.health === 'CRITICAL' ? 'danger' : 'accent'
                    }
                  >
                    <CardHeader>
                      <div style={styles.planTop}>
                        <div>
                          <CardTitle>Revisão inteligente de CS</CardTitle>
                          <CardDescription>
                            Usa plano, marcos, sinais e conversas do cliente.
                          </CardDescription>
                        </div>
                        <IconRobot
                          size={themeCssVariables.icon.size.md}
                          stroke={themeCssVariables.icon.stroke.md}
                        />
                      </div>
                    </CardHeader>
                    <CardContent style={styles.reviewCard}>
                      {selectedReview ? (
                        <>
                          <div style={styles.planTop}>
                            <Badge
                              tone={getHealthTone(selectedReview.health.health)}
                            >
                              {getHealthLabel(selectedReview.health.health)} ·{' '}
                              {selectedReview.health.score}/100
                            </Badge>
                            <Badge tone="blue">
                              {Math.round(selectedReview.confidence)}% confiança
                            </Badge>
                          </div>
                          <div style={styles.reviewBlock}>
                            <p style={styles.metricLabel}>Síntese</p>
                            <p style={styles.narrative}>
                              {selectedReview.summary}
                            </p>
                          </div>
                          <div style={styles.reviewBlock}>
                            <p style={styles.metricLabel}>
                              Intervenção recomendada
                            </p>
                            <p style={styles.narrative}>
                              {selectedReview.intervention}
                            </p>
                          </div>
                          {selectedReview.gaps ? (
                            <div style={styles.reviewBlock}>
                              <p style={styles.metricLabel}>Lacunas</p>
                              <p style={styles.narrative}>
                                {selectedReview.gaps}
                              </p>
                            </div>
                          ) : null}
                          {selectedReview.mode === 'APPLY' ? (
                            <Card
                              variant={
                                selectedReview.successPlanUpdated
                                  ? 'muted'
                                  : 'danger'
                              }
                            >
                              <CardContent
                                style={{
                                  paddingTop: themeCssVariables.spacing[3],
                                }}
                              >
                                <p style={styles.narrative}>
                                  {selectedReview.successPlanUpdated
                                    ? 'Saúde, resumo executivo e próxima revisão foram atualizados.'
                                    : 'A revisão foi concluída, mas o plano não confirmou a atualização.'}
                                </p>
                                {selectedReview.aiActionId ? (
                                  <Button
                                    variant="ghost"
                                    style={{
                                      marginTop: themeCssVariables.spacing[2],
                                    }}
                                    onClick={() =>
                                      void openRecord(
                                        selectedReview.aiActionId as string,
                                        'aiAction',
                                      )
                                    }
                                  >
                                    <IconExternalLink
                                      size={themeCssVariables.icon.size.sm}
                                      stroke={themeCssVariables.icon.stroke.md}
                                    />
                                    Abrir proposta governada
                                  </Button>
                                ) : null}
                              </CardContent>
                            </Card>
                          ) : null}
                        </>
                      ) : (
                        <p style={styles.narrative}>
                          A prévia é somente leitura. Ela não altera a saúde,
                          não cria tarefa e não envia mensagem.
                        </p>
                      )}

                      <div style={styles.reviewActions}>
                        <Button
                          variant="outline"
                          disabled={
                            busyReview?.planId === selectedPlan.id || isLoading
                          }
                          onClick={() =>
                            void reviewPlan(selectedPlan.id, 'PREVIEW')
                          }
                        >
                          <IconTarget
                            size={themeCssVariables.icon.size.sm}
                            stroke={themeCssVariables.icon.stroke.md}
                          />
                          {busyReview?.planId === selectedPlan.id &&
                          busyReview.mode === 'PREVIEW'
                            ? 'Analisando'
                            : 'Gerar prévia'}
                        </Button>
                        {selectedReview &&
                        (selectedReview.mode !== 'APPLY' ||
                          !selectedReview.successPlanUpdated) ? (
                          <Button
                            disabled={
                              busyReview?.planId === selectedPlan.id ||
                              isLoading
                            }
                            onClick={() =>
                              void reviewPlan(selectedPlan.id, 'APPLY')
                            }
                          >
                            <IconCheck
                              size={themeCssVariables.icon.size.sm}
                              stroke={themeCssVariables.icon.stroke.md}
                            />
                            {busyReview?.planId === selectedPlan.id &&
                            busyReview.mode === 'APPLY'
                              ? 'Aplicando'
                              : 'Aplicar revisão e governar ação'}
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="muted">
                    <CardHeader>
                      <CardTitle>Prontidão do plano</CardTitle>
                      <CardDescription>
                        Dados que sustentam retenção e expansão.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {[
                        [
                          'Adoção ativa',
                          selectedPlan.activeUseRating
                            ? selectedPlan.activeUseRating.replace(
                                'RATING_',
                                '',
                              )
                            : '0',
                        ],
                        [
                          'Evidência de valor',
                          selectedPlan.valueEvidenceRating
                            ? selectedPlan.valueEvidenceRating.replace(
                                'RATING_',
                                '',
                              )
                            : '0',
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            marginBottom: themeCssVariables.spacing[3],
                          }}
                        >
                          <div style={styles.planTop}>
                            <p style={styles.metricLabel}>{label}</p>
                            <span style={styles.smallMuted}>{value}/5</span>
                          </div>
                          <Progress
                            value={Number(value) * 20}
                            tone={Number(value) >= 4 ? 'green' : 'orange'}
                          />
                        </div>
                      ))}
                      <div style={styles.planMeta}>
                        <span>
                          <IconUsers
                            size={themeCssVariables.icon.size.sm}
                            stroke={themeCssVariables.icon.stroke.md}
                          />{' '}
                          {getRecordName(selectedPlan.primaryContact) ||
                            'contato principal ausente'}
                        </span>
                        <span>
                          {
                            selectedPlan.aiActions.filter(
                              ({ status }) =>
                                status === 'PENDING_APPROVAL' ||
                                status === 'APPROVED',
                            ).length
                          }{' '}
                          ações abertas
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            </>
          )}
        </Card>
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
