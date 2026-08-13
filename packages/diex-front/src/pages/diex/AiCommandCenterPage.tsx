import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';

import {
  CommandCenterCard,
  CommandCenterEmptyState,
  CommandCenterGrid,
  CommandCenterList,
  CommandCenterLoadingState,
  CommandCenterMetric,
  CommandCenterMetrics,
  CommandCenterPage,
  CommandCenterRow,
  CommandCenterStartState,
} from '@/diex-command-centers/components/CommandCenterLayout';
import { type AiAction } from '@/diex-command-centers/ai/types';
import { useAiCommandCenter } from '@/diex-command-centers/ai/useAiCommandCenter';
import { getRecordName } from '@/diex-command-centers/customer-success/utils';
import { useDiexPagePresentation } from '@/diex-onboarding/hooks/useDiexPagePresentation';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { Button, Tag } from 'diex-ui';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isDefined } from 'diex-shared/utils';

const StyledText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.5;
  margin: ${themeCssVariables.spacing[2]} 0;
  white-space: pre-wrap;
`;
const StyledTextarea = styled.textarea`
  border: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  font: inherit;
  min-height: 84px;
  padding: ${themeCssVariables.spacing[2]};
  width: 100%;
`;
const StyledSelect = styled.select`
  border: 1px solid ${themeCssVariables.border.color.light};
  min-height: ${themeCssVariables.spacing[8]};
  width: 100%;
