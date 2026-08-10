import { styled } from '@linaria/react';
import { useState } from 'react';

import { Logo } from '@/auth/components/Logo';
import { SubTitle } from '@/auth/components/SubTitle';
import { Title } from '@/auth/components/Title';
import { useAuth } from '@/auth/hooks/useAuth';
import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { OnboardingStepAnimatedItem } from '@/onboarding/components/OnboardingStepAnimatedItem';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLoadCurrentUser } from '@/users/hooks/useLoadCurrentUser';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { MainButton } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { AppPath } from 'diex-shared/types';
import { OnboardingStatus } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

const StyledButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[8]};
  width: 200px;
`;

const StyledDetail = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  margin-top: ${themeCssVariables.spacing[4]};
  text-align: center;
`;

export const WorkspaceApprovalPending = () => {
  const { t } = useLingui();
  const { signOut } = useAuth();
  const { loadCurrentUser } = useLoadCurrentUser();
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Metadata loaded while the workspace is pending is intentionally minimal.
  // Once approval is detected, a full navigation rebuilds the Apollo cache and
  // metadata store before the first workspace object query is mounted.
  const handleCheckAgain = async () => {
    setIsRefreshing(true);

    try {
      const { user } = await loadCurrentUser();

      if (
        user.onboardingStatus !== OnboardingStatus.WORKSPACE_APPROVAL_PENDING
      ) {
        window.location.replace(AppPath.DiexOnboarding);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <StyledContainer>
      <OnboardingStepAnimatedItem index={0}>
        <Logo
          primaryLogo={
            isNonEmptyString(currentWorkspace?.logo)
              ? currentWorkspace?.logo
              : undefined
          }
        />
      </OnboardingStepAnimatedItem>
      <OnboardingStepAnimatedItem index={1}>
        <Title>Cadastro recebido</Title>
      </OnboardingStepAnimatedItem>
      <OnboardingStepAnimatedItem index={2}>
        <SubTitle>
          Seu workspace está protegido e aguarda a liberação de um administrador
          da Diex. Nenhum dado, módulo ou processamento de IA com consumo de
          tokens é executado antes da aprovação.
        </SubTitle>
      </OnboardingStepAnimatedItem>
      <OnboardingStepAnimatedItem index={3}>
        <StyledDetail>
          {isNonEmptyString(currentWorkspace?.displayName) && (
            <div>{currentWorkspace.displayName}</div>
          )}
          {isNonEmptyString(currentUser?.email) && (
            <div>{currentUser.email}</div>
          )}
        </StyledDetail>
      </OnboardingStepAnimatedItem>
      <OnboardingStepAnimatedItem index={4}>
        <StyledButtonContainer>
          <MainButton
            title="Verificar aprovação"
            onClick={() => {
              void handleCheckAgain();
            }}
            disabled={isRefreshing}
            fullWidth
          />
          <MainButton
            title={t`Sign out`}
            variant="secondary"
            onClick={() => {
              void signOut();
            }}
            fullWidth
          />
        </StyledButtonContainer>
      </OnboardingStepAnimatedItem>
    </StyledContainer>
  );
};
