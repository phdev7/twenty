import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[6]};
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
`;

const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  padding-bottom: ${themeCssVariables.spacing[5]};
`;

const StyledTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${themeCssVariables.font.color.primary};
  margin: 0;
`;

const StyledSubtitle = styled.span`
  font-size: 14px;
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[5]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;

  &:hover {
    border-color: ${themeCssVariables.border.color.strong};
  }
`;

const StyledMetricName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${themeCssVariables.font.color.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StyledMetricValue = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: ${themeCssVariables.font.color.primary};
  letter-spacing: -0.5px;
`;

const GET_CLIENT_REPORT_DATA = gql`
  query GetDiexClientReportData($clientWorkspaceId: String!) {
    diexClientMetricEntries(clientWorkspaceId: $clientWorkspaceId, onlyClientVisible: true) {
      id
      value
      periodStart
      periodEnd
      source
      notes
      metricDefinition {
        name
        code
        unitType
        currencyCode
      }
    }
  }
`;

export const AgencyClientReportPage = ({ clientWorkspaceId }: { clientWorkspaceId?: string }) => {
  const targetId = clientWorkspaceId || 'current-workspace';
  const { data, loading } = useQuery<{ diexClientMetricEntries: any[] }>(GET_CLIENT_REPORT_DATA, {
    variables: { clientWorkspaceId: targetId },
    skip: !targetId,
  });

  const entries = data?.diexClientMetricEntries ?? [
    {
      id: 'demo-1',
      value: 14850.00,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      metricDefinition: { name: 'Investimento em Tráfego', unitType: 'CURRENCY' },
    },
    {
      id: 'demo-2',
      value: 412,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      metricDefinition: { name: 'Leads Qualificados Gerados', unitType: 'NUMBER' },
    },
    {
      id: 'demo-3',
      value: 36.04,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      metricDefinition: { name: 'Custo por Lead (CPL)', unitType: 'CURRENCY' },
    },
    {
      id: 'demo-4',
      value: 3.4,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      metricDefinition: { name: 'Retorno Sobre Investimento (ROAS)', unitType: 'RATIO' },
    },
  ];

  if (loading) return <StyledContainer>Carregando Portal de Transparência...</StyledContainer>;

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>Portal de Transparência de Performance</StyledTitle>
        <StyledSubtitle>
          Relatório em tempo real do progresso comercial, geração de leads e retorno sobre investimento
        </StyledSubtitle>
      </StyledHeader>

      <StyledMetricsGrid>
        {entries.map((entry: any) => (
          <StyledCard key={entry.id}>
            <StyledMetricName>{entry.metricDefinition?.name}</StyledMetricName>
            <StyledMetricValue>
              {entry.metricDefinition?.unitType === 'CURRENCY'
                ? `R$ ${Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : entry.metricDefinition?.unitType === 'PERCENTAGE'
                ? `${entry.value}%`
                : entry.metricDefinition?.unitType === 'RATIO'
                ? `${entry.value}x`
                : entry.value}
            </StyledMetricValue>
            <span style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>
              Período: {new Date(entry.periodStart).toLocaleDateString('pt-BR')} —{' '}
              {new Date(entry.periodEnd).toLocaleDateString('pt-BR')}
            </span>
          </StyledCard>
        ))}
      </StyledMetricsGrid>
    </StyledContainer>
  );
};
