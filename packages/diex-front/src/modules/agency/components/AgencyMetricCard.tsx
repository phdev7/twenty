import { styled } from '@linaria/react';
import { themeCssVariables } from 'diex-ui/theme-constants';

type AgencyMetricCardProps = {
  label: string;
  value: string;
  caption: string;
  changePercentage?: number;
  // CPL and CAC improve when they fall, so the badge colour cannot be derived
  // from the sign of the change alone.
  isLowerBetter?: boolean;
};

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledCaption = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledTrendBadge = styled.span<{ tone: 'positive' | 'negative' }>`
  background: ${({ tone }) =>
    tone === 'positive'
      ? themeCssVariables.tag.background.green
      : themeCssVariables.tag.background.red};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${({ tone }) =>
    tone === 'positive'
      ? themeCssVariables.tag.text.green
      : themeCssVariables.tag.text.red};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

export const AgencyMetricCard = ({
  label,
  value,
  caption,
  changePercentage,
  isLowerBetter = false,
}: AgencyMetricCardProps) => {
  const hasChange = changePercentage !== undefined;
  const hasRisen = (changePercentage ?? 0) >= 0;
  const isImprovement = isLowerBetter ? !hasRisen : hasRisen;

  return (
    <StyledCard>
      <StyledHeader>
        <StyledLabel>{label}</StyledLabel>
        {hasChange && (
          <StyledTrendBadge tone={isImprovement ? 'positive' : 'negative'}>
            {hasRisen ? '↑' : '↓'} {Math.abs(changePercentage).toFixed(1)}%
          </StyledTrendBadge>
        )}
      </StyledHeader>
      <StyledValue>{value}</StyledValue>
      <StyledCaption>{caption}</StyledCaption>
    </StyledCard>
  );
};
