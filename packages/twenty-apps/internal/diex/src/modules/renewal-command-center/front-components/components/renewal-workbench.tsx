import {
  IconCheck,
  IconClock,
  IconMessage,
  IconRobot,
  IconTarget,
  IconTimelineEvent,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  Field,
} from 'src/modules/renewal-command-center/front-components/components/renewal-primitives';
import { renewalCommandCenterStyles as styles } from 'src/modules/renewal-command-center/front-components/renewal-command-center.styles';
import {
  type CustomerRenewal,
  type RenewalDraft,
  type RenewalWorkspaceMember,
} from 'src/modules/renewal-command-center/front-components/renewal-command-center.types';
import {
  EVENT_LABELS,
  FORECASTS,
  RISKS,
  STAGES,
  formatDateTime,
  formatMoney,
  getAmountMicros,
  getRecordName,
  getRisk,
  getStage,
} from 'src/modules/renewal-command-center/front-components/utils/renewal-formatters';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/ui/shadcn-twenty';

type RenewalWorkbenchProps = {
  selectedRenewal: CustomerRenewal | null;
  draft: RenewalDraft | null;
  workspaceMembers: RenewalWorkspaceMember[];
  busyAction: string | null;
  setDraft: (draft: RenewalDraft | null) => void;
  updateRenewal: (
    customerRenewalId: string,
    draft: RenewalDraft,
  ) => Promise<boolean>;
  recordTouch: (customerRenewalId: string) => Promise<boolean>;
  proposeAiIntervention: (customerRenewalId: string) => Promise<boolean>;
};

export const RenewalWorkbench = ({
  selectedRenewal,
  draft,
  workspaceMembers,
  busyAction,
  setDraft,
  updateRenewal,
  recordTouch,
  proposeAiIntervention,
}: RenewalWorkbenchProps) => (
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
        {selectedRenewal?.renewalEvents.length ? (
          <div style={styles.timeline}>
            {selectedRenewal.renewalEvents.map((event) => (
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
);