`;
const StyledButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const statusColor = (
  status: string,
): 'blue' | 'green' | 'orange' | 'red' | 'gray' =>
  status === 'PENDING_APPROVAL'
    ? 'orange'
    : status === 'APPROVED'
      ? 'blue'
      : status === 'EXECUTING'
        ? 'orange'
        : status === 'EXECUTED'
          ? 'green'
          : ['REJECTED', 'FAILED'].includes(status)
            ? 'red'
            : 'gray';
const statusLabel = (status: string) =>
  ({
    DRAFT: 'Rascunho',
    PENDING_APPROVAL: 'Aguardando aprovação',
    APPROVED: 'Aprovada',
    EXECUTING: 'Em execução',
    REJECTED: 'Rejeitada',
    EXECUTED: 'Executada',
    FAILED: 'Falhou',
  })[status] ?? status;
const typeLabel = (type: string) =>
  ({
    QUALIFY: 'Qualificar',
    REPLY: 'Responder',
    FOLLOW_UP: 'Follow-up',
    PIPELINE_UPDATE: 'Atualizar pipeline',
    RISK_MITIGATION: 'Mitigar risco',
    CS_INTERVENTION: 'Intervenção de CS',
    EXPANSION: 'Expansão',
  })[type] ?? type;
const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'sem data';
const linkedRecords = (action: AiAction) =>
  [
    [action.opportunity, 'Oportunidade', 'opportunity'],
    [action.commercialSignal, 'Sinal comercial', 'commercialSignal'],
    [action.successPlan, 'Plano de sucesso', 'successPlan'],
    [action.customerRenewal, 'Renovação', 'customerRenewal'],
    [action.inboxConversation, 'Conversa', 'inboxConversation'],
    [
      action.executionTask
        ? { id: action.executionTask.id, name: action.executionTask.title }
        : null,
      'Tarefa executada',
      'task',
    ],
  ] as const;

export const AiCommandCenterPage = () => {
  const pagePresentation = useDiexPagePresentation({
    pageKey: 'ai-governance-operations',
    fallbackLabel: 'Centro de IA',
    fallbackDescription:
      'Propostas rastreáveis, decisão humana e recibo antes de qualquer efeito externo.',
  });
  const {
    actions,
    actionTotalCount,
    isPartial,
    dataLoadedAt,
    currentReviewer,
    isLoading,
    errorMessage,
    busyActionId,
    busyExecution,
    executionPreviews,
    load,
    reviewAction,
    executeAction,
  } = useAiCommandCenter();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const [filter, setFilter] = useState<
    'PENDING' | 'APPROVED' | 'HISTORY' | 'ALL'
  >('PENDING');
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
    const reviewed = actions.filter(({ status }) =>
      ['APPROVED', 'REJECTED'].includes(status),
    );
    return {
      pending,
      approved,
      executed,
      failed,
      approvalRate: reviewed.length
        ? Math.round(
            (reviewed.filter(({ status }) => status === 'APPROVED').length /
              reviewed.length) *
              100,
          )
        : 0,
    };
  }, [actions]);
  const visibleActions = useMemo(
    () =>
      actions
        .filter((action) =>
          filter === 'PENDING'
            ? action.status === 'PENDING_APPROVAL'
            : filter === 'APPROVED'
              ? action.status === 'APPROVED'
              : filter === 'HISTORY'
                ? ['REJECTED', 'EXECUTED', 'FAILED'].includes(action.status)
                : true,
        )
        .sort(
          (left, right) =>
            (right.status === 'PENDING_APPROVAL' ? 1 : 0) -
              (left.status === 'PENDING_APPROVAL' ? 1 : 0) ||
            new Date(right.requestedAt ?? 0).getTime() -
              new Date(left.requestedAt ?? 0).getTime(),
        ),
    [actions, filter],
  );
  const selectedAction =
    actions.find(({ id }) => id === selectedActionId) ??
    visibleActions[0] ??
    null;
  const execution = isDefined(selectedAction)
    ? executionPreviews[selectedAction.id]
    : null;
  const preview = execution?.mode === 'PREVIEW' ? execution : null;
  const pipelinePreview =
    preview?.supported && preview.executionKind === 'PIPELINE_UPDATE'
      ? preview
      : null;
  const targetStage = isDefined(selectedAction)
    ? (pipelineTargets[selectedAction.id] ?? '')
    : '';
  useEffect(() => {
    if (!visibleActions.some(({ id }) => id === selectedActionId))
      setSelectedActionId(visibleActions[0]?.id ?? null);
  }, [selectedActionId, visibleActions]);
  useEffect(() => {
    setReviewNote('');
  }, [selectedAction?.id]);
  const dataStatus = errorMessage
    ? actions.length > 0
      ? 'Falha ao atualizar · dados anteriores preservados'
      : 'Dados indisponíveis'
    : isLoading
      ? 'Atualizando dados reais'
      : dataLoadedAt
        ? `${isPartial ? 'Recorte atual' : 'Dados atuais'} · ${new Date(
            dataLoadedAt,
          ).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : 'Aguardando dados reais';

  return (
    <CommandCenterPage
      title={pagePresentation.label}
      description={pagePresentation.description}
      statusText={dataStatus}
    >
      {isLoading && actions.length === 0 ? <CommandCenterLoadingState /> : null}
      {errorMessage && actions.length === 0 ? (
        <CommandCenterCard title="Centro de IA">
          <CommandCenterEmptyState message={errorMessage} />
          <Button
            title="Tentar novamente"
            size="small"
            variant="secondary"
            onClick={() => void load()}
          />
        </CommandCenterCard>
      ) : null}
      {errorMessage && actions.length > 0 ? (
        <CommandCenterCard title="Qualidade dos dados">
          <CommandCenterRow
            title="A atualização mais recente falhou"
            detail="As propostas abaixo são da última consulta concluída. Atualize antes de aprovar ou executar uma ação sensível."
            action={
              <Button
                title="Tentar novamente"
                size="small"
                variant="secondary"
                onClick={() => void load()}
              />
            }
          />
        </CommandCenterCard>
      ) : null}
      {!isLoading && !errorMessage && actions.length === 0 ? (
        <CommandCenterCard title="A inteligência entra depois da primeira evidência">
          <CommandCenterStartState
            title="A fila de decisões ainda está vazia."
            message="A IA só propõe ações quando existir conversa, oportunidade, risco ou follow-up para analisar. Registre a primeira entrada real pelo canal escolhido para criar evidência."
          />
        </CommandCenterCard>
      ) : null}
      {actions.length > 0 ? (
        <>
          <CommandCenterCard title="Governança ativa">
            <CommandCenterRow
              title={
                currentReviewer
                  ? `Revisor: ${getRecordName(currentReviewer)}`
                  : 'Revisor não identificado'
              }
              detail={`Aprovação não executa automaticamente; o executor exige uma segunda confirmação. ${actions.length} de ${actionTotalCount} propostas carregadas.`}
              action={
                <Button
                  title="Atualizar"
                  size="small"
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() => void load()}
                />
              }
            />
          </CommandCenterCard>
          <CommandCenterMetrics>
            <CommandCenterMetric
              label="Aguardando decisão"
              value={metrics.pending.length}
            />
            <CommandCenterMetric
              label="Aprovadas, não executadas"
              value={metrics.approved.length}
            />
            <CommandCenterMetric
              label="Executadas"
              value={metrics.executed.length}
            />
            <CommandCenterMetric
              label="Taxa de aprovação"
              value={`${metrics.approvalRate}%`}
            />
          </CommandCenterMetrics>
          <CommandCenterGrid>
            <CommandCenterCard title="Fila de decisões">
              <StyledButtons>
                {(
                  [
                    ['PENDING', 'Pendentes'],
                    ['APPROVED', 'Aprovadas'],
                    ['HISTORY', 'Histórico'],
                    ['ALL', 'Todas'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    title={label}
                    size="small"
                    variant={filter === value ? 'secondary' : 'tertiary'}
                    onClick={() => setFilter(value)}
                  />
                ))}
              </StyledButtons>
              {visibleActions.length === 0 ? (
                <CommandCenterEmptyState message="Nenhuma ação neste filtro." />
              ) : (
                <CommandCenterList>
                  {visibleActions.map((action) => (
                    <CommandCenterRow
                      key={action.id}
                      title={action.name}
                      detail={`${typeLabel(action.actionType)} · ${Math.round(action.confidence ?? 0)}% confiança · ${formatDateTime(action.requestedAt)}`}
                      action={
                        <Button
                          title={
                            selectedAction?.id === action.id
                              ? 'Selecionada'
                              : 'Revisar'
                          }
                          size="small"
                          variant="tertiary"
                          onClick={() => setSelectedActionId(action.id)}
                        />
                      }
                    />
                  ))}
                </CommandCenterList>
              )}
            </CommandCenterCard>
            <CommandCenterCard
              title={selectedAction?.name ?? 'Revisão da proposta'}
            >
              {!isDefined(selectedAction) ? (
                <CommandCenterEmptyState message="Selecione uma proposta da fila para abrir a revisão." />
              ) : (
                <>
                  <StyledButtons>
                    <Tag
                      color={statusColor(selectedAction.status)}
                      text={statusLabel(selectedAction.status)}
                    />
                    <Tag
                      color="blue"
                      text={typeLabel(selectedAction.actionType)}
                    />
                    <Tag
                      color={
                        (selectedAction.confidence ?? 0) >= 75
                          ? 'green'
                          : 'orange'
                      }
                      text={`${Math.round(selectedAction.confidence ?? 0)}% confiança`}
                    />
                    <Button
                      title="Abrir registro"
                      size="small"
                      variant="tertiary"
                      onClick={() =>
                        openRecordInSidePanel({
                          recordId: selectedAction.id,
                          objectNameSingular: 'aiAction',
                        })
                      }
                    />
                  </StyledButtons>
                  <StyledText>
                    Evidência e raciocínio:{' '}
                    {selectedAction.rationale?.markdown ||
                      'A proposta não possui justificativa registrada.'}
                  </StyledText>
                  <StyledText>
                    Ação proposta:{' '}
                    {selectedAction.proposedAction?.markdown ||
                      'Nenhuma ação detalhada foi registrada.'}
                  </StyledText>
                  {selectedAction.approvalNotes?.markdown ? (
                    <StyledText>
                      Decisão humana: {selectedAction.approvalNotes.markdown}
                    </StyledText>
                  ) : null}
                  {selectedAction.executionReceipt?.markdown ? (
                    <StyledText>
                      Recibo de execução:{' '}
                      {selectedAction.executionReceipt.markdown}
                    </StyledText>
                  ) : null}
                  <CommandCenterList>
                    {linkedRecords(selectedAction)
                      .filter(([record]) => Boolean(record))
                      .map(([record, label, objectName]) => (
                        <CommandCenterRow
                          key={`${objectName}:${record?.id}`}
                          title={label}
                          detail={getRecordName(record)}
                          action={
                            <Button
                              title="Abrir"
                              size="small"
                              variant="tertiary"
                              onClick={() =>
                                record &&
                                openRecordInSidePanel({
                                  recordId: record.id,
                                  objectNameSingular: objectName,
                                })
                              }
                            />
                          }
                        />
                      ))}
                  </CommandCenterList>
                  {selectedAction.status === 'PENDING_APPROVAL' ? (
                    <>
                      <StyledTextarea
                        aria-label="Nota da decisão"
                        placeholder="Justificativa, ajuste ou condição para a decisão..."
                        value={reviewNote}
                        disabled={!currentReviewer || Boolean(errorMessage)}
                        onChange={(event) => setReviewNote(event.target.value)}
                      />
                      <StyledButtons>
                        <Button
                          title="Rejeitar"
                          size="small"
                          variant="tertiary"
                          disabled={
                            !currentReviewer ||
                            Boolean(errorMessage) ||
                            busyActionId === selectedAction.id
                          }
                          onClick={() =>
                            void reviewAction(
                              selectedAction.id,
                              'REJECTED',
                              reviewNote,
                            )
                          }
                        />
                        <Button
                          title="Aprovar"
                          size="small"
                          disabled={
                            !currentReviewer ||
                            Boolean(errorMessage) ||
                            busyActionId === selectedAction.id
                          }
                          onClick={() =>
                            void reviewAction(
                              selectedAction.id,
                              'APPROVED',
                              reviewNote,
                            )
                          }
                        />
                      </StyledButtons>
                    </>
                  ) : null}
                  {selectedAction.status === 'APPROVED' ? (
                    <>
                      <StyledText>
                        Toda execução exige aprovação humana, registro de
                        escopo, confirmação e recibo.
                      </StyledText>
                      {preview?.supported === false ? (
                        <StyledText>
                          Execução direta bloqueada: {preview.blockedReason}
                        </StyledText>
                      ) : null}
                      {preview?.supported &&
                      preview.executionKind === 'TASK' ? (
                        <StyledText>
                          Tarefa: {preview.task.title} · responsável{' '}
                          {getRecordName(preview.task.assignee)} · prazo{' '}
                          {formatDateTime(preview.task.dueAt)} ·{' '}
                          {preview.task.targets.length} vínculo(s)
                        </StyledText>
                      ) : null}
                      {preview?.supported &&
                      preview.executionKind === 'EXTERNAL_REPLY' ? (
                        <StyledText>
                          WhatsApp: {preview.externalMessage.textPreview}
                        </StyledText>
                      ) : null}
                      {pipelinePreview ? (
                        <>
                          <StyledSelect
                            value={targetStage}
                            disabled={Boolean(errorMessage)}
                            onChange={(event) =>
                              setPipelineTargets((current) => ({
                                ...current,
                                [selectedAction.id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Selecione uma etapa</option>
                            {pipelinePreview.stageOptions.map((stage) => (
                              <option key={stage.value} value={stage.value}>
                                {stage.label}
                              </option>
                            ))}
                          </StyledSelect>
                          {!pipelinePreview.requiresTargetStage ? (
                            <StyledText>
                              Mudança:{' '}
                              {pipelinePreview.pipelineChange.sourceStage.label}{' '}
                              →{' '}
                              {pipelinePreview.pipelineChange.targetStage.label}
                            </StyledText>
                          ) : null}
                        </>
                      ) : null}
                      <StyledButtons>
                        <Button
                          title={
                            pipelinePreview
                              ? 'Atualizar prévia'
                              : 'Gerar prévia'
                          }
                          size="small"
                          variant="secondary"
                          disabled={
                            Boolean(errorMessage) ||
                            busyExecution?.actionId === selectedAction.id ||
                            (selectedAction.actionType === 'PIPELINE_UPDATE' &&
                              pipelinePreview !== null &&
                              !targetStage)
                          }
                          onClick={() =>
                            void executeAction(
                              selectedAction.id,
                              'PREVIEW',
                              selectedAction.actionType === 'PIPELINE_UPDATE' &&
                                targetStage
                                ? { targetStage }
                                : undefined,
                            )
                          }
                        />
                        {preview?.supported &&
                        preview.executionKind === 'TASK' ? (
                          <Button
                            title="Confirmar e criar tarefa"
                            size="small"
                            disabled={
                              Boolean(errorMessage) ||
                              busyExecution?.actionId === selectedAction.id
                            }
                            onClick={() =>
                              void executeAction(selectedAction.id, 'APPLY', {
                                confirmationToken: preview.confirmationToken,
                              })
                            }
                          />
                        ) : preview?.supported &&
                          preview.executionKind === 'EXTERNAL_REPLY' ? (
                          <Button
                            title="Confirmar e enviar WhatsApp"
                            size="small"
                            disabled={
                              Boolean(errorMessage) ||
                              busyExecution?.actionId === selectedAction.id
                            }
                            onClick={() =>
                              void executeAction(selectedAction.id, 'APPLY', {
                                confirmationToken: preview.confirmationToken,
                              })
                            }
                          />
                        ) : pipelinePreview &&
                          !pipelinePreview.requiresTargetStage &&
                          targetStage ===
                            pipelinePreview.pipelineChange.targetStage.value ? (
                          <Button
                            title="Confirmar mudança de etapa"
                            size="small"
                            disabled={
                              Boolean(errorMessage) ||
                              busyExecution?.actionId === selectedAction.id
                            }
                            onClick={() =>
                              void executeAction(selectedAction.id, 'APPLY', {
                                confirmationToken:
                                  pipelinePreview.confirmationToken,
                              })
                            }
                          />
                        ) : null}
                      </StyledButtons>
                    </>
                  ) : null}
                  {selectedAction.status === 'EXECUTING' ? (
                    <>
                      <StyledText>
                        A execução já foi assumida. A reconciliação apenas busca
                        o recibo existente; ela não inicia outro envio nem
                        repete a alteração.
                      </StyledText>
                      {preview?.supported === false ? (
                        <StyledText>{preview.message}</StyledText>
                      ) : null}
                      <StyledButtons>
                        <Button
                          title="Reconciliar execução"
                          size="small"
                          variant="secondary"
                          disabled={
                            Boolean(errorMessage) ||
                            busyExecution?.actionId === selectedAction.id
                          }
                          onClick={() =>
                            void executeAction(selectedAction.id, 'PREVIEW')
                          }
                        />
                      </StyledButtons>
                    </>
                  ) : null}
                </>
              )}
            </CommandCenterCard>
          </CommandCenterGrid>
          <CommandCenterCard title="Trilha recente">
            {actions.filter(({ status }) => status !== 'PENDING_APPROVAL')
              .length === 0 ? (
              <CommandCenterEmptyState message="Nenhuma decisão registrada até agora." />
            ) : (
              <CommandCenterList>
                {actions
                  .filter(({ status }) => status !== 'PENDING_APPROVAL')
                  .slice(0, 4)
                  .map((action) => (
                    <CommandCenterRow
                      key={action.id}
                      title={action.name}
                      detail={`${statusLabel(action.status)} · ${formatDateTime(action.executedAt || action.approvedAt || action.requestedAt)} · ${getRecordName(action.reviewer) || 'sem revisor vinculado'}`}
                      action={
                        <Tag
                          color={statusColor(action.status)}
                          text={statusLabel(action.status)}
                        />
                      }
                    />
                  ))}
              </CommandCenterList>
            )}
          </CommandCenterCard>
        </>
      ) : null}
    </CommandCenterPage>
  );
};
