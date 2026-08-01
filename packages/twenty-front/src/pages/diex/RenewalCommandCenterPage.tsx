import { styled } from '@linaria/react';
import {
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CommandCenterCard,
  CommandCenterEmptyState,
  CommandCenterGrid,
  CommandCenterLoadingState,
  CommandCenterMetric,
  CommandCenterMetrics,
  CommandCenterPage,
} from '@/diex-command-centers/components/CommandCenterLayout';
import { RenewalWorkbench } from '@/diex-command-centers/renewal/RenewalWorkbench';
import { type RenewalDraft } from '@/diex-command-centers/renewal/types';
import { useRenewalCommandCenter } from '@/diex-command-centers/renewal/useRenewalCommandCenter';
import {
  STAGES,
  createDraft,
  daysUntil,
  formatDate,
  formatMoney,
  getAmountMicros,
  getRecordName,
  getRisk,
} from '@/diex-command-centers/renewal/utils';
import { Button, ProgressBar, Tag } from 'twenty-ui';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledBoard = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(6, minmax(210px, 1fr));
  overflow-x: auto;
`;
const StyledColumn = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  min-height: 240px;
  padding: ${themeCssVariables.spacing[2]};
`;
const StyledRenewalButton = styled.button<{ selected: boolean }>`
  background: ${({ selected }) =>
    selected
      ? themeCssVariables.background.transparent.blue
      : themeCssVariables.background.primary};
  border: 1px solid
    ${({ selected }) =>
      selected
        ? themeCssVariables.border.color.blue
        : themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  margin-top: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;
  width: 100%;
`;

