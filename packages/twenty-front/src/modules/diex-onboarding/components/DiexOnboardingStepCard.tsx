import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { IconCheck } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCard = styled.article`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: auto minmax(0, 1fr);
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledMarker = styled.div<{ isDone: boolean }>`
  align-items: center;
  background: ${({ isDone }) =>
    isDone
      ? themeCssVariables.tag.background.green
      : themeCssVariables.background.transparent.blue};
  border: 1px solid
    ${({ isDone }) =>
      isDone ? 'transparent' : themeCssVariables.border.color.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ isDone }) =>
    isDone ? themeCssVariables.color.green : themeCssVariables.color.blue};
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: 28px;
  justify-content: center;
  width: 28px;
`;

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledHeadline = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

export const StyledText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
  max-width: 72ch;
`;

export const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

type DiexOnboardingStepCardProps = {
  index: number;
  isDone: boolean;
  title: string;
  badges?: ReactNode;
  children: ReactNode;
};

export const DiexOnboardingStepCard = ({
  index,
  isDone,
  title,
  badges,
  children,
}: DiexOnboardingStepCardProps) => (
  <StyledCard>
    <StyledMarker isDone={isDone}>
      {isDone ? <IconCheck size={14} /> : index}
    </StyledMarker>
    <StyledBody>
      <StyledHeadline>
        <StyledTitle>{title}</StyledTitle>
        {badges}
      </StyledHeadline>
      {children}
    </StyledBody>
  </StyledCard>
);
