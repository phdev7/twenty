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
import { MainButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

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

  // Re-reads the onboarding status from the server. When an admin has approved
  // in the meantime the status changes and the app router moves the user on, so
  // approval takes effect without the user having to sign out and back in.
  const handleCheckAgain = async () => {
    setIsRefreshing(true);

    try {
      await loadCurrentUser();
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
          da Diex. Nenhum dado ou módulo do CRM pode ser acessado antes da
          aprovação.
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
