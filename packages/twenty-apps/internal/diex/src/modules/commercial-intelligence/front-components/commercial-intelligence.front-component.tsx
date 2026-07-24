import { type ReactNode, useMemo } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  SidePanelPages,
  enqueueSnackbar,
  openSidePanelPage,
} from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBolt,
  IconChartDots3,
  IconCheck,
  IconClock,
  IconRefresh,
  IconTargetArrow,
  IconTrendingUp,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { COMMERCIAL_INTELLIGENCE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/commercial-intelligence/constants/commercial-intelligence.constants';
import { commercialIntelligenceStyles as styles } from 'src/modules/commercial-intelligence/front-components/commercial-intelligence.styles';
import {
  type CommercialOpportunity,
  type CommercialRecordReference,
  type CommercialSignal,
} from 'src/modules/commercial-intelligence/front-components/commercial-intelligence.types';
import { useCommercialIntelligence } from 'src/modules/commercial-intelligence/front-components/use-commercial-intelligence';
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

const getRecordName = (record?: CommercialRecordReference | null): string => {
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

const getSignalTypeLabel = (type: string): string =>
  ({
    INTENT: 'Intenção',
    ENGAGEMENT: 'Engajamento',
    OBJECTION: 'Objeção',
    RISK: 'Risco',
    EXPANSION: 'Expansão',
    CHURN_RISK: 'Risco de churn',
    COMPETITOR: 'Concorrente',
  })[type] ?? type;

const getSignalTone = (type: string): BadgeTone =>
  (
    ({
      INTENT: 'blue',
      ENGAGEMENT: 'green',
      OBJECTION: 'orange',
      RISK: 'red',
      EXPANSION: 'turquoise',
      CHURN_RISK: 'red',
      COMPETITOR: 'gray',
    }) as Record<string, BadgeTone>
  )[type] ?? 'gray';

const getStatusLabel = (status: string): string =>
  ({
    NEW: 'Novo',
    IN_REVIEW: 'Em análise',
    ACTIONED: 'Tratado',
    DISMISSED: 'Descartado',
  })[status] ?? status;

const getStatusTone = (status: string): BadgeTone =>
  (
    ({
      NEW: 'blue',
      IN_REVIEW: 'orange',
      ACTIONED: 'green',
      DISMISSED: 'gray',
    }) as Record<string, BadgeTone>
  )[status] ?? 'gray';

const getRiskLabel = (risk?: string | null): string =>
  ({
    LOW: 'Risco baixo',
    MEDIUM: 'Risco médio',
    HIGH: 'Risco alto',
    UNKNOWN: 'Sem avaliação',
  })[risk ?? 'UNKNOWN'] ?? 'Sem avaliação';

const getRiskTone = (risk?: string | null): BadgeTone =>
  (
    ({
      LOW: 'green',
      MEDIUM: 'orange',
      HIGH: 'red',
      UNKNOWN: 'gray',
    }) as Record<string, BadgeTone>
  )[risk ?? 'UNKNOWN'] ?? 'gray';

const getStrength = (strength?: string | null): number => {
  const parsed = Number.parseInt(strength?.replace('RATING_', '') ?? '', 10);

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatRelativeDate = (value?: string | null): string => {
  if (!value) {
    return 'sem data';
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return 'sem data';
  }

  const days = Math.round((timestamp - Date.now()) / (24 * 60 * 60_000));

  if (days === 0) {
    return 'hoje';
  }

  if (days === 1) {
    return 'amanhã';
  }

  if (days === -1) {
    return 'ontem';
  }

  return days > 0 ? `em ${days} dias` : `${Math.abs(days)} dias atrasada`;
};

const formatCurrency = (amountMicros: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(amountMicros / 1_000_000);

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

const getSignalPriority = (signal: CommercialSignal): number => {
  const typeWeight =
    signal.type === 'CHURN_RISK' || signal.type === 'RISK'
      ? 40
      : signal.type === 'OBJECTION'
        ? 30
        : signal.type === 'INTENT' || signal.type === 'EXPANSION'
          ? 25
          : 10;
  const statusWeight = signal.status === 'NEW' ? 20 : 10;

  return (
    typeWeight +
    statusWeight +
    getStrength(signal.strength) * 4 +
    (signal.confidence ?? 0) / 10
  );
};

const KpiCard = ({
  title,
  value,
  description,
  tone,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  tone: BadgeTone;
  icon: ReactNode;
}) => (
  <Card>
    <CardHeader style={{ paddingBottom: themeCssVariables.spacing[2] }}>
      <div style={styles.sectionHeader}>
        <CardDescription>{title}</CardDescription>
        <Badge tone={tone}>{icon}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div style={styles.kpiContent}>
        <span style={styles.kpiValue}>{value}</span>
        <CardDescription style={{ maxWidth: 130, textAlign: 'right' }}>
          {description}
        </CardDescription>
      </div>
    </CardContent>
  </Card>
);

const OpportunityRank = ({
  opportunity,
}: {
  opportunity: CommercialOpportunity;
}) => {
  const score = Math.max(0, Math.min(100, opportunity.commercialScore ?? 0));
  const scoreTone: BadgeTone =
    score >= 75 ? 'green' : score >= 50 ? 'orange' : 'gray';

  return (
    <button
      type="button"
      style={{
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        fontFamily: themeCssVariables.font.family,
        padding: 0,
        textAlign: 'left',
        width: '100%',
      }}
      onClick={() => void openRecord(opportunity.id, 'opportunity')}
    >
      <div style={styles.opportunityHeader}>
        <p style={styles.opportunityName}>
          {getRecordName(opportunity) || 'Oportunidade sem nome'}
        </p>
        <Badge tone={scoreTone}>{Math.round(score)} pts</Badge>
      </div>
      <p style={styles.opportunityMeta}>
        {getRecordName(opportunity.company) || 'Empresa não vinculada'} ·{' '}
        {opportunity.stage || 'Sem etapa'}
      </p>
      <Progress value={score} tone={scoreTone} />
      <div style={{ marginTop: themeCssVariables.spacing[2] }}>
        <Badge tone={getRiskTone(opportunity.dealRisk)}>
          {getRiskLabel(opportunity.dealRisk)}
        </Badge>
      </div>
    </button>
  );
};

export const CommercialIntelligenceFrontComponent = () => {
  const {
    signals,
    opportunities,
    isLoading,
    busySignalId,
    errorMessage,
    load,
    updateSignalStatus,
  } = useCommercialIntelligence();

  const metrics = useMemo(() => {
    const activeSignals = signals.filter(
      ({ status }) => status === 'NEW' || status === 'IN_REVIEW',
    );
    const buyingSignals = activeSignals.filter(
      ({ type }) => type === 'INTENT' || type === 'EXPANSION',
    );
    const riskSignals = activeSignals.filter(
      ({ type }) =>
        type === 'RISK' || type === 'CHURN_RISK' || type === 'OBJECTION',
    );
    const overdueActions = opportunities.filter(
      ({ nextCommercialActionAt }) =>
        nextCommercialActionAt &&
        new Date(nextCommercialActionAt).getTime() < Date.now(),
    );
    const prioritizedSignals = [...activeSignals]
      .sort((left, right) => getSignalPriority(right) - getSignalPriority(left))
      .slice(0, 8);
    const rankedOpportunities = [...opportunities]
      .sort(
        (left, right) =>
          (right.commercialScore ?? 0) - (left.commercialScore ?? 0),
      )
      .slice(0, 6);
    const nextActions = opportunities
      .filter(({ nextCommercialAction }) => Boolean(nextCommercialAction))
      .sort((left, right) => {
        const leftTime = left.nextCommercialActionAt
          ? new Date(left.nextCommercialActionAt).getTime()
          : Number.POSITIVE_INFINITY;
        const rightTime = right.nextCommercialActionAt
          ? new Date(right.nextCommercialActionAt).getTime()
          : Number.POSITIVE_INFINITY;

        return leftTime - rightTime;
      })
      .slice(0, 6);
    const brlPipelineMicros = opportunities.reduce(
      (total, opportunity) =>
        opportunity.amount?.currencyCode === 'BRL'
          ? total + (opportunity.amount.amountMicros ?? 0)
          : total,
      0,
    );

    return {
      activeSignals,
      buyingSignals,
      riskSignals,
      overdueActions,
      prioritizedSignals,
      rankedOpportunities,
      nextActions,
      brlPipelineMicros,
    };
  }, [opportunities, signals]);

  if (isLoading && signals.length === 0 && opportunities.length === 0) {
    return (
      <div style={styles.root}>
        <Skeleton style={{ minHeight: 190 }} />
        <div style={styles.kpiGrid}>
          <Skeleton style={{ minHeight: 124 }} />
          <Skeleton style={{ minHeight: 124 }} />
          <Skeleton style={{ minHeight: 124 }} />
          <Skeleton style={{ minHeight: 124 }} />
        </div>
        <div style={styles.mainGrid}>
          <Skeleton style={{ minHeight: 360 }} />
          <Skeleton style={{ minHeight: 360 }} />
        </div>
      </div>
    );
  }

  if (errorMessage && signals.length === 0 && opportunities.length === 0) {
    return (
      <div style={styles.root}>
        <Card variant="danger">
          <div style={styles.error}>{errorMessage}</div>
          <CardContent style={{ textAlign: 'center' }}>
            <Button variant="outline" onClick={() => void load()}>
              <IconRefresh
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Card variant="accent" style={styles.hero}>
        <div style={styles.heroCopy}>
          <p style={styles.eyebrow}>Diex Revenue Intelligence</p>
          <h1 style={styles.heroTitle}>
            Evidência comercial antes de opinião.
          </h1>
          <p style={styles.heroDescription}>
            Sinais do CRM, WhatsApp, IA e Customer Success priorizados pelo
            impacto real na receita. A equipe começa pelo que exige ação agora.
          </p>
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
              Atualizar radar
            </Button>
          </div>
        </div>
        <div style={styles.radarWrap}>
          <span style={styles.radarRingOuter} />
          <span style={styles.radarRingMiddle} />
          <span style={styles.radarRingInner} />
          <span style={styles.radarValue}>
            {metrics.activeSignals.length}
            <span style={styles.radarLabel}>sinais ativos</span>
          </span>
        </div>
      </Card>

      <section style={styles.kpiGrid}>
        <KpiCard
          title="Sinais em operação"
          value={metrics.activeSignals.length}
          description="novos ou em análise"
          tone="blue"
          icon={
            <IconChartDots3
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <KpiCard
          title="Compra e expansão"
          value={metrics.buyingSignals.length}
          description="intenção com potencial de receita"
          tone="green"
          icon={
            <IconTrendingUp
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <KpiCard
          title="Riscos e objeções"
          value={metrics.riskSignals.length}
          description="pedem mitigação objetiva"
          tone="red"
          icon={
            <IconAlertTriangle
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <KpiCard
          title="Ações vencidas"
          value={metrics.overdueActions.length}
          description="compromissos comerciais atrasados"
          tone="orange"
          icon={
            <IconClock
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
      </section>

      <section style={styles.mainGrid}>
        <Card>
          <CardHeader>
            <div style={styles.sectionHeader}>
              <div>
                <CardTitle>Fluxo de sinais prioritários</CardTitle>
                <CardDescription>
                  Ordenado por tipo, força, confiança e estágio da triagem.
                </CardDescription>
              </div>
              <Badge tone="blue">
                {metrics.prioritizedSignals.length} em foco
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {metrics.prioritizedSignals.length === 0 ? (
              <div style={styles.empty}>
                Nenhum sinal ativo. A fila está limpa.
              </div>
            ) : (
              <div style={styles.signalList}>
                {metrics.prioritizedSignals.map((signal, index) => {
                  const contextName =
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
                    <div key={signal.id}>
                      {index > 0 ? <Separator /> : null}
                      <article style={styles.signalRow}>
                        <span
                          style={{
                            ...styles.signalDot,
                            background:
                              signal.type === 'RISK' ||
                              signal.type === 'CHURN_RISK'
                                ? themeCssVariables.color.red
                                : signal.type === 'OBJECTION'
                                  ? themeCssVariables.color.orange
                                  : themeCssVariables.accent.primary,
                          }}
                        />
                        <div>
                          <p style={styles.signalTitle}>{signal.name}</p>
                          <div style={styles.signalMeta}>
                            <Badge tone={getSignalTone(signal.type)}>
                              {getSignalTypeLabel(signal.type)}
                            </Badge>
                            <Badge tone={getStatusTone(signal.status)}>
                              {getStatusLabel(signal.status)}
                            </Badge>
                            <span>{contextName}</span>
                            <span>·</span>
                            <span>
                              {getStrength(signal.strength) || 0}/5 força
                            </span>
                          </div>
                          <p style={styles.signalAction}>
                            {signal.recommendedAction?.markdown ||
                              'Abra o sinal para definir a próxima ação.'}
                          </p>
                        </div>
                        <div style={styles.signalButtons}>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              void openRecord(signal.id, 'commercialSignal')
                            }
                          >
                            Abrir
                          </Button>
                          {nextStatus ? (
                            <Button
                              variant="outline"
                              disabled={busySignalId === signal.id}
                              onClick={() =>
                                void updateSignalStatus(signal.id, nextStatus)
                              }
                            >
                              {nextStatus === 'IN_REVIEW' ? (
                                <IconBolt
                                  size={themeCssVariables.icon.size.sm}
                                  stroke={themeCssVariables.icon.stroke.md}
                                />
                              ) : (
                                <IconCheck
                                  size={themeCssVariables.icon.size.sm}
                                  stroke={themeCssVariables.icon.stroke.md}
                                />
                              )}
                              {nextStatus === 'IN_REVIEW'
                                ? 'Analisar'
                                : 'Tratar'}
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="muted">
          <CardHeader>
            <CardTitle>Ranking de oportunidades</CardTitle>
            <CardDescription>
              Score comercial e risco consolidado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={styles.opportunityList}>
              {metrics.rankedOpportunities.length === 0 ? (
                <div style={styles.empty}>Nenhuma oportunidade cadastrada.</div>
              ) : (
                metrics.rankedOpportunities.map((opportunity, index) => (
                  <div key={opportunity.id}>
                    {index > 0 ? (
                      <Separator
                        style={{ marginBottom: themeCssVariables.spacing[3] }}
                      />
                    ) : null}
                    <OpportunityRank opportunity={opportunity} />
                  </div>
                ))
              )}
            </div>
            {metrics.brlPipelineMicros > 0 ? (
              <div style={{ marginTop: themeCssVariables.spacing[4] }}>
                <Separator />
                <div
                  style={{
                    ...styles.sectionHeader,
                    marginTop: themeCssVariables.spacing[3],
                  }}
                >
                  <CardDescription>Pipeline BRL mapeado</CardDescription>
                  <Badge tone="green">
                    {formatCurrency(metrics.brlPipelineMicros)}
                  </Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section>
        <div
          style={{
            ...styles.sectionHeader,
            marginBottom: themeCssVariables.spacing[3],
          }}
        >
          <div>
            <CardTitle>Próximas ações comerciais</CardTitle>
            <CardDescription>
              Compromissos objetivos que movem receita.
            </CardDescription>
          </div>
          <Badge tone={metrics.overdueActions.length > 0 ? 'red' : 'green'}>
            {metrics.overdueActions.length} vencida
            {metrics.overdueActions.length === 1 ? '' : 's'}
          </Badge>
        </div>
        <div style={styles.nextActionGrid}>
          {metrics.nextActions.length === 0 ? (
            <Card style={{ gridColumn: '1 / -1' }}>
              <div style={styles.empty}>
                Nenhuma próxima ação definida nas oportunidades.
              </div>
            </Card>
          ) : (
            metrics.nextActions.map((opportunity) => {
              const isOverdue =
                Boolean(opportunity.nextCommercialActionAt) &&
                new Date(opportunity.nextCommercialActionAt ?? '').getTime() <
                  Date.now();

              return (
                <Card
                  key={opportunity.id}
                  variant={isOverdue ? 'danger' : 'default'}
                  style={styles.nextActionCard}
                  onClick={() => void openRecord(opportunity.id, 'opportunity')}
                >
                  <CardHeader>
                    <div style={styles.sectionHeader}>
                      <Badge tone={isOverdue ? 'red' : 'blue'}>
                        <IconClock
                          size={themeCssVariables.icon.size.sm}
                          stroke={themeCssVariables.icon.stroke.md}
                        />
                        {formatRelativeDate(opportunity.nextCommercialActionAt)}
                      </Badge>
                      <IconArrowRight
                        size={themeCssVariables.icon.size.sm}
                        stroke={themeCssVariables.icon.stroke.md}
                      />
                    </div>
                    <p style={styles.nextActionTitle}>
                      {opportunity.nextCommercialAction}
                    </p>
                    <CardDescription>
                      <IconTargetArrow
                        size={themeCssVariables.icon.size.sm}
                        stroke={themeCssVariables.icon.stroke.sm}
                      />{' '}
                      {getRecordName(opportunity) || 'Oportunidade sem nome'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier:
    COMMERCIAL_INTELLIGENCE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-commercial-intelligence',
  description:
    'Cockpit visual de sinais, riscos, oportunidades e próximas ações comerciais.',
  component: CommercialIntelligenceFrontComponent,
});
