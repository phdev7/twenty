import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconChartBar,
  IconCheck,
  IconClock,
  IconCurrencyReal,
  IconMessage,
  IconRefresh,
  IconRefreshDot,
  IconRobot,
  IconTarget,
  IconTargetArrow,
  IconTimelineEvent,
  IconUser,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { RENEWAL_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/renewal-command-center/constants/renewal-command-center.constants';
import { renewalCommandCenterStyles as styles } from 'src/modules/renewal-command-center/front-components/renewal-command-center.styles';
import {
  type CustomerRenewal,
  type RenewalDraft,
  type RenewalMoney,
  type RenewalRecordReference,
} from 'src/modules/renewal-command-center/front-components/renewal-command-center.types';
import { useRenewalCommandCenter } from 'src/modules/renewal-command-center/front-components/use-renewal-command-center';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
  Skeleton,
} from 'src/ui/shadcn-twenty';

type BadgeTone =
  'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'turquoise' | 'gray';

const STAGES = [
  {
    value: 'PLANNING',
    label: 'Planejamento',
    tone: 'gray' as BadgeTone,
  },
  {
    value: 'VALUE_PROOF',
    label: 'Prova de valor',
    tone: 'blue' as BadgeTone,
  },
  {
    value: 'NEGOTIATION',
    label: 'Negociação',
    tone: 'orange' as BadgeTone,
  },
  {
    value: 'COMMITMENT',
    label: 'Compromisso',
    tone: 'turquoise' as BadgeTone,
  },
  {
    value: 'RENEWED',
    label: 'Renovada',
    tone: 'green' as BadgeTone,
  },
  {
    value: 'CHURNED',
    label: 'Churn',
    tone: 'red' as BadgeTone,
  },
] as const;

const RISKS = [
  { value: 'LOW', label: 'Baixo', tone: 'green' as BadgeTone },
  { value: 'MEDIUM', label: 'Médio', tone: 'yellow' as BadgeTone },
  { value: 'HIGH', label: 'Alto', tone: 'orange' as BadgeTone },
  { value: 'CRITICAL', label: 'Crítico', tone: 'red' as BadgeTone },
] as const;

const FORECASTS = [
  { value: 'PIPELINE', label: 'Pipeline' },
  { value: 'BEST_CASE', label: 'Melhor caso' },
  { value: 'COMMIT', label: 'Compromisso' },
  { value: 'CLOSED', label: 'Fechado' },
] as const;

const EVENT_LABELS: Record<string, string> = {
  CREATED: 'Caso criado',
  STAGE_CHANGED: 'Etapa alterada',
  PLAN_UPDATED: 'Plano atualizado',
  TOUCH_RECORDED: 'Contato registrado',
  AI_ACTION_PROPOSED: 'Intervenção de IA proposta',
  CLOSED_WON: 'Renovação ganha',
  CLOSED_LOST: 'Churn registrado',
};

const getRecordName = (record?: RenewalRecordReference | null): string => {
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

const getAmountMicros = (money?: RenewalMoney | null): number =>
  money?.amountMicros ?? 0;

const formatMoney = (
  amountMicros: number,
  currencyCode = 'BRL',
  compact = false,
): string => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
    }).format(amountMicros / 1_000_000);
  } catch {
    return `${currencyCode} ${(amountMicros / 1_000_000).toLocaleString('pt-BR')}`;
  }
};

const formatDate = (value?: string | null): string => {
  if (!value) {
    return 'Sem data';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return 'Sem registro';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

const toDateTimeLocal = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const offset = parsed.getTimezoneOffset() * 60_000;

  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
};

const daysUntil = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.ceil((timestamp - Date.now()) / 86_400_000);
};

const getStage = (stage: string) =>
  STAGES.find(({ value }) => value === stage) ?? STAGES[0];

const getRisk = (risk: string) =>
  RISKS.find(({ value }) => value === risk) ?? RISKS[1];

const createDraft = (renewal: CustomerRenewal): RenewalDraft => ({
  stage: renewal.stage,
  risk: renewal.risk,
  forecast: renewal.forecast,
  probability: renewal.probability ?? 0,
  targetDate: renewal.targetDate?.slice(0, 10) ?? '',
  nextAction: renewal.nextAction ?? '',
  nextActionAt: toDateTimeLocal(renewal.nextActionAt),
  ownerId: renewal.owner?.id ?? '',
  riskReason: renewal.riskReason?.markdown ?? '',
  valueEvidence: renewal.valueEvidence?.markdown ?? '',
  commercialTerms: renewal.commercialTerms?.markdown ?? '',
  outcome: renewal.outcome?.markdown ?? '',
});

const MetricCell = ({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note: string;
}) => (
  <div style={styles.metricCell}>
    <p style={styles.metricLabel}>{label}</p>
    <p style={styles.metricValue}>{value}</p>
    <p style={styles.metricNote}>{note}</p>
  </div>
);

