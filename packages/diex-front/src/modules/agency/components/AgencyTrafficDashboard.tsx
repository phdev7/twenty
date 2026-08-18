import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { AgencyMetricCard } from '@/agency/components/AgencyMetricCard';
import { useAgencyTrafficSummary } from '@/agency/hooks/useAgencyTrafficSummary';
import {
  formatCurrency,
  formatNumber,
  formatRatio,
} from '@/agency/utils/formatAgencyMetricValue';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledSubtitle = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledMetricsGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
`;

const StyledBanner = styled.div<{ tone: 'warning' | 'neutral' }>`
  background: ${({ tone }) =>
    tone === 'warning'
      ? themeCssVariables.tag.background.orange
      : themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${({ tone }) =>
    tone === 'warning'
      ? themeCssVariables.tag.text.orange
      : themeCssVariables.font.color.secondary};
  padding: ${themeCssVariables.spacing[4]};
`;

export const AgencyTrafficDashboard = () => {
  const { summary, loading, errorMessage, refetch } = useAgencyTrafficSummary();

  if (loading) {
    return <StyledContainer>Carregando painel de tráfego...</StyledContainer>;
  }

  // A failed read is reported as a failure. Falling through to the empty state
  // would tell the agency it has no traffic when nothing was ever measured.
  if (summary === null) {
    return (
      <StyledContainer>
        <StyledHeader>
          <StyledSubtitle>Painel de tráfego</StyledSubtitle>
          <Button title="Tentar novamente" onClick={() => void refetch()} />
        </StyledHeader>
        <StyledBanner tone="warning">
          {isNonEmptyString(errorMessage)
            ? `Não foi possível carregar o resumo de tráfego: ${errorMessage}`
            : 'Não foi possível carregar o resumo de tráfego.'}
        </StyledBanner>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledSubtitle>
          Consolidado dos últimos 30 dias das contas gerenciadas pela agência
        </StyledSubtitle>
        <Button title="Atualizar" onClick={() => void refetch()} />
      </StyledHeader>

      {/* An agency that has recorded nothing is told so. Rendering the grid of
          zeros reads as a measured result, which is the mistake the invented
          demonstration numbers used to make in the other direction. */}
      {!summary.hasData ? (
        <StyledBanner tone="neutral">
          Nenhuma métrica foi registrada nos últimos 60 dias. Conecte uma conta
          do Meta Ads ou lance métricas manuais para que este painel passe a
          mostrar números.
        </StyledBanner>
      ) : (
        <>
          {summary.anomaliesCount > 0 && (
            <StyledBanner tone="warning">
              Identificamos {summary.anomaliesCount} variação(ões) atípica(s) em
              CPL, CAC ou ROAS nos últimos 30 dias.
            </StyledBanner>
          )}

          <StyledMetricsGrid>
            <AgencyMetricCard
              label="Investimento total"
              value={formatCurrency(summary.totalSpend)}
              caption="Comparado ao período anterior"
              changePercentage={summary.spendChangePercentage}
            />
            <AgencyMetricCard
              label="Leads gerados"
              value={formatNumber(summary.totalLeads)}
              caption="Registrados no período"
              changePercentage={summary.leadsChangePercentage}
            />
            <AgencyMetricCard
              label="Custo por lead (CPL)"
              value={formatCurrency(summary.averageCpl)}
              caption="Menor é melhor"
              changePercentage={summary.cplChangePercentage}
              isLowerBetter
            />
            <AgencyMetricCard
              label="ROAS médio"
              value={formatRatio(summary.averageRoas)}
              caption="Multiplicador de retorno"
              changePercentage={summary.roasChangePercentage}
            />
            <AgencyMetricCard
              label="Custo de aquisição (CAC)"
              value={formatCurrency(summary.advancedMetrics?.currentCac ?? 0)}
              caption="Custo por novo cliente"
              changePercentage={summary.advancedMetrics?.cacChangePercentage}
              isLowerBetter
            />
            <AgencyMetricCard
              label="Lifetime value (LTV)"
              value={formatCurrency(summary.advancedMetrics?.currentLtv ?? 0)}
              caption="Estimado sobre 12 meses de ticket médio"
              changePercentage={summary.advancedMetrics?.ltvChangePercentage}
            />
          </StyledMetricsGrid>
        </>
      )}

      <StyledBanner tone="neutral">
        {summary.activeMetaAdsAccounts} conta(s) do Meta Ads conectada(s).
      </StyledBanner>
    </StyledContainer>
  );
};
