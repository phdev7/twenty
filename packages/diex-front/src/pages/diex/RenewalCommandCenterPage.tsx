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
  CommandCenterLoadingState,
  CommandCenterMetric,
  CommandCenterMetrics,
  CommandCenterPage,
  CommandCenterRow,
  CommandCenterStartState,
} from '@/diex-command-centers/components/CommandCenterLayout';
import { RenewalWorkbench } from '@/diex-command-centers/renewal/RenewalWorkbench';
import { type RenewalDraft } from '@/diex-command-centers/renewal/types';
import { useRenewalCommandCenter } from '@/diex-command-centers/renewal/useRenewalCommandCenter';
import { useDiexPagePresentation } from '@/diex-onboarding/hooks/useDiexPagePresentation';
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
import { Button, ProgressBar, Tag } from 'diex-ui';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isDefined } from 'diex-shared/utils';

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
  const pagePresentation = useDiexPagePresentation({
    pageKey: 'renewal-operations',
    fallbackLabel: 'Renovações',
    fallbackDescription:
      'Forecast, risco, evidência de valor, negociação, responsável, próxima ação e histórico conectados ao plano de sucesso.',
  });
  const {
    renewals,
    successPlans,
    workspaceMembers,
    renewalTotalCount,
    successPlanTotalCount,
    isPartial,
    dataLoadedAt,
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
  // Marcações de sincronismo do rascunho: são lidas para decidir se o draft
  // pode ser sobrescrito, e não devem disparar render.
  // oxlint-disable-next-line diex/no-state-useref
  const isDraftDirtyRef = useRef(false);
  // oxlint-disable-next-line diex/no-state-useref
  const lastSyncedRenewalIdRef = useRef<string | null>(null);
  const selectedRenewal =
    renewals.find(({ id }) => id === selectedRenewalId) ?? renewals[0] ?? null;
  useEffect(() => {
    const selectedId = selectedRenewal?.id ?? null;
    const changedSelection = lastSyncedRenewalIdRef.current !== selectedId;

    if (changedSelection || !isDraftDirtyRef.current) {
      setDraft(
        isDefined(selectedRenewal) ? createDraft(selectedRenewal) : null,
      );
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
    const valuesByCurrency = Object.values(
      active.reduce<
        Record<
          string,
          {
            currencyCode: string;
            activeValue: number;
            weightedForecast: number;
            riskValue: number;
          }
        >
      >((totals, item) => {
        const currencyCode = item.renewalValue?.currencyCode?.trim() || 'BRL';
        const amount = getAmountMicros(item.renewalValue);
        const current = totals[currencyCode] ?? {
          currencyCode,
          activeValue: 0,
          weightedForecast: 0,
          riskValue: 0,
        };

        current.activeValue += amount;
        current.weightedForecast +=
          (amount * Math.max(0, Math.min(100, item.probability ?? 0))) / 100;
        current.riskValue +=
          item.risk === 'HIGH' || item.risk === 'CRITICAL' ? amount : 0;
        totals[currencyCode] = current;

        return totals;
      }, {}),
    );
    return {
      active,
      valuesByCurrency,
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
  const formatMetricValues = (
    key: 'activeValue' | 'weightedForecast' | 'riskValue',
  ) =>
    metrics.valuesByCurrency
      .map((value) => formatMoney(value[key], value.currencyCode, true))
      .join(' + ') || formatMoney(0, 'BRL', true);
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
  const hasRenewalData = renewals.length > 0 || successPlans.length > 0;
  const dataStatus = errorMessage
    ? hasRenewalData
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
    if (!isDefined(selectedRenewal)) return false;
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
    if (!isDefined(selectedRenewal)) return false;
    setIsBusy(true);
    const result = await recordTouch(selectedRenewal.id);
    setIsBusy(false);
    return result;
  };
  const propose = async () => {
    if (!isDefined(selectedRenewal)) return false;
    setIsBusy(true);
    const result = await proposeAiIntervention(selectedRenewal.id);
    setIsBusy(false);
    return result;
  };

  return (
    <CommandCenterPage
      title={pagePresentation.label}
      description={pagePresentation.description}
      statusText={dataStatus}
    >
      {isLoading && renewals.length === 0 ? (
        <CommandCenterLoadingState />
      ) : null}
      {errorMessage && !hasRenewalData ? (
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
      {errorMessage && hasRenewalData ? (
        <CommandCenterCard title="Qualidade dos dados">
          <CommandCenterRow
            title="A atualização das renovações falhou"
            detail="Os casos abaixo pertencem à última consulta concluída. Atualize antes de alterar forecast, risco ou negociação."
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
      {!isLoading && !errorMessage && !hasRenewalData ? (
        <CommandCenterCard title="Renovações entram depois da primeira receita">
          <CommandCenterStartState
            title="A esteira ainda não tem uma carteira para renovar."
            message="Conclua o primeiro fluxo comercial e registre o cliente. O Customer Success e as renovações passam a trabalhar com valor, risco, data-alvo e próxima ação reais."
          />
        </CommandCenterCard>
      ) : null}
      {hasRenewalData ? (
        <>
          <CommandCenterCard title="Conduza cada renovação até receita confirmada.">
            <p>
              {renewals.length} de {renewalTotalCount} renovações e{' '}
              {successPlans.length} de {successPlanTotalCount} planos
              carregados.
            </p>
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
              disabled={!selectedSuccessPlanId || Boolean(errorMessage)}
              onClick={() => void openRenewal()}
            />
          </CommandCenterCard>
          <CommandCenterMetrics>
            <CommandCenterMetric
              label={isPartial ? 'Receita no recorte' : 'Receita em renovação'}
              value={formatMetricValues('activeValue')}
            />
            <CommandCenterMetric
              label="Forecast ponderado"
              value={formatMetricValues('weightedForecast')}
            />
            <CommandCenterMetric
              label="Receita sob risco"
              value={formatMetricValues('riskValue')}
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
                const stageValues = Object.entries(
                  items.reduce<Record<string, number>>((totals, item) => {
                    const currencyCode =
                      item.renewalValue?.currencyCode?.trim() || 'BRL';

                    totals[currencyCode] =
                      (totals[currencyCode] ?? 0) +
                      getAmountMicros(item.renewalValue);

                    return totals;
                  }, {}),
                );
                return (
                  <StyledColumn key={stage.value}>
                    <Tag color={stage.tone} text={stage.label} />
                    <p>
                      {items.length} ·{' '}
                      {stageValues
                        .map(([currencyCode, amount]) =>
                          formatMoney(amount, currencyCode, true),
                        )
                        .join(' + ') || formatMoney(0, 'BRL', true)}
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
                                item.renewalValue?.currencyCode ?? 'BRL',
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
          {!errorMessage ? (
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
          ) : null}
          <CommandCenterCard title="Regra de governança">
            <CommandCenterEmptyState message="A IA apenas cria uma proposta auditável. Aprovação e execução continuam humanas no Centro de IA." />
          </CommandCenterCard>
        </>
      ) : null}
    </CommandCenterPage>
  );
};