const Field = ({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) => (
  <label style={wide ? styles.fieldWide : styles.field}>
    <span style={styles.fieldLabel}>{label}</span>
    {children}
  </label>
);

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

      <section style={styles.workbench}>
        <Card>
          {selectedRenewal && draft ? (
            <>
              <CardHeader>
                <div style={styles.detailHeader}>
                  <div>
                    <CardTitle>{selectedRenewal.name}</CardTitle>
                    <CardDescription>
                      {getRecordName(selectedRenewal.company) ||
                        'Empresa não vinculada'}{' '}
                      ·{' '}
                      {getRecordName(selectedRenewal.owner) ||
                        'Sem responsável'}
                    </CardDescription>
                    <div style={styles.badgeRow}>
                      <Badge tone={getStage(selectedRenewal.stage).tone}>
                        {getStage(selectedRenewal.stage).label}
                      </Badge>
                      <Badge tone={getRisk(selectedRenewal.risk).tone}>
                        risco{' '}
                        {getRisk(selectedRenewal.risk).label.toLowerCase()}
                      </Badge>
                      <Badge tone="blue">{selectedRenewal.forecast}</Badge>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={styles.metricLabel}>Valor</p>
                    <p style={styles.metricValue}>
                      {formatMoney(
                        getAmountMicros(selectedRenewal.renewalValue),
                        selectedRenewal.renewalValue?.currencyCode ?? 'BRL',
                        true,
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div style={styles.formGrid}>
                  <Field label="Etapa">
                    <select
                      value={draft.stage}
                      style={styles.input}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          stage: event.currentTarget.value,
                        })
                      }
                    >
                      {STAGES.map((stage) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Risco">
                    <select
                      value={draft.risk}
                      style={styles.input}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          risk: event.currentTarget.value,
                        })
                      }
                    >
                      {RISKS.map((risk) => (
                        <option key={risk.value} value={risk.value}>
                          {risk.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Forecast">
                    <select
                      value={draft.forecast}
                      style={styles.input}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          forecast: event.currentTarget.value,
                        })
                      }
                    >
                      {FORECASTS.map((forecast) => (
                        <option key={forecast.value} value={forecast.value}>
                          {forecast.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Probabilidade (%)">
                    <input
                      min={0}
                      max={100}
                      type="number"
                      value={draft.probability}
                      style={styles.input}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          probability: Number(event.currentTarget.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Data-alvo">
                    <input
                      type="date"
                      value={draft.targetDate}
                      style={styles.input}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          targetDate: event.currentTarget.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Responsável">
                    <select
                      value={draft.ownerId}
                      style={styles.input}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          ownerId: event.currentTarget.value,
                        })
                      }
                    >
                      <option value="">Sem responsável</option>
                      {workspaceMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {getRecordName(member) || 'Membro sem nome'}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Próxima ação" wide>
                    <input
                      type="text"
                      value={draft.nextAction}
                      style={styles.input}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          nextAction: event.currentTarget.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Prazo da próxima ação">
                    <input
                      type="datetime-local"
                      value={draft.nextActionAt}
                      style={styles.input}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          nextActionAt: event.currentTarget.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Último contato">
                    <input
                      readOnly
                      value={formatDateTime(selectedRenewal.lastTouchAt)}
                      style={styles.input}
                    />
                  </Field>
                  <Field label="Plano de sucesso">
                    <input
                      readOnly
                      value={
                        getRecordName(selectedRenewal.successPlan) ||
                        'Não vinculado'
                      }
                      style={styles.input}
                    />
                  </Field>
                  <Field label="Motivo do risco" wide>
                    <textarea
                      value={draft.riskReason}
                      style={styles.textarea}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          riskReason: event.currentTarget.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Evidência de valor" wide>
                    <textarea
                      value={draft.valueEvidence}
                      style={styles.textarea}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          valueEvidence: event.currentTarget.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Condições comerciais" wide>
                    <textarea
                      value={draft.commercialTerms}
                      style={styles.textarea}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          commercialTerms: event.currentTarget.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Resultado / motivo de fechamento" wide>
                    <textarea
                      value={draft.outcome}
                      style={styles.textarea}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          outcome: event.currentTarget.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <div style={styles.actionBar}>
                  <Button
                    disabled={busyAction !== null}
                    onClick={() =>
                      void updateRenewal(selectedRenewal.id, draft)
                    }
                  >
                    <IconCheck
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    Salvar plano
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busyAction !== null}
                    onClick={() => void recordTouch(selectedRenewal.id)}
                  >
                    <IconMessage
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    Registrar contato agora
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busyAction !== null}
                    onClick={() =>
                      void proposeAiIntervention(selectedRenewal.id)
                    }
                  >
                    <IconRobot
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    Propor intervenção com IA
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div style={styles.emptyState}>
              <IconTarget
                size={themeCssVariables.icon.size.xl}
                stroke={themeCssVariables.icon.stroke.md}
              />
              Selecione uma renovação na esteira ou abra um caso a partir de um
              plano de sucesso.
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span
                style={{
                  alignItems: 'center',
                  display: 'inline-flex',
                  gap: themeCssVariables.spacing[1],
                }}
              >
                <IconTimelineEvent
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                Histórico operacional
              </span>
            </CardTitle>
            <CardDescription>
              Alterações, contatos, IA e fechamento com autoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRenewal?.events.length ? (
              <div style={styles.timeline}>
                {selectedRenewal.events.map((event) => (
                  <div key={event.id} style={styles.timelineItem}>
                    <span style={styles.timelineDot} />
                    <div>
                      <Badge
                        tone={
                          event.eventType === 'CLOSED_WON'
                            ? 'green'
                            : event.eventType === 'CLOSED_LOST'
                              ? 'red'
                              : event.eventType === 'AI_ACTION_PROPOSED'
                                ? 'orange'
                                : 'blue'
                        }
                      >
                        {EVENT_LABELS[event.eventType] ?? event.eventType}
                      </Badge>
                      <p style={styles.timelineSummary}>{event.summary}</p>
                      <p style={styles.timelineMeta}>
                        {formatDateTime(event.occurredAt)} ·{' '}
                        {getRecordName(event.actor) || 'Sistema'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <IconClock
                  size={themeCssVariables.icon.size.lg}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                O histórico aparecerá após a primeira operação.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

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
