import { styled } from '@linaria/react';
import { IconRefresh } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { DiexOnboardingContextStep } from '@/diex-onboarding/components/DiexOnboardingContextStep';
import { DiexOnboardingDataFlowStep } from '@/diex-onboarding/components/DiexOnboardingDataFlowStep';
import { DiexOnboardingWhatsappStep } from '@/diex-onboarding/components/DiexOnboardingWhatsappStep';
import { useDiexOnboarding } from '@/diex-onboarding/hooks/useDiexOnboarding';

const StyledRoot = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledHeader = styled.section`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1fr) auto;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[5]};
`;

const StyledHeaderTitle = styled.h1`
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledHeaderSubtitle = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: ${themeCssVariables.spacing[1]} 0 0;
  max-width: 68ch;
`;

const StyledProgressLine = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-top: ${themeCssVariables.spacing[3]};
`;

const StyledSteps = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledError = styled.div`
  background: ${themeCssVariables.background.transparent.danger};
  border: 1px solid ${themeCssVariables.border.color.danger};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.danger};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

export const DiexOnboarding = () => {
  const {
    workspaceContext,
    dataFlow,
    connection,
    errorMessage,
    isLoading,
    isConnecting,
    isCreatingContext,
    isActivatingContext,
    load,
    requestConnection,
    createWorkspaceContext,
    activateWorkspaceContext,
  } = useDiexOnboarding();

  const isWhatsappDone = connection?.state === 'CONNECTED';
  const isContextDone = workspaceContext?.status === 'ACTIVE';
  const isDataFlowing = dataFlow.messageCount > 0;
  const doneCount = [isWhatsappDone, isContextDone, isDataFlowing].filter(
    Boolean,
  ).length;

  return (
    <StyledRoot>
      <StyledHeader>
        <div>
          <StyledHeaderTitle>Primeiros passos</StyledHeaderTitle>
          <StyledHeaderSubtitle>
            Três coisas separam este workspace de um CRM que trabalha sozinho: o
            número de WhatsApp conectado, o contexto que a IA usa para falar
            como a sua empresa, e a primeira conversa entrando.
          </StyledHeaderSubtitle>
          <StyledProgressLine>{doneCount} de 3 concluídos</StyledProgressLine>
        </div>
        <Button
          variant="secondary"
          Icon={IconRefresh}
          title="Atualizar"
          onClick={() => void load()}
        />
      </StyledHeader>

      {errorMessage ? <StyledError>{errorMessage}</StyledError> : null}

      <StyledSteps>
        <DiexOnboardingWhatsappStep
          connection={connection}
          isConnecting={isConnecting}
          isDone={isWhatsappDone}
          onRequestConnection={() => void requestConnection()}
        />
        <DiexOnboardingContextStep
          workspaceContext={workspaceContext}
          isLoading={isLoading}
          isCreatingContext={isCreatingContext}
          isActivatingContext={isActivatingContext}
          onCreateContext={() => void createWorkspaceContext()}
          onActivateContext={() => void activateWorkspaceContext()}
        />
        <DiexOnboardingDataFlowStep dataFlow={dataFlow} />
      </StyledSteps>
    </StyledRoot>
  );
};
