import { useState } from 'react';
import { styled } from '@linaria/react';
import { Button, Toggle } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isNonEmptyString } from '@sniptt/guards';

import { useAgencyMetricDefinitions } from '@/agency/hooks/useAgencyMetricDefinitions';
import { Select } from '@/ui/input/components/Select';
import { TextInput } from '@/ui/input/components/TextInput';
import {
  MetricUnitType,
  TargetComparisonType,
} from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledSectionHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledFormCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledToggleRow = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMetricRow = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMetricName = styled.strong`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMetricMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledEmptyState = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
`;

const UNIT_TYPE_OPTIONS = [
  { value: MetricUnitType.NUMBER, label: 'Número' },
  { value: MetricUnitType.CURRENCY, label: 'Moeda' },
  { value: MetricUnitType.PERCENTAGE, label: 'Percentual' },
  { value: MetricUnitType.RATIO, label: 'Proporção' },
];

const TARGET_COMPARISON_OPTIONS = [
  { value: TargetComparisonType.HIGHER_IS_BETTER, label: 'Maior é melhor' },
  { value: TargetComparisonType.LOWER_IS_BETTER, label: 'Menor é melhor' },
];

// Codes the traffic summary derives CPL, ROAS, CAC and LTV from. Flagged in the
// form because a metric only feeds those cards by carrying one of them.
const SUMMARY_METRIC_CODES = ['spend', 'revenue', 'leads', 'customers'];

export const AgencyCustomMetrics = () => {
  const { metricDefinitions, loading, isCreating, createMetricDefinition } =
    useAgencyMetricDefinitions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unitType, setUnitType] = useState<MetricUnitType>(
    MetricUnitType.NUMBER,
  );
  const [targetComparison, setTargetComparison] =
    useState<TargetComparisonType>(TargetComparisonType.HIGHER_IS_BETTER);
  const [description, setDescription] = useState('');
  const [isVisibleToClient, setIsVisibleToClient] = useState(true);

  const canSubmit =
    isNonEmptyString(name) && isNonEmptyString(code) && !isCreating;

  const handleCreate = async () => {
    if (!canSubmit) {
      return;
    }

    const wasCreated = await createMetricDefinition({
      name,
      code,
      unitType,
      targetComparison,
      description,
      isVisibleToClient,
    });

    if (!wasCreated) {
      return;
    }

    setName('');
    setCode('');
    setDescription('');
    setIsVisibleToClient(true);
    setIsFormOpen(false);
  };

  if (loading) {
    return <StyledContainer>Carregando métricas...</StyledContainer>;
  }

  return (
    <StyledContainer>
      <StyledSectionHeader>
        <StyledSectionTitle>
          Métricas da agência ({metricDefinitions.length})
        </StyledSectionTitle>
        <Button
          title={isFormOpen ? 'Cancelar' : 'Nova métrica'}
          onClick={() => setIsFormOpen(!isFormOpen)}
        />
      </StyledSectionHeader>

      {isFormOpen && (
        <StyledFormCard>
          <TextInput
            label="Nome"
            placeholder="Investimento em anúncios"
            value={name}
            onChange={setName}
          />
          <TextInput
            label="Código"
            placeholder="spend"
            value={code}
            onChange={setCode}
          />
          <StyledMetricMeta>
            Use um destes códigos para alimentar o painel de tráfego:{' '}
            {SUMMARY_METRIC_CODES.join(', ')}.
          </StyledMetricMeta>
          <Select
            dropdownId="agency-metric-unit-type"
            label="Unidade"
            value={unitType}
            options={UNIT_TYPE_OPTIONS}
            onChange={setUnitType}
          />
          <Select
            dropdownId="agency-metric-target-comparison"
            label="Direção desejada"
            value={targetComparison}
            options={TARGET_COMPARISON_OPTIONS}
            onChange={setTargetComparison}
          />
          <TextInput
            label="Descrição"
            placeholder="Como esta métrica é apurada"
            value={description}
            onChange={setDescription}
          />
          <StyledToggleRow>
            <Toggle value={isVisibleToClient} onChange={setIsVisibleToClient} />
            Visível para o cliente no relatório
          </StyledToggleRow>
          <Button
            title={isCreating ? 'Criando...' : 'Criar métrica'}
            disabled={!canSubmit}
            onClick={() => void handleCreate()}
          />
        </StyledFormCard>
      )}

      {metricDefinitions.length === 0 ? (
        <StyledEmptyState>
          Nenhuma métrica cadastrada ainda nesta agência.
        </StyledEmptyState>
      ) : (
        metricDefinitions.map((metricDefinition) => (
          <StyledMetricRow key={metricDefinition.id}>
            <div>
              <StyledMetricName>{metricDefinition.name}</StyledMetricName>
              <div>
                <StyledMetricMeta>
                  {metricDefinition.code} · {metricDefinition.unitType} ·{' '}
                  {metricDefinition.isVisibleToClient
                    ? 'visível ao cliente'
                    : 'interna'}
                </StyledMetricMeta>
              </div>
            </div>
          </StyledMetricRow>
        ))
      )}
    </StyledContainer>
  );
};