export const RenewalCommandCenterPage = () => {
  const {
    renewals,
    successPlans,
    workspaceMembers,
    isLoading,
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
  const [draftSyncKey, setDraftSyncKey] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const isDraftDirtyRef = useRef(false);
  const lastSyncedRenewalIdRef = useRef<string | null>(null);
  const selectedRenewal =
    renewals.find(({ id }) => id === selectedRenewalId) ?? renewals[0] ?? null;
  useEffect(() => {
    const selectedId = selectedRenewal?.id ?? null;
    const changedSelection = lastSyncedRenewalIdRef.current !== selectedId;

    if (changedSelection || !isDraftDirtyRef.current) {
      setDraft(selectedRenewal ? createDraft(selectedRenewal) : null);
      isDraftDirtyRef.current = false;
      lastSyncedRenewalIdRef.current = selectedId;
    }
  }, [draftSyncKey, selectedRenewal]);
  const updateDraft = (nextDraft: SetStateAction<RenewalDraft | null>) => {
    setDraft((currentDraft) => {
      const updatedDraft =
        typeof nextDraft === 'function' ? nextDraft(currentDraft) : nextDraft;

      if (updatedDraft !== currentDraft) isDraftDirtyRef.current = true;

      return updatedDraft;
    });
  };
  const metrics = useMemo(() => {
    const active = renewals.filter(({ stage }) =>
      ['PLANNING', 'VALUE_PROOF', 'NEGOTIATION', 'COMMITMENT'].includes(stage),
    );
    const currency =
      active.find(({ renewalValue }) => renewalValue?.currencyCode)
        ?.renewalValue?.currencyCode ?? 'BRL';
    const sameCurrency = active.filter(
      ({ renewalValue }) =>
        (renewalValue?.currencyCode ?? currency) === currency,
    );
    const activeValue = sameCurrency.reduce(
      (total, item) => total + getAmountMicros(item.renewalValue),
      0,
    );
    const weightedForecast = sameCurrency.reduce(
      (total, item) =>
        total +
        (getAmountMicros(item.renewalValue) *
          Math.max(0, Math.min(100, item.probability ?? 0))) /
          100,
      0,
    );
    const riskValue = sameCurrency
      .filter(({ risk }) => risk === 'HIGH' || risk === 'CRITICAL')
      .reduce((total, item) => total + getAmountMicros(item.renewalValue), 0);
    return {
      active,
      currency,
      activeValue,
      weightedForecast,
      riskValue,
      dueIn30Days: active.filter((item) => {
        const days = daysUntil(item.targetDate);
        return days !== null && days >= 0 && days <= 30;
      }),
      overdueActions: active.filter(
        (item) =>
          !item.nextAction?.trim() || (daysUntil(item.nextActionAt) ?? 0) < 0,
      ),
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
  const openRenewal = async () => {
    setIsBusy(true);
    const id = await createRenewal(selectedSuccessPlanId);
    setIsBusy(false);
    if (id) {
      setSelectedRenewalId(id);
      setSelectedSuccessPlanId('');
    }
  };
  const save = async (nextDraft: RenewalDraft) => {
    if (!selectedRenewal) return false;
    setIsBusy(true);
    const result = await updateRenewal(selectedRenewal.id, nextDraft);
    setIsBusy(false);
    if (result) {
      isDraftDirtyRef.current = false;
      setDraftSyncKey((current) => current + 1);
    }
    return result;
  };
  const touch = async () => {
    if (!selectedRenewal) return false;
    setIsBusy(true);
    const result = await recordTouch(selectedRenewal.id);
    setIsBusy(false);
    return result;
  };
  const propose = async () => {
    if (!selectedRenewal) return false;
    setIsBusy(true);
    const result = await proposeAiIntervention(selectedRenewal.id);
    setIsBusy(false);
    return result;
  };

  return (
    <CommandCenterPage
      title="Renovações"
      description="Forecast, risco, evidência de valor, negociação, responsável, próxima ação e histórico conectados ao plano de sucesso."
    >
      {isLoading && renewals.length === 0 ? (
        <CommandCenterLoadingState />
      ) : null}
      {errorMessage ? (
        <CommandCenterCard title="Centro de Renovações">
          <CommandCenterEmptyState message={errorMessage} />
          <Button
            title="Tentar novamente"
            size="small"
            variant="secondary"
            onClick={() => void load()}
          />
        </CommandCenterCard>
      ) : null}
      {!errorMessage ? (
        <>
          <CommandCenterCard title="Conduza cada renovação até receita confirmada.">
            <label>
              {' '}
              Abrir caso a partir do CS{' '}
              <select
                value={selectedSuccessPlanId}
                onChange={(event) =>
                  setSelectedSuccessPlanId(event.target.value)
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
            </label>
            <Button
              title="Abrir"
              size="small"
              isLoading={isBusy}
              disabled={!selectedSuccessPlanId}
              onClick={() => void openRenewal()}
            />
          </CommandCenterCard>
          <CommandCenterMetrics>
            <CommandCenterMetric
              label="Receita em renovação"
              value={formatMoney(metrics.activeValue, metrics.currency, true)}
            />
            <CommandCenterMetric
              label="Forecast ponderado"
              value={formatMoney(
                metrics.weightedForecast,
                metrics.currency,
                true,
              )}
            />
            <CommandCenterMetric
              label="Receita sob risco"
              value={formatMoney(metrics.riskValue, metrics.currency, true)}
            />
            <CommandCenterMetric
              label="Vencem em 30 dias"
              value={metrics.dueIn30Days.length}
            />
            <CommandCenterMetric
              label="Ações vencidas"
              value={metrics.overdueActions.length}
            />
          </CommandCenterMetrics>
          <CommandCenterCard title="Esteira de renovação">
            <Button
              title="Atualizar"
              size="small"
              variant="secondary"
              disabled={isLoading}
              onClick={() => void load()}
            />
            <StyledBoard>
              {STAGES.map((stage) => {
                const items = renewals.filter(
                  ({ stage: value }) => value === stage.value,
                );
                const value = items.reduce(
                  (total, item) => total + getAmountMicros(item.renewalValue),
                  0,
                );
                return (
                  <StyledColumn key={stage.value}>
                    <Tag color={stage.tone} text={stage.label} />
                    <p>
                      {items.length} ·{' '}
                      {formatMoney(value, metrics.currency, true)}
                    </p>
                    {items.length === 0 ? (
                      <CommandCenterEmptyState message="Nenhum caso nesta etapa." />
                    ) : (
                      items.map((item) => {
                        const risk = getRisk(item.risk);
                        const days = daysUntil(item.targetDate);
                        return (
                          <StyledRenewalButton
                            key={item.id}
                            selected={item.id === selectedRenewal?.id}
                            onClick={() => setSelectedRenewalId(item.id)}
                          >
                            <strong>
                              {getRecordName(item.company) || item.name}
                            </strong>
                            <p>
                              <Tag color={risk.tone} text={risk.label} />{' '}
                              {formatMoney(
                                getAmountMicros(item.renewalValue),
                                item.renewalValue?.currencyCode ??
                                  metrics.currency,
                                true,
                              )}
                            </p>
                            <ProgressBar value={item.probability ?? 0} />
                            <p>
                              {item.nextAction?.trim() ||
                                'Definir próxima ação'}
                            </p>
                            <small>
                              {item.probability ?? 0}% ·{' '}
                              {days === null
                                ? 'sem prazo'
                                : days < 0
                                  ? `${Math.abs(days)}d atrasada`
                                  : `${days}d`}
                            </small>
                          </StyledRenewalButton>
                        );
                      })
                    )}
                  </StyledColumn>
                );
              })}
            </StyledBoard>
          </CommandCenterCard>
          <RenewalWorkbench
            renewal={selectedRenewal}
            draft={draft}
            setDraft={updateDraft}
            workspaceMembers={workspaceMembers}
            isBusy={isBusy}
            onSave={save}
            onRecordTouch={touch}
            onProposeAiIntervention={propose}
          />
          <CommandCenterCard title="Regra de governança">
            <CommandCenterEmptyState message="A IA apenas cria uma proposta auditável. Aprovação e execução continuam humanas no Centro de IA." />
          </CommandCenterCard>
        </>
      ) : null}
    </CommandCenterPage>
  );
};
