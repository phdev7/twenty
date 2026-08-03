import { styled } from '@linaria/react';
import { type Dispatch, type SetStateAction } from 'react';

import {
  CommandCenterCard,
  CommandCenterEmptyState,
  CommandCenterList,
  CommandCenterRow,
} from '@/diex-command-centers/components/CommandCenterLayout';
import {
  type CustomerRenewal,
  type RenewalDraft,
  type RenewalWorkspaceMember,
} from '@/diex-command-centers/renewal/types';
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
} from '@/diex-command-centers/renewal/utils';
import { Button, Tag } from 'twenty-ui';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledForm = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;
const StyledField = styled.label<{ wide?: boolean }>`
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  grid-column: ${({ wide }) => (wide ? '1 / -1' : 'auto')};
`;
const controlStyles = `border: 1px solid ${themeCssVariables.border.color.light}; box-sizing: border-box; color: ${themeCssVariables.font.color.primary}; font: inherit; min-height: ${themeCssVariables.spacing[8]}; padding: 0 ${themeCssVariables.spacing[2]}; width: 100%;`;
const StyledInput = styled.input`
  ${controlStyles}
`;
const StyledSelect = styled.select`
  ${controlStyles}
`;
const StyledTextarea = styled.textarea`
  ${controlStyles} min-height: 76px;
  padding: ${themeCssVariables.spacing[2]};
  resize: vertical;
`;
const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  grid-column: 1 / -1;
`;

export const RenewalWorkbench = ({
  renewal,
  draft,
  setDraft,
  workspaceMembers,
  isBusy,
  onSave,
  onRecordTouch,
  onProposeAiIntervention,
}: {
  renewal: CustomerRenewal | null;
  draft: RenewalDraft | null;
  setDraft: Dispatch<SetStateAction<RenewalDraft | null>>;
  workspaceMembers: RenewalWorkspaceMember[];
  isBusy: boolean;
  onSave: (draft: RenewalDraft) => Promise<boolean>;
  onRecordTouch: () => Promise<boolean>;
  onProposeAiIntervention: () => Promise<boolean>;
}) => {
  if (!renewal || !draft)
    return (
      <CommandCenterCard title="Workbench da renovação">
        <CommandCenterEmptyState message="Selecione uma renovação na esteira ou abra um caso a partir de um plano de sucesso." />
      </CommandCenterCard>
    );
  const update = (patch: Partial<RenewalDraft>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const stage = getStage(renewal.stage);
  const risk = getRisk(renewal.risk);
  return (
    <>
      <CommandCenterCard title={renewal.name}>
        <CommandCenterList>
          <CommandCenterRow
            title={getRecordName(renewal.company) || 'Empresa não vinculada'}
            detail={getRecordName(renewal.owner) || 'Sem responsável'}
            action={
              <>
                <Tag color={stage.tone} text={stage.label} />
                <Tag
                  color={risk.tone}
                  text={`risco ${risk.label.toLowerCase()}`}
                />
                <Tag color="blue" text={renewal.forecast} />
              </>
            }
          />
        </CommandCenterList>
        <p>
          Valor:{' '}
          {formatMoney(
            getAmountMicros(renewal.renewalValue),
            renewal.renewalValue?.currencyCode ?? 'BRL',
            true,
          )}
        </p>
        <StyledForm>
          <StyledField>
            Etapa
            <StyledSelect
              value={draft.stage}
              onChange={(event) => update({ stage: event.target.value })}
            >
              {STAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </StyledSelect>
          </StyledField>
          <StyledField>
            Risco
            <StyledSelect
              value={draft.risk}
              onChange={(event) => update({ risk: event.target.value })}
            >
              {RISKS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </StyledSelect>
          </StyledField>
          <StyledField>
            Forecast
            <StyledSelect
              value={draft.forecast}
              onChange={(event) => update({ forecast: event.target.value })}
            >
              {FORECASTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </StyledSelect>
          </StyledField>
          <StyledField>
            Probabilidade (%)
            <StyledInput
              type="number"
              min={0}
              max={100}
              value={draft.probability}
              onChange={(event) =>
                update({ probability: Number(event.target.value) })
              }
            />
          </StyledField>
          <StyledField>
            Data-alvo
            <StyledInput
              type="date"
              value={draft.targetDate}
              onChange={(event) => update({ targetDate: event.target.value })}
            />
          </StyledField>
          <StyledField>
            Responsável
            <StyledSelect
              value={draft.ownerId}
              onChange={(event) => update({ ownerId: event.target.value })}
            >
              <option value="">Sem responsável</option>
              {workspaceMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {getRecordName(member) || 'Membro sem nome'}
                </option>
              ))}
            </StyledSelect>
          </StyledField>
          <StyledField wide>
            Próxima ação
            <StyledInput
              value={draft.nextAction}
              onChange={(event) => update({ nextAction: event.target.value })}
            />
          </StyledField>
          <StyledField>
            Prazo da próxima ação
            <StyledInput
              type="datetime-local"
              value={draft.nextActionAt}
              onChange={(event) => update({ nextActionAt: event.target.value })}
            />
          </StyledField>
          <StyledField>
            Último contato
            <StyledInput readOnly value={formatDateTime(renewal.lastTouchAt)} />
          </StyledField>
          <StyledField>
            Plano de sucesso
            <StyledInput
              readOnly
              value={getRecordName(renewal.successPlan) || 'Não vinculado'}
            />
          </StyledField>
          <StyledField wide>
            Motivo do risco
            <StyledTextarea
              value={draft.riskReason}
              onChange={(event) => update({ riskReason: event.target.value })}
            />
          </StyledField>
          <StyledField wide>
            Evidência de valor
            <StyledTextarea
              value={draft.valueEvidence}
              onChange={(event) =>
                update({ valueEvidence: event.target.value })
              }
            />
          </StyledField>
          <StyledField wide>
            Condições comerciais
            <StyledTextarea
              value={draft.commercialTerms}
              onChange={(event) =>
                update({ commercialTerms: event.target.value })
              }
            />
          </StyledField>
          <StyledField wide>
            Resultado / motivo de fechamento
            <StyledTextarea
              value={draft.outcome}
              onChange={(event) => update({ outcome: event.target.value })}
            />
          </StyledField>
          <StyledActions>
            <Button
              title="Salvar plano"
              size="small"
              isLoading={isBusy}
              onClick={() => void onSave(draft)}
            />
            <Button
              title="Registrar contato agora"
              size="small"
              variant="secondary"
              disabled={isBusy}
              onClick={() => void onRecordTouch()}
            />
            <Button
              title="Propor intervenção com IA"
              size="small"
              variant="tertiary"
              disabled={isBusy}
              onClick={() => void onProposeAiIntervention()}
            />
          </StyledActions>
        </StyledForm>
      </CommandCenterCard>
      <CommandCenterCard title="Histórico operacional">
        {renewal.renewalEvents.length === 0 ? (
          <CommandCenterEmptyState message="O histórico aparecerá após a primeira operação." />
        ) : (
          <CommandCenterList>
            {renewal.renewalEvents.map((event) => (
              <CommandCenterRow
                key={event.id}
                title={EVENT_LABELS[event.eventType] ?? event.eventType}
                detail={`${event.summary} · ${formatDateTime(event.occurredAt)} · ${getRecordName(event.actor) || 'Sistema'}`}
              />
            ))}
          </CommandCenterList>
        )}
      </CommandCenterCard>
    </>
  );
};
