import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type DiexOnboardingBadgeTone =
  | 'green'
  | 'gray'
  | 'orange'
  | 'blue'
  | 'red';

const tonePalette: Record<
  DiexOnboardingBadgeTone,
  { background: string; color: string }
> = {
  green: {
    background: themeCssVariables.tag.background.green,
    color: themeCssVariables.tag.text.green,
  },
  gray: {
    background: themeCssVariables.tag.background.gray,
    color: themeCssVariables.tag.text.gray,
  },
  orange: {
    background: themeCssVariables.tag.background.orange,
    color: themeCssVariables.tag.text.orange,
  },
  blue: {
    background: themeCssVariables.tag.background.blue,
    color: themeCssVariables.tag.text.blue,
  },
  red: {
    background: themeCssVariables.tag.background.red,
    color: themeCssVariables.tag.text.red,
  },
};

const StyledBadge = styled.span<{ background: string; color: string }>`
  align-items: center;
  background: ${({ background }) => background};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ color }) => color};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 1;
  max-width: 100%;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  white-space: nowrap;
`;

export const DiexOnboardingBadge = ({
  tone,
  children,
}: {
  tone: DiexOnboardingBadgeTone;
  children: ReactNode;
}) => {
  const palette = tonePalette[tone];

  return (
    <StyledBadge background={palette.background} color={palette.color}>
      {children}
    </StyledBadge>
  );
};
