import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';

import {
  CommandCenterCard,
  CommandCenterEmptyState,
  CommandCenterGrid,
  CommandCenterList,
  CommandCenterRow,
} from '@/diex-command-centers/components/CommandCenterLayout';
import {
  type CustomerSuccessMilestoneActionDraft,
  type CustomerSuccessMilestonePreview,
  type CustomerSuccessPlan,
  type CustomerSuccessReviewResult,
} from '@/diex-command-centers/customer-success/types';
import { DIEX_CONTROLLER_ROUTES } from '@/diex-command-centers/constants/DiexControllerRoutes';
import {
  formatDate,
  formatPlanMoney,
  getDatePressureLabel,
  getRecordName,
  healthColor,
  healthLabel,
  lifecycleLabel,
} from '@/diex-command-centers/customer-success/utils';
import { postLogicFunction } from '@/diex-command-centers/utils/useLogicFunctionRequest';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button, ProgressBar, Tag } from 'diex-ui';
import { themeCssVariables } from 'diex-ui/theme-constants';

const StyledText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
`;
const StyledFacts = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;
const StyledFact = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  padding-bottom: ${themeCssVariables.spacing[2]};
`;
const StyledFactLabel = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin: 0;
`;
const StyledFactValue = styled.p`
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: ${themeCssVariables.spacing[1]} 0 0;
`;
const StyledForm = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledInput = styled.textarea`
  border: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  font: inherit;
  min-height: 64px;
  padding: ${themeCssVariables.spacing[2]};
  width: 100%;
`;
const StyledSelect = styled.select`
  border: 1px solid ${themeCssVariables.border.color.light};
  min-height: ${themeCssVariables.spacing[8]};
