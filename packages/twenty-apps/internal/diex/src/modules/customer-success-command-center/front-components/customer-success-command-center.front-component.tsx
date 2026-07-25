import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
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
import { MetricCard } from 'src/modules/customer-success-command-center/front-components/components/metric-card';
import { PortfolioList } from 'src/modules/customer-success-command-center/front-components/components/portfolio-list';
import { customerSuccessCommandCenterStyles as styles } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.styles';
import {
  type CustomerSuccessHandoffDraft,
  type CustomerSuccessMilestoneAction,
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
  getLifecycleLabel,
  getMilestoneActionLabel,
  getMilestoneStatusLabel,
  getMilestoneTone,
  getRecordName,
  isRiskPlan,
  moneyAmount,
  openRecord,
} from 'src/modules/customer-success-command-center/front-components/utils/customer-success-formatters';
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

      <Card style={styles.handoffCard}>
        <CardHeader style={styles.handoffHeader}>
          <div style={styles.sectionHeading}>
            <div>
              <CardTitle>Entrada de novos clientes</CardTitle>
              <CardDescription>
                Converta negócios ganhos em operação de CS com origem,
                responsável, receita, renovação, marcos e kickoff.
              </CardDescription>
            </div>
            <Badge tone={handoffOpportunities.length > 0 ? 'orange' : 'green'}>
              {handoffOpportunities.length} aguardando handoff
            </Badge>
          </div>
        </CardHeader>
        {handoffOpportunities.length === 0 ? (
          <div style={{ ...styles.empty, minHeight: 92 }}>
            Nenhuma oportunidade em Fechado ganho está sem plano de sucesso.
          </div>
        ) : (
          <CardContent style={styles.handoffGrid}>
            <div style={styles.handoffQueue}>
              <p style={styles.metricLabel}>Negócios ganhos</p>
              <div style={styles.handoffQueueList}>
                {handoffOpportunities.map((opportunity) => (
                  <button
                    key={opportunity.id}
                    type="button"
                    style={{
                      ...styles.handoffOpportunity,
                      ...(selectedHandoffOpportunity?.id === opportunity.id
                        ? styles.handoffOpportunitySelected
                        : {}),
                    }}
                    onClick={() =>
                      setSelectedHandoffOpportunityId(opportunity.id)
                    }
                  >
                    <span style={styles.planName}>
                      {opportunity.name || 'Oportunidade sem nome'}
                    </span>
                    <span style={styles.smallMuted}>
                      {getRecordName(opportunity.company) ||
                        'Empresa não vinculada'}
                    </span>
                    <span style={styles.planMeta}>
                      <span>{formatPlanMoney(opportunity.amount, false)}</span>
                      {!opportunity.company?.id ? (
                        <Badge tone="red">sem empresa</Badge>
                      ) : !opportunity.pointOfContact?.id ? (
                        <Badge tone="orange">sem contato</Badge>
                      ) : (
                        <Badge tone="green">pronto</Badge>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedHandoffOpportunity && handoffDraft ? (
              <div style={styles.handoffForm}>
                <div style={styles.planTop}>
                  <div>
                    <p style={styles.metricLabel}>Configuração do contrato</p>
                    <p style={styles.planName}>
                      {selectedHandoffOpportunity.name ||
                        'Oportunidade sem nome'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      void openRecord(
                        selectedHandoffOpportunity.id,
                        'opportunity',
                      )
                    }
                  >
                    <IconExternalLink
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    Venda
                  </Button>
                </div>

                <label style={styles.handoffField}>
                  <span style={styles.metricLabel}>Responsável de CS</span>
                  <select
                    aria-label="Responsável de Customer Success"
                    value={handoffDraft.ownerId}
                    style={styles.handoffInput}
                    onChange={(event) =>
                      updateHandoffDraft({ ownerId: event.target.value })
                    }
                  >
                    <option value="">Selecione um responsável</option>
                    {[...workspaceMembers]
                      .sort((left, right) =>
                        getRecordName(left).localeCompare(
                          getRecordName(right),
                          'pt-BR',
                        ),
                      )
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {getRecordName(member) || member.id}
                        </option>
                      ))}
                  </select>
                </label>

                <div style={styles.handoffFieldGrid}>
                  <label style={styles.handoffField}>
                    <span style={styles.metricLabel}>Renovação</span>
                    <input
                      aria-label="Data de renovação"
                      type="date"
                      value={handoffDraft.renewalDate}
                      style={styles.handoffInput}
                      onChange={(event) =>
                        updateHandoffDraft({
                          renewalDate: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label style={styles.handoffField}>
                    <span style={styles.metricLabel}>Moeda</span>
                    <input
                      aria-label="Moeda da receita recorrente"
                      type="text"
                      maxLength={3}
                      value={handoffDraft.currencyCode}
                      style={styles.handoffInput}
                      onChange={(event) =>
                        updateHandoffDraft({
                          currencyCode: event.target.value.toUpperCase(),
                        })
                      }
                    />
                  </label>
                  <label
                    style={{
                      ...styles.handoffField,
                      gridColumn: '1 / -1',
                    }}
                  >
                    <span style={styles.metricLabel}>Receita recorrente</span>
                    <input
                      aria-label="Receita recorrente"
                      type="number"
                      min={0}
                      step="0.01"
                      value={handoffDraft.recurringRevenueMicros / 1_000_000}
                      style={styles.handoffInput}
                      onChange={(event) =>
                        updateHandoffDraft({
                          recurringRevenueMicros: Math.max(
                            0,
                            Math.round(
                              (Number(event.target.value) || 0) * 1_000_000,
                            ),
                          ),
                        })
                      }
                    />
                  </label>
                </div>

                <label style={styles.handoffField}>
                  <span style={styles.metricLabel}>Objetivos do cliente</span>
                  <textarea
                    aria-label="Objetivos do cliente"
                    value={handoffDraft.objectives}
                    style={styles.handoffTextarea}
                    onChange={(event) =>
                      updateHandoffDraft({ objectives: event.target.value })
                    }
                  />
                </label>
                <label style={styles.handoffField}>
                  <span style={styles.metricLabel}>Critérios de sucesso</span>
                  <textarea
                    aria-label="Critérios de sucesso"
                    value={handoffDraft.successCriteria}
                    style={styles.handoffTextarea}
                    onChange={(event) =>
                      updateHandoffDraft({
                        successCriteria: event.target.value,
                      })
                    }
                  />
                </label>

                <Button
                  variant={handoffPreview === null ? 'default' : 'outline'}
                  disabled={
                    busyHandoff?.opportunityId === selectedHandoffOpportunity.id
                  }
                  onClick={() =>
                    void previewHandoff(
                      selectedHandoffOpportunity.id,
                      handoffDraft,
                    )
                  }
                >
                  <IconTarget
                    size={themeCssVariables.icon.size.sm}
                    stroke={themeCssVariables.icon.stroke.md}
                  />
                  {handoffPreview === null
                    ? 'Gerar prévia do handoff'
                    : 'Atualizar prévia'}
                </Button>
              </div>
            ) : null}

            <div style={styles.handoffPreview}>
              <p style={styles.metricLabel}>Prévia operacional</p>
              {handoffPreview?.supported === false ? (
                <Card variant="danger">
                  <CardContent
                    style={{ paddingTop: themeCssVariables.spacing[3] }}
                  >
                    <p style={styles.narrative}>
                      {handoffPreview.blockedReason}
                    </p>
                    {handoffPreview.existingPlanId ? (
                      <Button
                        variant="ghost"
                        style={{ marginTop: themeCssVariables.spacing[2] }}
                        onClick={() =>
                          void openRecord(
                            handoffPreview.existingPlanId as string,
                            'successPlan',
                          )
                        }
                      >
                        Abrir plano existente
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ) : handoffPreview?.supported === true ? (
                <>
                  <div style={styles.handoffPlanSummary}>
                    <div>
                      <p style={styles.planName}>
                        {handoffPreview.preview.plan.name}
                      </p>
                      <p style={styles.smallMuted}>
                        {formatMoney(
                          handoffPreview.preview.plan.recurringRevenueMicros /
                            1_000_000,
                          handoffPreview.preview.plan.currencyCode,
                          false,
                        )}{' '}
                        · renovação{' '}
                        {formatDate(handoffPreview.preview.plan.renewalDate)}
                      </p>
                    </div>
                    <Badge tone="blue">5 marcos</Badge>
                  </div>
                  <div style={styles.handoffMilestones}>
                    {handoffPreview.preview.milestones.map(
                      (milestone, index) => (
                        <div key={milestone.id} style={styles.handoffMilestone}>
                          <span style={styles.handoffMilestoneIndex}>
                            {index + 1}
                          </span>
                          <span>
                            <strong>{milestone.name}</strong>
                            <br />
                            <span style={styles.smallMuted}>
                              {formatDate(milestone.dueAt)}
                            </span>
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                  <div style={styles.handoffTask}>
                    <IconCheck
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    <span>
                      <strong>{handoffPreview.preview.task.title}</strong>
                      <br />
                      <span style={styles.smallMuted}>
                        tarefa até{' '}
                        {formatDate(handoffPreview.preview.task.dueAt)}
                      </span>
                    </span>
                  </div>
                  {handoffPreview.preview.warnings.map((warning) => (
                    <p key={warning} style={styles.handoffWarning}>
                      {warning}
                    </p>
                  ))}
                  <p style={styles.smallMuted}>
                    Confirmação válida até{' '}
                    {new Date(handoffPreview.expiresAt).toLocaleTimeString(
                      'pt-BR',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                    . Nenhuma mensagem será enviada.
                  </p>
                  <Button
                    disabled={
                      !handoffDraft ||
                      busyHandoff?.opportunityId ===
                        handoffPreview.opportunityId
                    }
                    onClick={() => {
                      if (!handoffDraft) {
                        return;
                      }

                      void confirmHandoff(
                        handoffPreview.opportunityId,
                        handoffDraft,
                        handoffPreview.confirmationToken,
                      ).then((successPlanId) => {
                        if (successPlanId) {
                          void openRecord(successPlanId, 'successPlan');
                        }
                      });
                    }}
                  >
                    <IconCheck
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    Confirmar entrada no CS
                  </Button>
                </>
              ) : (
                <div style={styles.handoffGuardrail}>
                  <IconUsers
                    size={themeCssVariables.icon.size.lg}
                    stroke={themeCssVariables.icon.stroke.md}
                  />
                  <p style={styles.narrative}>
                    A prévia não cria registros. A confirmação gera um plano,
                    cinco marcos e uma tarefa de kickoff vinculada ao CRM.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

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
                  <div style={styles.filterRow}>
                    {selectedPlan.opportunity ? (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          void openRecord(
                            selectedPlan.opportunity?.id as string,
                            'opportunity',
                          )
                        }
                      >
                        <IconTarget
                          size={themeCssVariables.icon.size.sm}
                          stroke={themeCssVariables.icon.stroke.md}
                        />
                        Venda de origem
                      </Button>
                    ) : null}
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
                            style={{
                              ...styles.milestoneButton,
                              ...(selectedMilestone?.id === milestone.id
                                ? styles.milestoneButtonSelected
                                : {}),
                            }}
                            onClick={() => setSelectedMilestoneId(milestone.id)}
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
                    {selectedMilestone ? (
                      <Card style={styles.milestoneActionCard}>
                        <CardHeader>
                          <div style={styles.planTop}>
                            <div>
                              <p style={styles.metricLabel}>
                                Execução do marco
                              </p>
                              <CardTitle>{selectedMilestone.name}</CardTitle>
                              <CardDescription>
                                {getMilestoneStatusLabel(
                                  selectedMilestone.status,
                                )}{' '}
                                · {formatDate(selectedMilestone.dueAt)}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                void openRecord(
                                  selectedMilestone.id,
                                  'successMilestone',
                                )
                              }
                            >
                              <IconExternalLink
                                size={themeCssVariables.icon.size.sm}
                                stroke={themeCssVariables.icon.stroke.md}
                              />
                              Registro
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent style={styles.milestoneActionBody}>
                          {selectedMilestone.status === 'COMPLETED' ||
                          selectedMilestone.status === 'CANCELLED' ? (
                            <div style={styles.milestoneActionClosed}>
                              <IconCheck
                                size={themeCssVariables.icon.size.md}
                                stroke={themeCssVariables.icon.stroke.md}
                              />
                              <div>
                                <p style={styles.planName}>Marco encerrado</p>
                                <p style={styles.smallMuted}>
                                  {selectedMilestone.outcome?.markdown ||
                                    'Abra o registro para consultar os detalhes.'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={styles.milestoneActionGrid}>
                                <label style={styles.handoffField}>
                                  <span style={styles.metricLabel}>Ação</span>
                                  <select
                                    aria-label="Ação do marco"
                                    value={milestoneActionDraft.action}
                                    style={styles.handoffInput}
                                    onChange={(event) =>
                                      updateMilestoneActionDraft({
                                        action: event.target
                                          .value as CustomerSuccessMilestoneAction,
                                      })
                                    }
                                  >
                                    <option value="START">
                                      Iniciar ou retomar
                                    </option>
                                    <option value="BLOCK">
                                      Registrar bloqueio
                                    </option>
                                    <option value="COMPLETE">
                                      Concluir com evidência
                                    </option>
                                  </select>
                                </label>
                                {milestoneActionDraft.action === 'COMPLETE' ? (
                                  <label style={styles.handoffField}>
                                    <span style={styles.metricLabel}>
                                      Impacto
                                    </span>
                                    <select
                                      aria-label="Impacto do marco"
                                      value={milestoneActionDraft.impact}
                                      style={styles.handoffInput}
                                      onChange={(event) =>
                                        updateMilestoneActionDraft({
                                          impact: event.target.value,
                                        })
                                      }
                                    >
                                      {[1, 2, 3, 4, 5].map((rating) => (
                                        <option
                                          key={rating}
                                          value={`RATING_${rating}`}
                                        >
                                          {rating} de 5
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                ) : null}
                              </div>

                              {milestoneActionDraft.action !== 'START' ? (
                                <>
                                  <label style={styles.handoffField}>
                                    <span style={styles.metricLabel}>
                                      {milestoneActionDraft.action === 'BLOCK'
                                        ? 'Motivo do bloqueio'
                                        : 'Resultado alcançado'}
                                    </span>
                                    <textarea
                                      aria-label="Resultado ou bloqueio do marco"
                                      value={milestoneActionDraft.outcome}
                                      style={styles.handoffTextarea}
                                      onChange={(event) =>
                                        updateMilestoneActionDraft({
                                          outcome: event.target.value,
                                        })
                                      }
                                    />
                                  </label>
                                  <label style={styles.handoffField}>
                                    <span style={styles.metricLabel}>
                                      Evidência{' '}
                                      {milestoneActionDraft.action === 'BLOCK'
                                        ? 'opcional'
                                        : 'obrigatória'}
                                    </span>
                                    <textarea
                                      aria-label="Evidência do marco"
                                      value={milestoneActionDraft.evidence}
                                      style={styles.handoffTextarea}
                                      onChange={(event) =>
                                        updateMilestoneActionDraft({
                                          evidence: event.target.value,
                                        })
                                      }
                                    />
                                  </label>
                                </>
                              ) : null}

                              <Button
                                variant={
                                  milestoneActionPreview === null
                                    ? 'default'
                                    : 'outline'
                                }
                                disabled={
                                  busyMilestoneAction?.milestoneId ===
                                  selectedMilestone.id
                                }
                                onClick={() =>
                                  void previewMilestoneAction(
                                    selectedMilestone.id,
                                    milestoneActionDraft,
                                  )
                                }
                              >
                                <IconTimelineEvent
                                  size={themeCssVariables.icon.size.sm}
                                  stroke={themeCssVariables.icon.stroke.md}
                                />
                                {milestoneActionPreview === null
                                  ? `Prévia: ${getMilestoneActionLabel(
                                      milestoneActionDraft.action,
                                    )}`
                                  : 'Atualizar prévia'}
                              </Button>

                              {milestoneActionPreview?.supported === false ? (
                                <div style={styles.milestoneActionBlocked}>
                                  <IconAlertTriangle
                                    size={themeCssVariables.icon.size.sm}
                                    stroke={themeCssVariables.icon.stroke.md}
                                  />
                                  <span>
                                    {milestoneActionPreview.blockedReason}
                                  </span>
                                </div>
                              ) : milestoneActionPreview?.supported === true ? (
                                <div style={styles.milestoneActionPreview}>
                                  <div>
                                    <p style={styles.metricLabel}>
                                      Efeitos exatos
                                    </p>
                                    <div
                                      style={styles.milestoneActionEffectList}
                                    >
                                      {milestoneActionPreview.preview.effects.map(
                                        (effect) => (
                                          <p
                                            key={effect}
                                            style={styles.smallMuted}
                                          >
                                            <IconCheck
                                              size={
                                                themeCssVariables.icon.size.sm
                                              }
                                              stroke={
                                                themeCssVariables.icon.stroke.md
                                              }
                                            />
                                            {effect}
                                          </p>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                  {milestoneActionPreview.preview.warnings.map(
                                    (warning) => (
                                      <p
                                        key={warning}
                                        style={styles.handoffWarning}
                                      >
                                        {warning}
                                      </p>
                                    ),
                                  )}
                                  <p style={styles.smallMuted}>
                                    Confirmação válida até{' '}
                                    {new Date(
                                      milestoneActionPreview.expiresAt,
                                    ).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    . Nenhuma mensagem será enviada.
                                  </p>
                                  <Button
                                    disabled={
                                      busyMilestoneAction?.milestoneId ===
                                      selectedMilestone.id
                                    }
                                    onClick={() =>
                                      void confirmMilestoneAction(
                                        selectedMilestone.id,
                                        milestoneActionDraft,
                                        milestoneActionPreview.confirmationToken,
                                      )
                                    }
                                  >
                                    <IconCheck
                                      size={themeCssVariables.icon.size.sm}
                                      stroke={themeCssVariables.icon.stroke.md}
                                    />
                                    Confirmar{' '}
                                    {getMilestoneActionLabel(
                                      milestoneActionDraft.action,
                                    ).toLowerCase()}
                                  </Button>
                                </div>
                              ) : null}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ) : null}
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
