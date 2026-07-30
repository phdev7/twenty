import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  IconCalendarDue,
  IconCheck,
  IconClock,
  IconCpu,
  IconExternalLink,
  IconListCheck,
  IconPlayerPlay,
  IconRefresh,
  IconRobot,
  IconShield,
  IconTarget,
  IconX,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { AI_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/ai-command-center/constants/ai-command-center.constants';
import { MetricCard } from 'src/modules/ai-command-center/front-components/components/metric-card';
import {
  type QueueFilter,
  formatDateTime,
  getLinkedRecords,
  getRecordName,
  getStatusLabel,
  getStatusTone,
  getTypeLabel,
  openRecord,
} from 'src/modules/ai-command-center/front-components/utils/ai-command-center-formatters';
import { aiCommandCenterStyles as styles } from 'src/modules/ai-command-center/front-components/ai-command-center.styles';
import { useAiCommandCenter } from 'src/modules/ai-command-center/front-components/use-ai-command-center';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from 'src/ui/shadcn-twenty';

export const AiCommandCenterFrontComponent = () => {
  const {
    actions,
    currentReviewer,
    isLoading,
    busyActionId,
    errorMessage,
    load,
    reviewAction,
    busyExecution,
    executionPreviews,
    executeAction,
  } = useAiCommandCenter();
  const [filter, setFilter] = useState<QueueFilter>('PENDING');
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [pipelineTargets, setPipelineTargets] = useState<
    Record<string, string>
  >({});

  const metrics = useMemo(() => {
    const pending = actions.filter(
      ({ status }) => status === 'PENDING_APPROVAL',
    );
    const approved = actions.filter(({ status }) => status === 'APPROVED');
    const executed = actions.filter(({ status }) => status === 'EXECUTED');
    const failed = actions.filter(({ status }) => status === 'FAILED');
    const reviewed = actions.filter(
      ({ status }) => status === 'APPROVED' || status === 'REJECTED',
    );
    const approvalRate =
      reviewed.length === 0
        ? 0
        : Math.round(
            (reviewed.filter(({ status }) => status === 'APPROVED').length /
              reviewed.length) *
              100,
          );

    return {
      pending,
      approved,
      executed,
      failed,
      approvalRate,
    };
  }, [actions]);

  const visibleActions = useMemo(() => {
    const filtered = actions.filter((action) => {
      if (filter === 'PENDING') {
        return action.status === 'PENDING_APPROVAL';
      }

      if (filter === 'APPROVED') {
        return action.status === 'APPROVED';
      }

      if (filter === 'HISTORY') {
        return ['REJECTED', 'EXECUTED', 'FAILED'].includes(action.status);
      }

      return true;
    });

    return [...filtered].sort((left, right) => {
      const leftPending = left.status === 'PENDING_APPROVAL' ? 1 : 0;
      const rightPending = right.status === 'PENDING_APPROVAL' ? 1 : 0;

      if (leftPending !== rightPending) {
        return rightPending - leftPending;
      }

      return (
        new Date(right.requestedAt ?? 0).getTime() -
        new Date(left.requestedAt ?? 0).getTime()
      );
    });
  }, [actions, filter]);

  const selectedAction =
    actions.find(({ id }) => id === selectedActionId) ??
    visibleActions[0] ??
    null;
  const executionPreview = selectedAction
    ? (executionPreviews[selectedAction.id] ?? null)
    : null;
  const isPipelineAction = selectedAction?.actionType === 'PIPELINE_UPDATE';
  const pipelineTargetStage = selectedAction
    ? (pipelineTargets[selectedAction.id] ?? '')
    : '';
  const pipelinePreview =
    executionPreview?.supported === true &&
    executionPreview.executionKind === 'PIPELINE_UPDATE'
      ? executionPreview
      : null;
  const isPipelineConfirmationReady =
    pipelinePreview?.requiresTargetStage === false &&
    pipelinePreview.pipelineChange.targetStage.value === pipelineTargetStage;

  useEffect(() => {
    if (
      selectedActionId === null ||
      !visibleActions.some(({ id }) => id === selectedActionId)
    ) {
      setSelectedActionId(visibleActions[0]?.id ?? null);
    }
  }, [selectedActionId, visibleActions]);

  useEffect(() => {
    setReviewNote('');
  }, [selectedAction?.id]);

  if (isLoading && actions.length === 0) {
    return (
      <div style={styles.root}>
        <Skeleton style={{ minHeight: 92 }} />
        <div style={styles.metricStrip}>
          <Skeleton style={{ minHeight: 88 }} />
          <Skeleton style={{ minHeight: 88 }} />
          <Skeleton style={{ minHeight: 88 }} />
          <Skeleton style={{ minHeight: 88 }} />
        </div>
        <div style={styles.consoleGrid}>
          <Skeleton style={{ minHeight: 360 }} />
          <Skeleton style={{ minHeight: 360 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Card style={styles.consoleHeader}>
        <div style={styles.consoleIdentity}>
          <span style={styles.consoleIcon}>
            <IconRobot
              size={themeCssVariables.icon.size.lg}
              stroke={themeCssVariables.icon.stroke.md}
            />
          </span>
          <div>
            <h1 style={styles.title}>Centro de IA</h1>
            <p style={styles.subtitle}>
              Propostas rastreáveis, decisão humana e recibo antes de qualquer
              efeito externo.
            </p>
          </div>
        </div>
        <div style={styles.systemStatus}>
          <span style={styles.pulse} />
          <div>
            <p style={styles.queueTitle}>Governança ativa</p>
            <p style={styles.queueMeta}>
              {currentReviewer
                ? `Revisor: ${getRecordName(currentReviewer)}`
                : 'Revisor não identificado'}
            </p>
          </div>
          <Button
            variant="ghost"
            disabled={isLoading}
            onClick={() => void load()}
          >
            <IconRefresh
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          </Button>
        </div>
      </Card>

      {errorMessage ? (
        <Card variant="danger">
          <CardContent style={{ paddingTop: themeCssVariables.spacing[4] }}>
            {errorMessage}
          </CardContent>
        </Card>
      ) : null}

      <section style={styles.metricStrip}>
        <MetricCard
          label="Aguardando decisão"
          value={metrics.pending.length}
          tone="orange"
          icon={
            <IconClock
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <MetricCard
          label="Aprovadas, não executadas"
          value={metrics.approved.length}
          tone="blue"
          icon={
            <IconShield
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <MetricCard
          label="Executadas"
          value={metrics.executed.length}
          tone="green"
          icon={
            <IconPlayerPlay
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
        <MetricCard
          label="Taxa de aprovação"
          value={`${metrics.approvalRate}%`}
          tone={metrics.failed.length > 0 ? 'red' : 'turquoise'}
          icon={
            <IconCpu
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
          }
        />
      </section>

      <section style={styles.consoleGrid}>
        <Card style={styles.queueCard}>
          <CardHeader style={styles.queueHeader}>
            <CardTitle>Fila de decisões</CardTitle>
            <CardDescription>
              Selecione uma proposta para revisar evidência e impacto.
            </CardDescription>
            <div style={styles.filterRow}>
              {(
                [
                  ['PENDING', 'Pendentes'],
                  ['APPROVED', 'Aprovadas'],
                  ['HISTORY', 'Histórico'],
                  ['ALL', 'Todas'],
                ] as Array<[QueueFilter, string]>
              ).map(([value, label]) => (
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
          <div style={styles.queueList}>
            {visibleActions.length === 0 ? (
              <div style={styles.empty}>Nenhuma ação neste filtro.</div>
            ) : (
              visibleActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  style={{
                    ...styles.queueItem,
                    ...(selectedAction?.id === action.id
                      ? styles.queueItemSelected
                      : {}),
                  }}
                  onClick={() => setSelectedActionId(action.id)}
                >
                  <div style={styles.queueTopLine}>
                    <p style={styles.queueTitle}>{action.name}</p>
                    <Badge tone={getStatusTone(action.status)}>
                      {getStatusLabel(action.status)}
                    </Badge>
                  </div>
                  <div style={styles.queueMeta}>
                    <span>{getTypeLabel(action.actionType)}</span>
                    <span>·</span>
                    <span>{Math.round(action.confidence ?? 0)}% confiança</span>
                    <span>·</span>
                    <span>{formatDateTime(action.requestedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card style={styles.detailCard}>
          {selectedAction === null ? (
            <div style={styles.empty}>
              Selecione uma proposta da fila para abrir a revisão.
            </div>
          ) : (
            <>
              <CardHeader style={styles.detailHeader}>
                <div style={styles.detailBadges}>
                  <Badge tone={getStatusTone(selectedAction.status)}>
                    {getStatusLabel(selectedAction.status)}
                  </Badge>
                  <Badge tone="blue">
                    {getTypeLabel(selectedAction.actionType)}
                  </Badge>
                  <Badge
                    tone={
                      (selectedAction.confidence ?? 0) >= 75
                        ? 'green'
                        : 'orange'
                    }
                  >
                    {Math.round(selectedAction.confidence ?? 0)}% confiança
                  </Badge>
                </div>
                <div style={styles.queueTopLine}>
                  <div>
                    <CardTitle>{selectedAction.name}</CardTitle>
                    <CardDescription>
                      Solicitada em {formatDateTime(selectedAction.requestedAt)}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      void openRecord(selectedAction.id, 'aiAction')
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

              <div style={styles.detailBody}>
                <div style={styles.narrative}>
                  <section style={styles.narrativeBlock}>
                    <p style={styles.narrativeLabel}>Evidência e raciocínio</p>
                    <p style={styles.narrativeText}>
                      {selectedAction.rationale?.markdown ||
                        'A proposta não possui justificativa registrada.'}
                    </p>
                  </section>
                  <section
                    style={{
                      ...styles.narrativeBlock,
                      background: themeCssVariables.background.transparent.blue,
                      borderColor: themeCssVariables.border.color.blue,
                    }}
                  >
                    <p style={styles.narrativeLabel}>Ação proposta</p>
                    <p style={styles.narrativeText}>
                      {selectedAction.proposedAction?.markdown ||
                        'Nenhuma ação detalhada foi registrada.'}
                    </p>
                  </section>
                  {selectedAction.approvalNotes?.markdown ? (
                    <section style={styles.narrativeBlock}>
                      <p style={styles.narrativeLabel}>Decisão humana</p>
                      <p style={styles.narrativeText}>
                        {selectedAction.approvalNotes.markdown}
                      </p>
                    </section>
                  ) : null}
                  {selectedAction.executionReceipt?.markdown ? (
                    <section style={styles.narrativeBlock}>
                      <p style={styles.narrativeLabel}>Recibo de execução</p>
                      <p style={styles.narrativeText}>
                        {selectedAction.executionReceipt.markdown}
                      </p>
                    </section>
                  ) : null}
                </div>

                <aside style={styles.decisionRail}>
                  <Card variant="muted">
                    <CardHeader>
                      <CardTitle>Contexto vinculado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={styles.contextList}>
                        {getLinkedRecords(selectedAction).length === 0 ? (
                          <CardDescription>
                            Nenhum registro do CRM vinculado.
                          </CardDescription>
                        ) : (
                          getLinkedRecords(selectedAction).map(
                            ({ record, label, objectNameSingular, icon }) => (
                              <button
                                key={`${objectNameSingular}:${record.id}`}
                                type="button"
                                style={styles.contextButton}
                                onClick={() =>
                                  void openRecord(record.id, objectNameSingular)
                                }
                              >
                                {icon}
                                <span style={{ flex: 1 }}>
                                  <strong>{label}</strong>
                                  <br />
                                  {getRecordName(record) || 'Sem nome'}
                                </span>
                                <IconExternalLink
                                  size={themeCssVariables.icon.size.sm}
                                  stroke={themeCssVariables.icon.stroke.sm}
                                />
                              </button>
                            ),
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedAction.status === 'PENDING_APPROVAL' ? (
                    <Card variant={currentReviewer ? 'accent' : 'danger'}>
                      <CardHeader>
                        <CardTitle>Decisão humana</CardTitle>
                        <CardDescription>
                          {currentReviewer
                            ? 'Aprovar não executa automaticamente. Apenas libera a proposta para um executor seguro.'
                            : 'A sessão não está vinculada a um membro do workspace. A decisão está bloqueada.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <textarea
                          aria-label="Nota da decisão"
                          placeholder="Justificativa, ajuste ou condição para a decisão..."
                          value={reviewNote}
                          disabled={!currentReviewer}
                          style={styles.reviewTextarea}
                          onChange={(event) =>
                            setReviewNote(event.target.value)
                          }
                        />
                        <div
                          style={{
                            ...styles.decisionButtons,
                            marginTop: themeCssVariables.spacing[2],
                          }}
                        >
                          <Button
                            variant="danger"
                            disabled={
                              !currentReviewer ||
                              busyActionId === selectedAction.id
                            }
                            onClick={() =>
                              void reviewAction(
                                selectedAction.id,
                                'REJECTED',
                                reviewNote,
                              ).then((saved) => {
                                if (saved) {
                                  setReviewNote('');
                                }
                              })
                            }
                          >
                            <IconX
                              size={themeCssVariables.icon.size.sm}
                              stroke={themeCssVariables.icon.stroke.md}
                            />
                            Rejeitar
                          </Button>
                          <Button
                            disabled={
                              !currentReviewer ||
                              busyActionId === selectedAction.id
                            }
                            onClick={() =>
                              void reviewAction(
                                selectedAction.id,
                                'APPROVED',
                                reviewNote,
                              ).then((saved) => {
                                if (saved) {
                                  setReviewNote('');
                                }
                              })
                            }
                          >
                            <IconCheck
                              size={themeCssVariables.icon.size.sm}
                              stroke={themeCssVariables.icon.stroke.md}
                            />
                            Aprovar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : selectedAction.status === 'APPROVED' ? (
                    <Card variant="accent">
                      <CardHeader>
                        <CardTitle>Executor interno seguro</CardTitle>
                        <CardDescription>
                          {isPipelineAction
                            ? 'Move uma única oportunidade entre etapas reais do workspace após prévia e confirmação explícita.'
                            : 'Converte a proposta aprovada em tarefa nativa, responsável, prazo, vínculos CRM e recibo.'}{' '}
                          Comunicação externa permanece bloqueada.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {executionPreview?.supported === false ? (
                          <div style={styles.blockedExecution}>
                            <strong>Execução direta bloqueada</strong>
                            <span>{executionPreview.blockedReason}</span>
                          </div>
                        ) : executionPreview?.supported === true &&
                          executionPreview.executionKind === 'TASK' ? (
                          <div style={styles.executionPreview}>
                            <div style={styles.executionPreviewHeader}>
                              <span style={styles.executionPreviewIcon}>
                                <IconListCheck
                                  size={themeCssVariables.icon.size.sm}
                                  stroke={themeCssVariables.icon.stroke.md}
                                />
                              </span>
                              <div>
                                <strong>{executionPreview.task.title}</strong>
                                <p style={styles.executionPreviewMeta}>
                                  <IconCalendarDue
                                    size={themeCssVariables.icon.size.sm}
                                    stroke={themeCssVariables.icon.stroke.sm}
                                  />
                                  {formatDateTime(executionPreview.task.dueAt)}
                                </p>
                              </div>
                            </div>
                            <div style={styles.executionFactList}>
                              <span>
                                Responsável:{' '}
                                <strong>
                                  {getRecordName(
                                    executionPreview.task.assignee,
                                  ) || 'Membro do workspace'}
                                </strong>
                              </span>
                              <span>
                                Vínculos CRM:{' '}
                                <strong>
                                  {executionPreview.task.targets.length}
                                </strong>
                              </span>
                              <span>
                                Confirmação válida até:{' '}
                                <strong>
                                  {formatDateTime(executionPreview.expiresAt)}
                                </strong>
                              </span>
                            </div>
                            {executionPreview.task.targets.length > 0 ? (
                              <div style={styles.executionTargets}>
                                {executionPreview.task.targets.map((target) => (
                                  <Badge
                                    key={`${target.objectNameSingular}:${target.id}`}
                                    tone="gray"
                                  >
                                    {target.label}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : pipelinePreview ? (
                          <div style={styles.executionPreview}>
                            <div style={styles.executionPreviewHeader}>
                              <span style={styles.executionPreviewIcon}>
                                <IconTarget
                                  size={themeCssVariables.icon.size.sm}
                                  stroke={themeCssVariables.icon.stroke.md}
                                />
                              </span>
                              <div>
                                <strong>
                                  {pipelinePreview.requiresTargetStage
                                    ? pipelinePreview.opportunity.name
                                    : pipelinePreview.pipelineChange.opportunity
                                        .name}
                                </strong>
                                <p style={styles.executionPreviewMeta}>
                                  Etapa atual:{' '}
                                  {pipelinePreview.requiresTargetStage
                                    ? pipelinePreview.currentStage.label
                                    : pipelinePreview.pipelineChange.sourceStage
                                        .label}
                                </p>
                              </div>
                            </div>
                            <label style={styles.pipelineField}>
                              <span style={styles.narrativeLabel}>
                                Etapa de destino
                              </span>
                              <select
                                aria-label="Etapa de destino da oportunidade"
                                value={pipelineTargetStage}
                                style={styles.pipelineSelect}
                                onChange={(event) =>
                                  setPipelineTargets((current) => ({
                                    ...current,
                                    [selectedAction.id]: event.target.value,
                                  }))
                                }
                              >
                                <option value="">Selecione uma etapa</option>
                                {pipelinePreview.stageOptions.map((stage) => (
                                  <option
                                    key={stage.value}
                                    value={stage.value}
                                    disabled={
                                      stage.value ===
                                      (pipelinePreview.requiresTargetStage
                                        ? pipelinePreview.currentStage.value
                                        : pipelinePreview.pipelineChange
                                            .sourceStage.value)
                                    }
                                  >
                                    {stage.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            {pipelinePreview.requiresTargetStage === false &&
                            isPipelineConfirmationReady ? (
                              <div style={styles.executionFactList}>
                                <span>
                                  Mudança:{' '}
                                  <strong>
                                    {
                                      pipelinePreview.pipelineChange.sourceStage
                                        .label
                                    }{' '}
                                    →{' '}
                                    {
                                      pipelinePreview.pipelineChange.targetStage
                                        .label
                                    }
                                  </strong>
                                </span>
                                <span>
                                  Confirmação válida até:{' '}
                                  <strong>
                                    {formatDateTime(pipelinePreview.expiresAt)}
                                  </strong>
                                </span>
                              </div>
                            ) : pipelineTargetStage ? (
                              <div style={styles.executionGuardrail}>
                                <IconShield
                                  size={themeCssVariables.icon.size.sm}
                                  stroke={themeCssVariables.icon.stroke.md}
                                />
                                Gere a prévia exata desta mudança antes de
                                confirmar.
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div style={styles.executionGuardrail}>
                            <IconShield
                              size={themeCssVariables.icon.size.sm}
                              stroke={themeCssVariables.icon.stroke.md}
                            />
                            A prévia não altera registros e expira em dez
                            minutos.
                          </div>
                        )}

                        <div
                          style={{
                            ...styles.executionButtons,
                            marginTop: themeCssVariables.spacing[3],
                          }}
                        >
                          <Button
                            variant={
                              executionPreview === null ? 'default' : 'ghost'
                            }
                            disabled={
                              busyExecution?.actionId === selectedAction.id ||
                              (isPipelineAction &&
                                pipelinePreview !== null &&
                                !pipelineTargetStage)
                            }
                            onClick={() =>
                              void executeAction(
                                selectedAction.id,
                                'PREVIEW',
                                isPipelineAction && pipelineTargetStage
                                  ? { targetStage: pipelineTargetStage }
                                  : undefined,
                              )
                            }
                          >
                            <IconRefresh
                              size={themeCssVariables.icon.size.sm}
                              stroke={themeCssVariables.icon.stroke.md}
                            />
                            {isPipelineAction
                              ? pipelinePreview === null
                                ? 'Carregar etapas'
                                : !pipelineTargetStage
                                  ? 'Escolha o destino'
                                  : isPipelineConfirmationReady
                                    ? 'Atualizar prévia'
                                    : 'Gerar prévia da mudança'
                              : executionPreview === null
                                ? 'Gerar prévia'
                                : 'Atualizar prévia'}
                          </Button>
                          {executionPreview?.supported === true &&
                          executionPreview.executionKind === 'TASK' ? (
                            <Button
                              disabled={
                                busyExecution?.actionId === selectedAction.id
                              }
                              onClick={() =>
                                void executeAction(selectedAction.id, 'APPLY', {
                                  confirmationToken:
                                    executionPreview.confirmationToken,
                                })
                              }
                            >
                              <IconPlayerPlay
                                size={themeCssVariables.icon.size.sm}
                                stroke={themeCssVariables.icon.stroke.md}
                              />
                              Confirmar e criar tarefa
                            </Button>
                          ) : pipelinePreview?.requiresTargetStage === false &&
                            isPipelineConfirmationReady ? (
                            <Button
                              disabled={
                                busyExecution?.actionId === selectedAction.id
                              }
                              onClick={() =>
                                void executeAction(selectedAction.id, 'APPLY', {
                                  confirmationToken:
                                    pipelinePreview.confirmationToken,
                                })
                              }
                            >
                              <IconPlayerPlay
                                size={themeCssVariables.icon.size.sm}
                                stroke={themeCssVariables.icon.stroke.md}
                              />
                              Confirmar mudança de etapa
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </aside>
              </div>
            </>
          )}
        </Card>
      </section>

      <section>
        <div
          style={{
            ...styles.queueTopLine,
            marginBottom: themeCssVariables.spacing[3],
          }}
        >
          <div>
            <CardTitle>Trilha recente</CardTitle>
            <CardDescription>
              Últimas decisões e recibos operacionais.
            </CardDescription>
          </div>
        </div>
        <div style={styles.auditGrid}>
          {actions
            .filter(({ status }) => status !== 'PENDING_APPROVAL')
            .slice(0, 4)
            .map((action) => (
              <Card
                key={action.id}
                variant={action.status === 'FAILED' ? 'danger' : 'muted'}
                style={styles.auditCard}
                onClick={() => setSelectedActionId(action.id)}
              >
                <CardHeader>
                  <div style={styles.queueTopLine}>
                    <Badge tone={getStatusTone(action.status)}>
                      {getStatusLabel(action.status)}
                    </Badge>
                    <span style={styles.metricLabel}>
                      {formatDateTime(
                        action.executedAt ||
                          action.approvedAt ||
                          action.requestedAt,
                      )}
                    </span>
                  </div>
                  <CardTitle
                    style={{ fontSize: themeCssVariables.font.size.sm }}
                  >
                    {action.name}
                  </CardTitle>
                  <CardDescription>
                    {getRecordName(action.reviewer)
                      ? `por ${getRecordName(action.reviewer)}`
                      : 'sem revisor vinculado'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          {actions.filter(({ status }) => status !== 'PENDING_APPROVAL')
            .length === 0 ? (
            <Card style={{ gridColumn: '1 / -1' }}>
              <div style={styles.empty}>
                Nenhuma decisão registrada até agora.
              </div>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: AI_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-ai-command-center',
  description:
    'Console visual para revisar propostas de IA, registrar decisões humanas e acompanhar recibos.',
  component: AiCommandCenterFrontComponent,
});
