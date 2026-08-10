import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { useNavigate } from 'react-router-dom';
import { AppPath } from 'diex-shared/types';
import { IconRocket } from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
} from 'diex-ui/feedback';

const StyledPlaceholderContainer = styled.div`
  background: ${themeCssVariables.background.secondary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${themeCssVariables.spacing[2]};
  position: relative;
  width: 100%;
`;

export const StandaloneWidgetPlaceholder = () => {
  const navigate = useNavigate();

  return (
    <StyledPlaceholderContainer className="widget">
      <AnimatedPlaceholderEmptyContainer>
        <AnimatedPlaceholder type="noWidgets" />
        <AnimatedPlaceholderEmptyTextContainer>
          <AnimatedPlaceholderEmptyTitle>
            <Trans>Esta operação ainda está sendo preparada</Trans>
          </AnimatedPlaceholderEmptyTitle>
          <AnimatedPlaceholderEmptySubTitle>
            <Trans>
              Conecte o canal e abra os Primeiros passos para publicar a
              arquitetura comercial desta empresa.
            </Trans>
          </AnimatedPlaceholderEmptySubTitle>
          <Button
            title="Abrir Primeiros passos"
            Icon={IconRocket}
            variant="secondary"
            onClick={() => navigate(AppPath.DiexFirstSteps)}
          />
        </AnimatedPlaceholderEmptyTextContainer>
      </AnimatedPlaceholderEmptyContainer>
    </StyledPlaceholderContainer>
  );
};
