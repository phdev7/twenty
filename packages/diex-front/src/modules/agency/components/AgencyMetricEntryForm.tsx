import { useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isNonEmptyString } from '@sniptt/guards';

import { useCreateAgencyMetricEntry } from '@/agency/hooks/useCreateAgencyMetricEntry';
import { type AgencyMetricDefinition } from '@/agency/types/AgencyTypes';
import { Select } from '@/ui/input/components/Select';
import { TextInput } from '@/ui/input/components/TextInput';

const StyledFormCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledPeriodRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledHint = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const getTodayInputValue = () => new Date().toISOString().slice(0, 10);

type AgencyMetricEntryFormProps = {
  clientWorkspaceId: string;
  metricDefinitions: AgencyMetricDefinition[];
  onCreated: () => void;
};

export const AgencyMetricEntryForm = ({
  clientWorkspaceId,
  metricDefinitions,
  onCreated,
}: AgencyMetricEntryFormProps) => {
  const { createMetricEntry, isCreatingMetricEntry } =
    useCreateAgencyMetricEntry();
  const [metricDefinitionId, setMetricDefinitionId] = useState(
    metricDefinitions[0]?.id ?? '',
  );
  const [periodStart, setPeriodStart] = useState(getTodayInputValue);
  const [periodEnd, setPeriodEnd] = useState(getTodayInputValue);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const parsedValue = Number(value);
  const canSubmit =
    isNonEmptyString(metricDefinitionId) &&
    isNonEmptyString(value) &&
    Number.isFinite(parsedValue) &&
    periodStart <= periodEnd &&
    !isCreatingMetricEntry;

  const handleCreate = async () => {
    if (!canSubmit) {
      return;
    }

    const wasCreated = await createMetricEntry({
      metricDefinitionId,
      clientWorkspaceId,
      periodStart,
      periodEnd,
      value: parsedValue,
      notes,
    });

    if (!wasCreated) {
      return;
    }

    setValue('');
    setNotes('');
    onCreated();
  };

  if (metricDefinitions.length === 0) {
    return (
      <StyledFormCard>
        <StyledHint>
          Cadastre uma métrica na página Métricas antes de lançar valores para
          este cliente.
        </StyledHint>
      </StyledFormCard>
    );
  }

  return (
    <StyledFormCard>
      <Select
        dropdownId="agency-metric-entry-definition"
        label="Métrica"
        value={metricDefinitionId}
        options={metricDefinitions.map((metricDefinition) => ({
          value: metricDefinition.id,
          label: metricDefinition.isVisibleToClient
            ? metricDefinition.name
            : `${metricDefinition.name} (interna)`,
        }))}
        onChange={setMetricDefinitionId}
      />
      <StyledPeriodRow>
        <TextInput
          label="Início do período"
          type="date"
          value={periodStart}
          onChange={setPeriodStart}
        />
        <TextInput
          label="Fim do período"
          type="date"
          value={periodEnd}
          onChange={setPeriodEnd}
        />
      </StyledPeriodRow>
      <TextInput
        label="Valor"
        type="number"
        placeholder="0"
        value={value}
        onChange={setValue}
      />
      <TextInput
        label="Observações"
        placeholder="De onde veio este número"
        value={notes}
        onChange={setNotes}
      />
      {periodStart > periodEnd ? (
        <StyledHint>
          O fim do período não pode ser anterior ao início.
        </StyledHint>
      ) : null}
      <Button
        title={isCreatingMetricEntry ? 'Lançando...' : 'Lançar métrica'}
        disabled={!canSubmit}
        onClick={() => void handleCreate()}
      />
    </StyledFormCard>
  );
};
