import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';

import {
  CommandCenterCard,
  CommandCenterEmptyState,
  CommandCenterList,
  CommandCenterRow,
} from '@/diex-command-centers/components/CommandCenterLayout';
import {
  type CustomerSuccessHandoffDraft,
  type CustomerSuccessHandoffOpportunity,
  type CustomerSuccessHandoffPreview,
  type CustomerSuccessWorkspaceMember,
} from '@/diex-command-centers/customer-success/types';
import {
  buildHandoffDraft,
  formatPlanMoney,
  getRecordName,
} from '@/diex-command-centers/customer-success/utils';
import { postLogicFunction } from '@/diex-command-centers/utils/useLogicFunctionRequest';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button, Tag } from 'twenty-ui';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledForm = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: ${themeCssVariables.spacing[3]};
`;

const StyledField = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
`;

const inputStyles = `
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 4px;
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font: inherit;
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledInput = styled.input`
  ${inputStyles}
`;
const StyledSelect = styled.select`
  ${inputStyles}
`;
const StyledTextarea = styled.textarea`
  ${inputStyles}
  min-height: 76px;
  padding: ${themeCssVariables.spacing[2]};
  resize: vertical;
`;

const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPreview = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  margin-top: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

export const CustomerSuccessHandoff = ({
  opportunities,
  workspaceMembers,
  currentWorkspaceMemberId,
  onCompleted,
}: {
  opportunities: CustomerSuccessHandoffOpportunity[];
  workspaceMembers: CustomerSuccessWorkspaceMember[];
  currentWorkspaceMemberId: string | null;
  onCompleted: () => Promise<unknown>;
}) => {
  const {
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
  } = useSnackBar();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<
    string | null
  >(null);
  const [draft, setDraft] = useState<CustomerSuccessHandoffDraft | null>(null);
  const [preview, setPreview] = useState<CustomerSuccessHandoffPreview | null>(
    null,
  );
  const [isBusy, setIsBusy] = useState(false);
  const selectedOpportunity =
    opportunities.find(({ id }) => id === selectedOpportunityId) ??
    opportunities[0] ??
    null;

  useEffect(() => {
    if (!selectedOpportunity) {
      setSelectedOpportunityId(null);
      setDraft(null);
      return;
    }
    setSelectedOpportunityId(selectedOpportunity.id);
    setDraft(
      buildHandoffDraft(
        selectedOpportunity,
        currentWorkspaceMemberId,
        workspaceMembers[0]?.id ?? '',
      ),
    );
    setPreview(null);
  }, [currentWorkspaceMemberId, selectedOpportunity?.id, workspaceMembers]);

  const updateDraft = (patch: Partial<CustomerSuccessHandoffDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setPreview(null);
  };
  const previewHandoff = async () => {
    if (!selectedOpportunity || !draft) return;
    setIsBusy(true);
    try {
      const result = await postLogicFunction<CustomerSuccessHandoffPreview>(
        '/diex/customer-success/handoff',
        {
          opportunityId: selectedOpportunity.id,
          ...draft,
          previewOnly: true,
          confirmCreate: false,
        },
      );
      setPreview(result);
      result.supported
        ? enqueueSuccessSnackBar({
            message: 'Prévia do handoff gerada sem criar registros.',
          })
        : enqueueWarningSnackBar({
            message: result.blockedReason ?? result.message,
          });
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível gerar a prévia do handoff.',
      });
    } finally {
      setIsBusy(false);
    }
  };
  const confirmHandoff = async () => {
    if (!selectedOpportunity || !draft || !preview?.confirmationToken) return;
    setIsBusy(true);
    try {
      const result = await postLogicFunction<{
        created: boolean;
        successPlanId?: string;
        message: string;
        warnings: string[];
      }>('/diex/customer-success/handoff', {
        opportunityId: selectedOpportunity.id,
        ...draft,
        previewOnly: false,
        confirmCreate: true,
        confirmationToken: preview.confirmationToken,
      });
      if (!result.created || !result.successPlanId)
        throw new Error('handoff-not-created');
      await onCompleted();
      enqueueSuccessSnackBar({ message: result.message });
      openRecordInSidePanel({
        recordId: result.successPlanId,
        objectNameSingular: 'successPlan',
      });
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível confirmar a entrada no CS.',
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <CommandCenterCard title="Entrada de novos clientes">
      {opportunities.length === 0 ? (
        <CommandCenterEmptyState message="Nenhuma oportunidade em Fechado ganho está sem plano de sucesso." />
      ) : (
        <>
          <CommandCenterList>
            {opportunities.map((opportunity) => (
              <CommandCenterRow
                key={opportunity.id}
                title={opportunity.name ?? 'Oportunidade sem nome'}
                detail={`${getRecordName(opportunity.company) || 'Empresa não vinculada'} · ${formatPlanMoney(opportunity.amount)}`}
                action={
                  <Button
                    title="Selecionar"
                    size="small"
                    variant={
                      selectedOpportunity?.id === opportunity.id
                        ? 'secondary'
                        : 'tertiary'
                    }
                    onClick={() => setSelectedOpportunityId(opportunity.id)}
                  />
                }
              />
            ))}
          </CommandCenterList>
          {selectedOpportunity && draft ? (
            <StyledForm>
              <StyledField>
                Responsável de CS
                <StyledSelect
                  value={draft.ownerId}
                  onChange={(event) =>
                    updateDraft({ ownerId: event.target.value })
                  }
                >
                  <option value="">Selecione um responsável</option>
                  {workspaceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {getRecordName(member) || member.id}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>
              <StyledField>
                Data de renovação
                <StyledInput
                  type="date"
                  value={draft.renewalDate}
                  onChange={(event) =>
                    updateDraft({ renewalDate: event.target.value })
                  }
                />
              </StyledField>
              <StyledField>
                Receita recorrente (micros)
                <StyledInput
                  type="number"
                  value={draft.recurringRevenueMicros}
                  onChange={(event) =>
                    updateDraft({
                      recurringRevenueMicros: Number(event.target.value),
                    })
                  }
                />
              </StyledField>
              <StyledField>
                Moeda
                <StyledInput
                  value={draft.currencyCode}
                  onChange={(event) =>
                    updateDraft({
                      currencyCode: event.target.value.toUpperCase(),
                    })
                  }
                />
              </StyledField>
              <StyledField>
                Objetivos
                <StyledTextarea
                  value={draft.objectives}
                  onChange={(event) =>
                    updateDraft({ objectives: event.target.value })
                  }
                />
              </StyledField>
              <StyledField>
                Critérios de sucesso
                <StyledTextarea
                  value={draft.successCriteria}
                  onChange={(event) =>
                    updateDraft({ successCriteria: event.target.value })
                  }
                />
              </StyledField>
              <StyledActions>
                <Button
                  title="Abrir venda"
                  size="small"
                  variant="tertiary"
                  onClick={() =>
                    openRecordInSidePanel({
                      recordId: selectedOpportunity.id,
                      objectNameSingular: 'opportunity',
                    })
                  }
                />
                <Button
                  title="Gerar prévia"
                  size="small"
                  variant="secondary"
                  isLoading={isBusy}
                  onClick={() => void previewHandoff()}
                />
              </StyledActions>
            </StyledForm>
          ) : null}
          {preview ? (
            <StyledPreview>
              {preview.supported && preview.preview ? (
                <>
                  <p>
                    {preview.preview.plan.name} · renovação{' '}
                    {preview.preview.renewalDate}
                  </p>
                  <p>
                    {preview.preview.milestones.length} marco(s), tarefa de
                    kickoff: {preview.preview.task.title}.
                  </p>
                  {preview.preview.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                  <StyledActions>
                    <Button
                      title="Confirmar entrada no CS"
                      size="small"
                      isLoading={isBusy}
                      onClick={() => void confirmHandoff()}
                    />
                  </StyledActions>
                </>
              ) : (
                <p>{preview.blockedReason ?? preview.message}</p>
              )}
            </StyledPreview>
          ) : null}
        </>
      )}
    </CommandCenterCard>
  );
};
