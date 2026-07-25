import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconChartBar,
  IconCurrencyReal,
  IconRefresh,
  IconRefreshDot,
  IconTargetArrow,
  IconUser,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { RENEWAL_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/renewal-command-center/constants/renewal-command-center.constants';
import {
  MetricCell,
} from 'src/modules/renewal-command-center/front-components/components/renewal-primitives';
import { RenewalWorkbench } from 'src/modules/renewal-command-center/front-components/components/renewal-workbench';
import {
  STAGES,
  createDraft,
  daysUntil,
  formatDate,
  formatMoney,
  getAmountMicros,
  getRecordName,
  getRisk,
} from 'src/modules/renewal-command-center/front-components/utils/renewal-formatters';
import { renewalCommandCenterStyles as styles } from 'src/modules/renewal-command-center/front-components/renewal-command-center.styles';
import {
  type RenewalDraft,
} from 'src/modules/renewal-command-center/front-components/renewal-command-center.types';
import { useRenewalCommandCenter } from 'src/modules/renewal-command-center/front-components/use-renewal-command-center';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Progress,
  Separator,
  Skeleton,
} from 'src/ui/shadcn-twenty';


const RenewalCommandCenter = () => {
  const {
    renewals,
    successPlans,
    workspaceMembers,
    isLoading,
    busyAction,
    errorMessage,
    load,
    createRenewal,
    updateRenewal,
    recordTouch,
    proposeAiIntervention,
  } = useRenewalCommandCenter();
  const [selectedRenewalId, setSelectedRenewalId] = useState<string | null>(
    null,
  );
  const [selectedSuccessPlanId, setSelectedSuccessPlanId] = useState('');
  const [draft, setDraft] = useState<RenewalDraft | null>(null);

  const selectedRenewal =
    renewals.find(({ id }) => id === selectedRenewalId) ?? null;

  useEffect(() => {
    if (
      renewals.length > 0 &&
      !renewals.some(({ id }) => id === selectedRenewalId)
    ) {
      setSelectedRenewalId(renewals[0].id);
    }

    if (renewals.length === 0) {
      setSelectedRenewalId(null);
    }
  }, [renewals, selectedRenewalId]);

  useEffect(() => {
    setDraft(selectedRenewal ? createDraft(selectedRenewal) : null);
  }, [selectedRenewal]);

  const metrics = useMemo(() => {
    const active = renewals.filter(({ stage }) =>
      ['PLANNING', 'VALUE_PROOF', 'NEGOTIATION', 'COMMITMENT'].includes(stage),
    );
    const primaryCurrency =
      active.find(({ renewalValue }) => renewalValue?.currencyCode)
        ?.renewalValue?.currencyCode ?? 'BRL';
    const activeInCurrency = active.filter(
      ({ renewalValue }) =>
        (renewalValue?.currencyCode ?? primaryCurrency) === primaryCurrency,
    );
    const activeValue = activeInCurrency.reduce(
      (total, renewal) => total + getAmountMicros(renewal.renewalValue),
      0,
    );
    const weightedForecast = activeInCurrency.reduce(
      (total, renewal) =>
        total +
        (getAmountMicros(renewal.renewalValue) *
          Math.max(0, Math.min(100, renewal.probability ?? 0))) /
          100,
      0,
    );
    const riskValue = activeInCurrency
      .filter(({ risk }) => risk === 'HIGH' || risk === 'CRITICAL')
      .reduce(
        (total, renewal) => total + getAmountMicros(renewal.renewalValue),
        0,
      );
    const dueIn30Days = active.filter((renewal) => {
      const days = daysUntil(renewal.targetDate);

      return days !== null && days >= 0 && days <= 30;
    });
    const overdueActions = active.filter((renewal) => {
      const days = daysUntil(renewal.nextActionAt);

      return !renewal.nextAction?.trim() || (days !== null && days < 0);
    });

    return {
      active,
      primaryCurrency,
      activeValue,
      weightedForecast,
      riskValue,
      dueIn30Days,
      overdueActions,
    };
  }, [renewals]);

  const availablePlans = successPlans.filter(
    (plan) =>
      !renewals.some(
        (renewal) =>
          renewal.successPlan?.id === plan.id &&
          ['PLANNING', 'VALUE_PROOF', 'NEGOTIATION', 'COMMITMENT'].includes(
            renewal.stage,
          ),
      ),
  );

  if (isLoading && renewals.length === 0) {
    return (
      <div style={styles.root}>
        <Skeleton style={{ minHeight: 164 }} />
        <div style={styles.metricLedger}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} style={{ minHeight: 86 }} />
          ))}
        </div>
        <Skeleton style={{ minHeight: 420 }} />
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Card style={styles.controlHeader}>
        <div>
          <p style={styles.eyebrow}>
            <IconRefreshDot
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            Motor de retenção
          </p>
          <h1 style={styles.title}>
            Conduza cada renovação até receita confirmada.
          </h1>
          <p style={styles.subtitle}>
            Forecast, risco, evidência de valor, negociação, responsável,
            próxima ação e histórico conectados ao plano de sucesso.
          </p>
        </div>

        <div style={styles.createBox}>
          <p style={styles.createLabel}>Abrir caso a partir do CS</p>
          <div style={styles.createRow}>
            <select
              aria-label="Plano de sucesso"
              value={selectedSuccessPlanId}
              style={styles.input}
              onChange={(event) =>
                setSelectedSuccessPlanId(event.currentTarget.value)
              }
            >
              <option value="">Selecione um plano</option>
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {getRecordName(plan.company) || plan.name} ·{' '}
                  {formatDate(plan.renewalDate)}
                </option>
              ))}
            </select>
            <Button
              disabled={!selectedSuccessPlanId || busyAction === 'create'}
              onClick={async () => {
                const createdId = await createRenewal(selectedSuccessPlanId);

                if (createdId) {
                  setSelectedRenewalId(createdId);
                  setSelectedSuccessPlanId('');
                }
              }}
            >
              <IconTargetArrow
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              Abrir
            </Button>
          </div>
          <CardDescription>
            O caso herda empresa, responsável, valor, data e risco do plano.
          </CardDescription>
        </div>
      </Card>

      {errorMessage ? (
        <Card variant="danger">
          <CardContent style={{ paddingTop: themeCssVariables.spacing[4] }}>
            {errorMessage}
          </CardContent>
        </Card>
      ) : null}

      <section style={styles.metricLedger}>
        <MetricCell
          label="Receita em renovação"
          value={formatMoney(
            metrics.activeValue,
            metrics.primaryCurrency,
            true,
          )}
          note={`${metrics.active.length} caso${metrics.active.length === 1 ? '' : 's'} ativo${metrics.active.length === 1 ? '' : 's'}`}
        />
        <MetricCell
          label="Forecast ponderado"
          value={formatMoney(
            metrics.weightedForecast,
            metrics.primaryCurrency,
            true,
          )}
          note="valor × probabilidade"
        />
        <MetricCell
          label="Receita sob risco"
          value={formatMoney(metrics.riskValue, metrics.primaryCurrency, true)}
          note="risco alto ou crítico"
        />
        <MetricCell
          label="Vencem em 30 dias"
          value={metrics.dueIn30Days.length}
          note="exigem decisão próxima"
        />
        <MetricCell
          label="Ações vencidas"
          value={metrics.overdueActions.length}
          note="sem próxima ação ou prazo vencido"
        />
      </section>

      <Card>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionTitle}>Esteira de renovação</p>
            <p style={styles.sectionNote}>
              Selecione um caso para operar risco, forecast e próxima ação.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => void load()}
          >
            <IconRefresh
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            Atualizar
          </Button>
        </div>

        <div style={styles.stageRail}>
          {STAGES.map((stage, index) => {
            const stageRenewals = renewals.filter(
              (renewal) => renewal.stage === stage.value,
            );
            const value = stageRenewals.reduce(
              (total, renewal) => total + getAmountMicros(renewal.renewalValue),
              0,
            );

            return (
              <div key={stage.value} style={styles.stageRailItem}>
                <span style={styles.stageNumber}>{index + 1}</span>
                <p style={styles.stageName}>{stage.label}</p>
                <div>
                  <p style={styles.stageValue}>{stageRenewals.length} casos</p>
                  <p style={styles.stageValue}>
                    {formatMoney(value, metrics.primaryCurrency, true)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        <div style={styles.board}>
          {STAGES.map((stage) => {
            const stageRenewals = renewals.filter(
              (renewal) => renewal.stage === stage.value,
            );

            return (
              <section key={stage.value} style={styles.boardColumn}>
                <div style={styles.columnHeader}>
                  <Badge tone={stage.tone}>{stage.label}</Badge>
                  <span style={styles.metricNote}>{stageRenewals.length}</span>
                </div>
                <div style={styles.columnCards}>
                  {stageRenewals.length === 0 ? (
                    <p style={styles.emptyColumn}>Nenhum caso nesta etapa.</p>
                  ) : (
                    stageRenewals.map((renewal) => {
                      const risk = getRisk(renewal.risk);
                      const dueDays = daysUntil(renewal.targetDate);

                      return (
                        <button
                          key={renewal.id}
                          type="button"
                          style={{
                            ...styles.renewalCard,
                            ...(renewal.id === selectedRenewalId
                              ? styles.selectedCard
                              : {}),
                          }}
                          onClick={() => setSelectedRenewalId(renewal.id)}
                        >
                          <p style={styles.cardName}>
                            {getRecordName(renewal.company) || renewal.name}
                          </p>
                          <div style={styles.cardMeta}>
                            <Badge tone={risk.tone}>{risk.label}</Badge>
                            <strong>
                              {formatMoney(
                                getAmountMicros(renewal.renewalValue),
                                renewal.renewalValue?.currencyCode ??
                                  metrics.primaryCurrency,
                                true,
                              )}
                            </strong>
                          </div>
                          <Progress
                            value={renewal.probability ?? 0}
                            tone={
                              renewal.risk === 'CRITICAL' ||
                              renewal.risk === 'HIGH'
                                ? 'red'
                                : 'green'
                            }
                          />
                          <p style={styles.cardAction}>
                            {renewal.nextAction?.trim() ||
                              'Definir próxima ação'}
                          </p>
                          <div style={styles.cardMeta}>
                            <span>{renewal.probability ?? 0}%</span>
                            <span>
                              {dueDays === null
                                ? 'sem prazo'
                                : dueDays < 0
                                  ? `${Math.abs(dueDays)}d atrasada`
                                  : `${dueDays}d`}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </Card>

      <RenewalWorkbench
        selectedRenewal={selectedRenewal}
        draft={draft}
        workspaceMembers={workspaceMembers}
        busyAction={busyAction}
        setDraft={setDraft}
        updateRenewal={updateRenewal}
        recordTouch={recordTouch}
        proposeAiIntervention={proposeAiIntervention}
      />

      <Card variant="muted">
        <CardContent
          style={{
            alignItems: 'center',
            display: 'grid',
            gap: themeCssVariables.spacing[3],
            gridTemplateColumns: 'auto minmax(0, 1fr) auto',
            paddingTop: themeCssVariables.spacing[4],
          }}
        >
          <IconAlertTriangle
            size={themeCssVariables.icon.size.md}
            stroke={themeCssVariables.icon.stroke.md}
          />
          <div>
            <CardTitle>Regra de governança</CardTitle>
            <CardDescription>
              A IA apenas cria uma proposta auditável. Aprovação e execução
              continuam humanas no Centro de IA.
            </CardDescription>
          </div>
          <div style={styles.badgeRow}>
            <Badge tone="blue">
              <IconChartBar
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              forecast real
            </Badge>
            <Badge tone="green">
              <IconCurrencyReal
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              receita protegida
            </Badge>
            <Badge tone="gray">
              <IconUser
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              decisão humana
            </Badge>
            <Badge tone="orange">
              <IconCalendarDue
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              próxima ação
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier:
    RENEWAL_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-renewal-command-center',
  description:
    'Esteira operacional de retenção com forecast, risco, IA governada e histórico.',
  component: RenewalCommandCenter,
});
