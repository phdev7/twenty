import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'diex-ui/theme-constants';

export type DiexAccessRequestBadgeTone =
  | 'blue'
  | 'green'
  | 'gray'
  | 'yellow'
  | 'turquoise';

const tonePalette: Record<
  DiexAccessRequestBadgeTone,
  { background: string; color: string }
> = {
  blue: {
    background: themeCssVariables.tag.background.blue,
    color: themeCssVariables.tag.text.blue,
  },
  green: {
    background: themeCssVariables.tag.background.green,
    color: themeCssVariables.tag.text.green,
  },
  gray: {
    background: themeCssVariables.tag.background.gray,
    color: themeCssVariables.tag.text.gray,
  },
  yellow: {
    background: themeCssVariables.tag.background.yellow,
    color: themeCssVariables.tag.text.yellow,
  },
  turquoise: {
    background: themeCssVariables.tag.background.turquoise,
    color: themeCssVariables.tag.text.turquoise,
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
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  white-space: nowrap;
`;

export const DiexAccessRequestBadge = ({
  tone,
  children,
}: {
  tone: DiexAccessRequestBadgeTone;
  children: ReactNode;
}) => {
  const palette = tonePalette[tone];

  return (
    <StyledBadge background={palette.background} color={palette.color}>
      {children}
    </StyledBadge>
  );
};
