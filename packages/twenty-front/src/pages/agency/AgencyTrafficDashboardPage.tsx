import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Button, Card, Tag } from 'twenty-ui';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const StyledTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
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

const StyledMetricCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${themeCssVariables.border.color.strong};
  }
`;

const StyledMetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledMetricLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${themeCssVariables.font.color.secondary};
`;

const StyledMetricValue = styled.span`
  font-size: 28px;
  font-weight: 700;
  color: ${themeCssVariables.font.color.primary};
  letter-spacing: -0.5px;
`;

const StyledTrendBadge = styled.span<{ isPositive?: boolean; isNeutral?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  background: ${(props) =>
    props.isNeutral
      ? '#333333'
      : props.isPositive
      ? 'rgba(76, 175, 80, 0.15)'
      : 'rgba(244, 67, 54, 0.15)'};
  color: ${(props) =>
    props.isNeutral
      ? '#aaaaaa'
      : props.isPositive
      ? '#4caf50'
      : '#f44336'};
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const StyledAnomalyBanner = styled.div`
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ff9800;
`;

const GET_TRAFFIC_SUMMARY = gql`
  query GetDiexTrafficSummary {
    diexTrafficSummary {
      totalSpend
      spendChangePercentage
      totalLeads
      leadsChangePercentage
      averageCpl
      cplChangePercentage
      averageRoas
      roasChangePercentage
      activeMetaAdsAccounts
      anomaliesCount
      advancedMetrics {
        currentCac
        cacChangePercentage
        currentLtv
        ltvChangePercentage
      }
    }
  }
`;

export const AgencyTrafficDashboardPage = () => {
  const { data, loading, refetch } = useQuery<{ diexTrafficSummary: any }>(GET_TRAFFIC_SUMMARY);
  const metrics = data?.diexTrafficSummary;

  if (loading) return <StyledContainer>Carregando Painel de Tráfego...</StyledContainer>;

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitleGroup>
          <StyledTitle>Painel de Tráfego Pago & Performance Executiva</StyledTitle>
          <StyledSubtitle>
            Consolidado em tempo real de investimento, leads, CPL e ROAS de todas as contas gerenciadas pela agência
          </StyledSubtitle>
        </StyledTitleGroup>
        <Button title="Sincronizar Dados" onClick={() => refetch()} />
      </StyledHeader>

      {metrics?.anomaliesCount > 0 && (
        <StyledAnomalyBanner>
          <div>
            <strong>⚠️ Atenção Operacional:</strong> Identificamos {metrics.anomaliesCount} variação(ões) atípica(s) em CPL ou ROAS nos últimos 30 dias.
          </div>
          <Button title="Ver Detalhes" />
        </StyledAnomalyBanner>
      )}

      <StyledMetricsGrid>
        <StyledMetricCard>
          <StyledMetricHeader>
            <StyledMetricLabel>Investimento Total (Spend)</StyledMetricLabel>
            <StyledTrendBadge isPositive={(metrics?.spendChangePercentage ?? 0) >= 0}>
              {(metrics?.spendChangePercentage ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(metrics?.spendChangePercentage ?? 0)}%
            </StyledTrendBadge>
          </StyledMetricHeader>
          <StyledMetricValue>
            R$ {(metrics?.totalSpend ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </StyledMetricValue>
          <span style={{ fontSize: '11px', color: '#777' }}>Comparado ao mês anterior</span>
        </StyledMetricCard>

        <StyledMetricCard>
          <StyledMetricHeader>
            <StyledMetricLabel>Total de Leads Gerados</StyledMetricLabel>
            <StyledTrendBadge isPositive={(metrics?.leadsChangePercentage ?? 0) >= 0}>
              {(metrics?.leadsChangePercentage ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(metrics?.leadsChangePercentage ?? 0)}%
            </StyledTrendBadge>
          </StyledMetricHeader>
          <StyledMetricValue>{metrics?.totalLeads ?? 0}</StyledMetricValue>
          <span style={{ fontSize: '11px', color: '#777' }}>Leads qualificados via anúncios</span>
        </StyledMetricCard>

        <StyledMetricCard>
          <StyledMetricHeader>
            <StyledMetricLabel>Custo por Lead Médio (CPL)</StyledMetricLabel>
            <StyledTrendBadge isPositive={(metrics?.cplChangePercentage ?? 0) <= 0}>
              {(metrics?.cplChangePercentage ?? 0) <= 0 ? '↓' : '↑'} {Math.abs(metrics?.cplChangePercentage ?? 0)}%
            </StyledTrendBadge>
          </StyledMetricHeader>
          <StyledMetricValue>
            R$ {(metrics?.averageCpl ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </StyledMetricValue>
          <span style={{ fontSize: '11px', color: '#777' }}>Menor é melhor</span>
        </StyledMetricCard>

        <StyledMetricCard>
          <StyledMetricHeader>
            <StyledMetricLabel>ROAS Médio Retorno</StyledMetricLabel>
            <StyledTrendBadge isPositive={(metrics?.roasChangePercentage ?? 0) >= 0}>
              {(metrics?.roasChangePercentage ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(metrics?.roasChangePercentage ?? 0)}%
            </StyledTrendBadge>
          </StyledMetricHeader>
          <StyledMetricValue>{(metrics?.averageRoas ?? 0).toFixed(2)}x</StyledMetricValue>
          <span style={{ fontSize: '11px', color: '#777' }}>Multiplicador de retorno</span>
        </StyledMetricCard>
      </StyledMetricsGrid>

      <StyledMetricsGrid style={{ marginTop: '16px' }}>
        <StyledMetricCard>
          <StyledMetricHeader>
            <StyledMetricLabel>Custo de Aquisição (CAC)</StyledMetricLabel>
            <StyledTrendBadge isPositive={(metrics?.advancedMetrics?.cacChangePercentage ?? 0) <= 0}>
              {(metrics?.advancedMetrics?.cacChangePercentage ?? 0) <= 0 ? '↓' : '↑'} {Math.abs(metrics?.advancedMetrics?.cacChangePercentage ?? 0)}%
            </StyledTrendBadge>
          </StyledMetricHeader>
          <StyledMetricValue>
            R$ {(metrics?.advancedMetrics?.currentCac ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </StyledMetricValue>
          <span style={{ fontSize: '11px', color: '#777' }}>Custo por novo cliente</span>
        </StyledMetricCard>

        <StyledMetricCard>
          <StyledMetricHeader>
            <StyledMetricLabel>Life Time Value (LTV)</StyledMetricLabel>
            <StyledTrendBadge isPositive={(metrics?.advancedMetrics?.ltvChangePercentage ?? 0) >= 0}>
              {(metrics?.advancedMetrics?.ltvChangePercentage ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(metrics?.advancedMetrics?.ltvChangePercentage ?? 0)}%
            </StyledTrendBadge>
          </StyledMetricHeader>
          <StyledMetricValue>
            R$ {(metrics?.advancedMetrics?.currentLtv ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </StyledMetricValue>
          <span style={{ fontSize: '11px', color: '#777' }}>Valor médio gerado por cliente</span>
        </StyledMetricCard>

        <StyledMetricCard>
          <h3>Status de Integração Meta Ads</h3>
          <p style={{ color: '#aaa', marginTop: '8px' }}>
            Atualmente você possui <strong>{metrics?.activeMetaAdsAccounts ?? 0}</strong> conta(s) do Meta Ads conectada(s) sincronizando métricas e campanhas ativas.
          </p>
        </StyledMetricCard>
      </StyledMetricsGrid>
    </StyledContainer>
  );
};
