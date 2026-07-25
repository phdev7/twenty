import { useMemo } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
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
import {
  KpiCard,
  OpportunityRank,
} from 'src/modules/commercial-intelligence/front-components/components/intelligence-cards';
import {
  formatCurrency,
  formatRelativeDate,
  getRecordName,
  getSignalPriority,
  getSignalTone,
  getSignalTypeLabel,
  getStatusLabel,
  getStatusTone,
  getStrength,
  openRecord,
} from 'src/modules/commercial-intelligence/front-components/utils/commercial-intelligence-formatters';
import { commercialIntelligenceStyles as styles } from 'src/modules/commercial-intelligence/front-components/commercial-intelligence.styles';
import { useCommercialIntelligence } from 'src/modules/commercial-intelligence/front-components/use-commercial-intelligence';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from 'src/ui/shadcn-twenty';


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
      ({ signalType }) =>
        signalType === 'INTENT' || signalType === 'EXPANSION',
    );
    const riskSignals = activeSignals.filter(
      ({ signalType }) =>
        signalType === 'RISK' ||
        signalType === 'CHURN_RISK' ||
        signalType === 'OBJECTION',
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
                              signal.signalType === 'RISK' ||
                              signal.signalType === 'CHURN_RISK'
                                ? themeCssVariables.color.red
                                : signal.signalType === 'OBJECTION'
                                  ? themeCssVariables.color.orange
                                  : themeCssVariables.accent.primary,
                          }}
                        />
                        <div>
                          <p style={styles.signalTitle}>{signal.name}</p>
                          <div style={styles.signalMeta}>
                            <Badge tone={getSignalTone(signal.signalType)}>
                              {getSignalTypeLabel(signal.signalType)}
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
