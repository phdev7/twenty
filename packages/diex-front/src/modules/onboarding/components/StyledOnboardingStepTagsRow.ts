import { styled } from '@linaria/react';
import { themeCssVariables } from 'diex-ui/theme-constants';

export const StyledOnboardingStepTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
  padding-top: ${themeCssVariables.spacing[1]};
`;