`;

export const CustomerSuccessPlanOperation = ({
  plan,
  onCompleted,
}: {
  plan: CustomerSuccessPlan | null;
  onCompleted: () => Promise<unknown>;
}) => {
  const {
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
  } = useSnackBar();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const [review, setReview] = useState<CustomerSuccessReviewResult | null>(
    null,
  );
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null,
  );
  const [milestoneDraft, setMilestoneDraft] =
    useState<CustomerSuccessMilestoneActionDraft>({
      action: 'START',
      outcome: '',
      evidence: '',
      impact: 'RATING_3',
    });
  const [milestonePreview, setMilestonePreview] =
    useState<CustomerSuccessMilestonePreview | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const milestones = plan
    ? [...plan.milestones].sort(
        (left, right) =>
          (left.status === 'COMPLETED' ? 1 : 0) -
            (right.status === 'COMPLETED' ? 1 : 0) ||
          new Date(left.dueAt ?? '2999-12-31').getTime() -
            new Date(right.dueAt ?? '2999-12-31').getTime(),
      )
    : [];
  const milestone =
    milestones.find(({ id }) => id === selectedMilestoneId) ??
    milestones.find(
      ({ status }) => !['COMPLETED', 'CANCELLED'].includes(status),
    ) ??
    milestones[0] ??
    null;

  useEffect(() => {
    setReview(null);
    setSelectedMilestoneId(null);
  }, [plan?.id]);
  useEffect(() => {
    if (!milestone) return;
    setMilestoneDraft({
      action: milestone.status === 'IN_PROGRESS' ? 'COMPLETE' : 'START',
      outcome: milestone.outcome?.markdown ?? '',
      evidence: milestone.evidence?.markdown ?? '',
      impact: milestone.impact ?? 'RATING_3',
    });
    setMilestonePreview(null);
  }, [milestone?.id, milestone?.status]);

  if (!plan)
    return (
      <CommandCenterCard title="Operação do plano">
        <CommandCenterEmptyState message="Selecione um plano para abrir a operação de Customer Success." />
      </CommandCenterCard>
    );

  const runReview = async (mode: 'PREVIEW' | 'APPLY') => {
    setIsBusy(true);
    try {
      const result = await postLogicFunction<CustomerSuccessReviewResult>(
        DIEX_CONTROLLER_ROUTES.customerSuccessReview,
        { successPlanId: plan.id, mode },
      );
      setReview(result);
      if (mode === 'APPLY') await onCompleted();
      enqueueSuccessSnackBar({
        message:
          mode === 'APPLY'
            ? 'Revisão aplicada e governança atualizada.'
            : 'Prévia concluída sem alterar o plano.',
      });
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível concluir a revisão de CS.',
      });
    } finally {
      setIsBusy(false);
    }
  };
  const previewMilestone = async () => {
    if (!milestone) return;
    setIsBusy(true);
    try {
      const result = await postLogicFunction<CustomerSuccessMilestonePreview>(
        DIEX_CONTROLLER_ROUTES.customerSuccessMilestoneAction,
        {
          milestoneId: milestone.id,
          ...milestoneDraft,
          previewOnly: true,
          confirmUpdate: false,
        },
      );
      setMilestonePreview(result);
      if (result.supported) {
        enqueueSuccessSnackBar({
          message: 'Prévia do marco gerada sem alterar registros.',
        });
      } else {
        enqueueWarningSnackBar({
          message: result.blockedReason ?? result.message,
        });
      }
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível gerar a prévia do marco.',
      });
    } finally {
      setIsBusy(false);
    }
  };
  const confirmMilestone = async () => {
    if (!milestone || !milestonePreview?.confirmationToken) return;
    setIsBusy(true);
    try {
      const result = await postLogicFunction<{
        milestoneUpdated: boolean;
        message: string;
      }>(DIEX_CONTROLLER_ROUTES.customerSuccessMilestoneAction, {
        milestoneId: milestone.id,
        ...milestoneDraft,
        previewOnly: false,
        confirmUpdate: true,
        confirmationToken: milestonePreview.confirmationToken,
      });
      if (!result.milestoneUpdated) throw new Error('milestone-not-updated');
      await onCompleted();
      enqueueSuccessSnackBar({ message: result.message });
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível confirmar a atualização do marco.',
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <CommandCenterGrid>
      <CommandCenterCard title={plan.name}>
        <CommandCenterList>
          <CommandCenterRow
            title={getRecordName(plan.company) || 'Empresa não vinculada'}
            detail={`${lifecycleLabel(plan.lifecycle)} · renovação ${getDatePressureLabel(plan.renewalDate)}`}
            action={
              <>
                <Tag
                  color={healthColor(plan.health)}
                  text={healthLabel(plan.health)}
                />
                <Button
                  title="Abrir plano"
                  size="small"
                  variant="tertiary"
                  onClick={() =>
                    openRecordInSidePanel({
                      recordId: plan.id,
                      objectNameSingular: 'successPlan',
                    })
                  }
                />
              </>
            }
          />
        </CommandCenterList>
        <StyledFacts>
          {[
            [
              'Receita recorrente',
              formatPlanMoney(plan.recurringRevenue, false),
            ],
            [
              'Renovação',
              `${formatDate(plan.renewalDate)} · ${getDatePressureLabel(plan.renewalDate)}`,
            ],
            ['Responsável de CS', getRecordName(plan.owner) || 'Não definido'],
            [
              'Próxima revisão',
              `${formatDate(plan.nextReviewAt)} · ${getDatePressureLabel(plan.nextReviewAt)}`,
            ],
          ].map(([label, value]) => (
            <StyledFact key={label}>
              <StyledFactLabel>{label}</StyledFactLabel>
              <StyledFactValue>{value}</StyledFactValue>
            </StyledFact>
          ))}
        </StyledFacts>
        <StyledFactLabel>Valor reconhecido e riscos</StyledFactLabel>
        <StyledText>
          {plan.executiveSummary?.markdown ||
            plan.objectives?.markdown ||
            'O resumo executivo ainda não foi construído.'}
        </StyledText>
        {plan.risks?.markdown ? (
          <StyledText>Riscos registrados: {plan.risks.markdown}</StyledText>
        ) : null}
      </CommandCenterCard>
      <CommandCenterCard title="Revisão inteligente de CS">
        {review ? (
          <>
            <Tag
              color={healthColor(review.health.health)}
              text={`${healthLabel(review.health.health)} · ${review.health.score}/100`}
            />
            <StyledText>{review.summary}</StyledText>
            <StyledFactLabel>Intervenção recomendada</StyledFactLabel>
            <StyledText>{review.intervention}</StyledText>
            {review.gaps ? (
              <StyledText>Lacunas: {review.gaps}</StyledText>
            ) : null}
            {review.mode === 'APPLY' && review.aiActionId ? (
              <Button
                title="Abrir proposta governada"
                size="small"
                variant="tertiary"
                onClick={() =>
                  openRecordInSidePanel({
                    recordId: review.aiActionId as string,
                    objectNameSingular: 'aiAction',
                  })
                }
              />
            ) : null}
          </>
        ) : (
          <StyledText>
            A prévia é somente leitura; não altera saúde, tarefas ou mensagens.
          </StyledText>
        )}
        <Button
          title="Gerar prévia"
          size="small"
          variant="secondary"
          isLoading={isBusy}
          onClick={() => void runReview('PREVIEW')}
        />
        {review && (review.mode !== 'APPLY' || !review.successPlanUpdated) ? (
          <Button
            title="Aplicar revisão e governar ação"
            size="small"
            isLoading={isBusy}
            onClick={() => void runReview('APPLY')}
          />
        ) : null}
      </CommandCenterCard>
      <CommandCenterCard title="Marcos da jornada">
        {milestones.length === 0 ? (
          <CommandCenterEmptyState message="Nenhum marco foi cadastrado para este plano." />
        ) : (
          <CommandCenterList>
            {milestones.slice(0, 5).map((item) => (
              <CommandCenterRow
                key={item.id}
                title={item.name}
                detail={`${item.category ?? 'Sem categoria'} · ${formatDate(item.dueAt)}`}
                action={
                  <Button
                    title={
                      item.id === milestone?.id ? 'Selecionado' : 'Selecionar'
                    }
                    size="small"
                    variant="tertiary"
                    onClick={() => setSelectedMilestoneId(item.id)}
                  />
                }
              />
            ))}
          </CommandCenterList>
        )}
        {milestone ? (
          <StyledForm>
            <StyledFactLabel>Execução: {milestone.name}</StyledFactLabel>
            <StyledSelect
              value={milestoneDraft.action}
              onChange={(event) =>
                setMilestoneDraft({
                  ...milestoneDraft,
                  action: event.target
                    .value as CustomerSuccessMilestoneActionDraft['action'],
                })
              }
            >
              <option value="START">Iniciar ou retomar</option>
              <option value="BLOCK">Registrar bloqueio</option>
              <option value="COMPLETE">Concluir com evidência</option>
            </StyledSelect>
            {milestoneDraft.action === 'COMPLETE' ? (
              <StyledSelect
                value={milestoneDraft.impact}
                onChange={(event) =>
                  setMilestoneDraft({
                    ...milestoneDraft,
                    impact: event.target.value,
                  })
                }
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={`RATING_${value}`}>
                    {value} de 5
                  </option>
                ))}
              </StyledSelect>
            ) : null}
            {milestoneDraft.action !== 'START' ? (
              <>
                <StyledInput
                  value={milestoneDraft.outcome}
                  placeholder="Resultado ou bloqueio"
                  onChange={(event) =>
                    setMilestoneDraft({
                      ...milestoneDraft,
                      outcome: event.target.value,
                    })
                  }
                />
                <StyledInput
                  value={milestoneDraft.evidence}
                  placeholder="Evidência"
                  onChange={(event) =>
                    setMilestoneDraft({
                      ...milestoneDraft,
                      evidence: event.target.value,
                    })
                  }
                />
              </>
            ) : null}
            <Button
              title="Gerar prévia"
              size="small"
              variant="secondary"
              isLoading={isBusy}
              onClick={() => void previewMilestone()}
            />
            {milestonePreview?.supported && milestonePreview.preview ? (
              <>
                <StyledText>
                  {milestonePreview.preview.effects.join(' · ')}
                </StyledText>
                {milestonePreview.preview.warnings.map((warning) => (
                  <StyledText key={warning}>{warning}</StyledText>
                ))}
                <Button
                  title="Confirmar atualização"
                  size="small"
                  isLoading={isBusy}
                  onClick={() => void confirmMilestone()}
                />
              </>
            ) : milestonePreview?.supported === false ? (
              <StyledText>
                {milestonePreview.blockedReason ?? milestonePreview.message}
              </StyledText>
            ) : null}
          </StyledForm>
        ) : null}
      </CommandCenterCard>
      <CommandCenterCard title="Prontidão do plano">
        <StyledFactLabel>
          Adoção ativa {plan.activeUseRating?.replace('RATING_', '') ?? '0'}/5
        </StyledFactLabel>
        <ProgressBar
          value={Number(plan.activeUseRating?.replace('RATING_', '') ?? 0) * 20}
        />
        <StyledFactLabel>
          Evidência de valor{' '}
          {plan.valueEvidenceRating?.replace('RATING_', '') ?? '0'}/5
        </StyledFactLabel>
        <ProgressBar
          value={
            Number(plan.valueEvidenceRating?.replace('RATING_', '') ?? 0) * 20
          }
        />
        <StyledText>
          {getRecordName(plan.primaryContact) || 'contato principal ausente'} ·{' '}
          {
            plan.aiActions.filter(({ status }) =>
              ['PENDING_APPROVAL', 'APPROVED'].includes(status),
            ).length
          }{' '}
          ações abertas
        </StyledText>
      </CommandCenterCard>
    </CommandCenterGrid>
  );
};
