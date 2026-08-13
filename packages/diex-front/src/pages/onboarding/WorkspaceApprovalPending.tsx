import { styled } from '@linaria/react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

const StyledSummary = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[5]};
  max-width: 520px;
  padding: ${themeCssVariables.spacing[4]};
  width: calc(100% - ${themeCssVariables.spacing[8]});
`;

const StyledSummaryRow = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.4;
`;

const GOAL_LABELS: Record<string, string> = {
  SELL_MORE: 'Vender mais',
  RESPOND_FASTER: 'Responder leads mais rápido',
  ORGANIZE_WHATSAPP: 'Organizar o WhatsApp',
  CONTROL_FOLLOWUPS: 'Controlar follow-ups',
  CUSTOMER_SUCCESS_RENEWALS: 'Customer Success e renovações',
};

export const WorkspaceApprovalPending = () => {
  const { t } = useLingui();
  const { signOut } = useAuth();
  const { loadCurrentUser } = useLoadCurrentUser();
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  // Trava de reentrância: em estado, o closure lê valor obsoleto e deixa duas
  // verificações correrem juntas.
  // oxlint-disable-next-line diex/no-state-useref
  const isCheckingRef = useRef(false);

  // Metadata loaded while the workspace is pending is intentionally minimal.
  // Once approval is detected, a full navigation rebuilds the Apollo cache and
  // metadata store before the first workspace object query is mounted.
  const handleCheckAgain = useCallback(async () => {
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    setIsRefreshing(true);

    try {
      const { user } = await loadCurrentUser();

      setLastCheckedAt(new Date());
      setCheckError(null);

      if (
        user.onboardingStatus !== OnboardingStatus.WORKSPACE_APPROVAL_PENDING
      ) {
        window.location.replace(AppPath.DiexOnboarding);
      }
    } catch {
      setLastCheckedAt(new Date());
      setCheckError(
        'Não foi possível consultar a aprovação agora. A próxima verificação será automática.',
      );
    } finally {
      isCheckingRef.current = false;
      setIsRefreshing(false);
    }
  }, [loadCurrentUser]);

  useEffect(() => {
    void handleCheckAgain();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void handleCheckAgain();
      }
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void handleCheckAgain();
      }
    }, 15_000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleCheckAgain]);

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
          da Diex. As respostas do cadastro ficam preservadas, mas nenhuma
          estrutura operacional nem processamento de IA com consumo de tokens é
          executado antes da aprovação.
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
        <StyledSummary>
          <StyledSummaryRow>
            <strong>Objetivo:</strong>{' '}
            {currentWorkspace?.onboardingPrimaryGoal
              ? (GOAL_LABELS[currentWorkspace.onboardingPrimaryGoal] ??
                currentWorkspace.onboardingPrimaryGoal)
              : 'aguardando confirmação'}
          </StyledSummaryRow>
          <StyledSummaryRow>
            <strong>Operação:</strong>{' '}
            {currentWorkspace?.onboardingCompanyDescription ||
              'descrição recebida no cadastro'}
          </StyledSummaryRow>
          <StyledSummaryRow>
            Após a liberação, você revisará o entendimento da IA antes de
            aprovar qualquer mudança estrutural.
          </StyledSummaryRow>
        </StyledSummary>
      </OnboardingStepAnimatedItem>
      <OnboardingStepAnimatedItem index={5}>
        <StyledButtonContainer>
          <MainButton
            title="Verificar aprovação"
            onClick={() => {
              void handleCheckAgain();
            }}
            disabled={isRefreshing}
            fullWidth
          />
          <StyledDetail>
            {checkError ??
              (lastCheckedAt
                ? `Última verificação: ${lastCheckedAt.toLocaleTimeString(
                    'pt-BR',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}`
                : 'A aprovação é verificada automaticamente a cada 15 segundos.')}
          </StyledDetail>
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
