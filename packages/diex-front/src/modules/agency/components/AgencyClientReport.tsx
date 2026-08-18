import { useState } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isDefined } from 'diex-shared/utils';
import { isNonEmptyString } from '@sniptt/guards';

import { AgencyMetricEntryForm } from '@/agency/components/AgencyMetricEntryForm';
import { useAgencyClientReport } from '@/agency/hooks/useAgencyClientReport';
import { useAgencyMetricDefinitions } from '@/agency/hooks/useAgencyMetricDefinitions';
import { useAgencyPortal } from '@/agency/hooks/useAgencyPortal';
import { type AgencyMetricEntry } from '@/agency/types/AgencyTypes';
import {
  formatCurrency,
  formatNumber,
  formatRatio,
} from '@/agency/utils/formatAgencyMetricValue';
import { Select } from '@/ui/input/components/Select';
import { Button } from 'diex-ui/input';
import { MetricUnitType } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledMetricsGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
`;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledMetricName = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledMetricValue = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledPeriod = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledEmptyState = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
`;

const StyledEntrySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledErrorState = styled.p`
  background: ${themeCssVariables.tag.background.orange};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.tag.text.orange};
  margin: 0;
  padding: ${themeCssVariables.spacing[4]};
`;

const formatEntryValue = (entry: AgencyMetricEntry): string => {
  const value = Number(entry.value);

  switch (entry.metricDefinition?.unitType) {
    case MetricUnitType.CURRENCY:
      return formatCurrency(
        value,
        entry.metricDefinition.currencyCode ?? 'BRL',
      );
    case MetricUnitType.PERCENTAGE:
      return `${formatNumber(value)}%`;
    case MetricUnitType.RATIO:
      return formatRatio(value);
    default:
      return formatNumber(value);
  }
};

const formatPeriod = (entry: AgencyMetricEntry) =>
  `${new Date(entry.periodStart).toLocaleDateString('pt-BR')} — ${new Date(
    entry.periodEnd,
  ).toLocaleDateString('pt-BR')}`;

export const AgencyClientReport = () => {
  const {
    clientWorkspaces,
    loading: isLoadingClients,
    errorMessage: clientsErrorMessage,
  } = useAgencyPortal();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);

  const { entries, loading, errorMessage, refetch } =
    useAgencyClientReport(selectedClientId);
  const { metricDefinitions } = useAgencyMetricDefinitions();

  const clientOptions = clientWorkspaces.map((clientWorkspace) => ({
    value: clientWorkspace.id,
    label: clientWorkspace.displayName ?? clientWorkspace.subdomain,
  }));

  if (isLoadingClients) {
    return <StyledContainer>Carregando clientes...</StyledContainer>;
  }

  // A failed client list is not an agency without clients, and telling an
  // agency manager to go register one would send them to create a duplicate.
  if (isNonEmptyString(clientsErrorMessage)) {
    return (
      <StyledContainer>
        <StyledErrorState>
          Não foi possível carregar a lista de clientes: {clientsErrorMessage}
        </StyledErrorState>
      </StyledContainer>
    );
  }

  if (clientOptions.length === 0) {
    return (
      <StyledContainer>
        <StyledEmptyState>
          Cadastre um cliente no portal do parceiro para emitir relatórios.
        </StyledEmptyState>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <Select
        dropdownId="agency-client-report-client"
        label="Cliente"
        value={selectedClientId ?? undefined}
        options={clientOptions}
        onChange={setSelectedClientId}
      />

      {isDefined(selectedClientId) ? (
        <StyledEntrySection>
          <Button
            title={isEntryFormOpen ? 'Cancelar lançamento' : 'Lançar métrica'}
            onClick={() => setIsEntryFormOpen(!isEntryFormOpen)}
          />
          {isEntryFormOpen ? (
            <AgencyMetricEntryForm
              clientWorkspaceId={selectedClientId}
              metricDefinitions={metricDefinitions}
              onCreated={() => void refetch()}
            />
          ) : null}
        </StyledEntrySection>
      ) : null}

      {!isDefined(selectedClientId) ? (
        <StyledEmptyState>
          Escolha um cliente para ver as métricas visíveis a ele.
        </StyledEmptyState>
      ) : loading ? (
        <StyledEmptyState>Carregando relatório...</StyledEmptyState>
      ) : isNonEmptyString(errorMessage) ? (
        <StyledErrorState>
          Não foi possível carregar as métricas deste cliente: {errorMessage}
        </StyledErrorState>
      ) : entries.length === 0 ? (
        // Reported as empty. The previous version filled this screen with four
        // invented figures whenever the query returned nothing, which is what
        // an agency would have shown a client as their own results.
        <StyledEmptyState>
          Nenhuma métrica visível ao cliente foi lançada para este workspace.
        </StyledEmptyState>
      ) : (
        <StyledMetricsGrid>
          {entries.map((entry) => (
            <StyledCard key={entry.id}>
              <StyledMetricName>
                {entry.metricDefinition?.name ?? 'Métrica'}
              </StyledMetricName>
              <StyledMetricValue>{formatEntryValue(entry)}</StyledMetricValue>
              <StyledPeriod>Período: {formatPeriod(entry)}</StyledPeriod>
            </StyledCard>
          ))}
        </StyledMetricsGrid>
      )}
    </StyledContainer>
  );
};
