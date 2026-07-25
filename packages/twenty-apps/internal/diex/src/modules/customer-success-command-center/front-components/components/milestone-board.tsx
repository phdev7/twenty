import {
  IconAlertTriangle,
  IconCheck,
  IconExternalLink,
  IconFlag,
  IconTimelineEvent,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { customerSuccessCommandCenterStyles as styles } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.styles';
import {
  type CustomerSuccessMilestone,
  type CustomerSuccessMilestoneAction,
  type CustomerSuccessMilestoneActionDraft,
  type CustomerSuccessMilestoneActionPreviewResult,
} from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.types';
import {
  formatDate,
  getMilestoneActionLabel,
  getMilestoneStatusLabel,
  getMilestoneTone,
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
} from 'src/ui/shadcn-twenty';

type MilestoneBoardProps = {
  milestones: CustomerSuccessMilestone[];
  selectedMilestone: CustomerSuccessMilestone | null;
  milestoneActionDraft: CustomerSuccessMilestoneActionDraft;
  milestoneActionPreview: CustomerSuccessMilestoneActionPreviewResult | null;
  busyMilestoneAction: {
    milestoneId: string;
    mode: 'PREVIEW' | 'APPLY';
  } | null;
  onSelectMilestone: (milestoneId: string) => void;
  onDraftChange: (patch: Partial<CustomerSuccessMilestoneActionDraft>) => void;
  onPreview: (
    milestoneId: string,
    draft: CustomerSuccessMilestoneActionDraft,
  ) => Promise<boolean>;
  onConfirm: (
    milestoneId: string,
    draft: CustomerSuccessMilestoneActionDraft,
    confirmationToken: string,
  ) => Promise<boolean>;
};

export const MilestoneBoard = ({
  milestones: selectedMilestones,
  selectedMilestone,
  milestoneActionDraft,
  milestoneActionPreview,
  busyMilestoneAction,
  onSelectMilestone: setSelectedMilestoneId,
  onDraftChange: updateMilestoneActionDraft,
  onPreview: previewMilestoneAction,
  onConfirm: confirmMilestoneAction,
}: MilestoneBoardProps) => (
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
);
