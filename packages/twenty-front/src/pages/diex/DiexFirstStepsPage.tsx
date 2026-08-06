import { styled } from '@linaria/react';
import { IconRocket } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { DiexOnboardingContextStep } from '@/diex-onboarding/components/DiexOnboardingContextStep';
import { useDiexWorkspaceContext } from '@/diex-onboarding/hooks/useDiexWorkspaceContext';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

const StyledBody = styled.main`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledIntro = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  max-width: 760px;
`;

const StyledTitle = styled.h1`
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: 0;
`;

export const DiexFirstStepsPage = () => {
  const {
    workspaceContext,
    workspaceContextReadState,
    isLoadingWorkspaceContext,
    isCreatingContext,
    isSavingContext,
    isActivatingContext,
    refetchWorkspaceContext,
    createWorkspaceContext,
    saveWorkspaceContext,
    activateWorkspaceContext,
  } = useDiexWorkspaceContext();

  return (
    <PageCardLayout
      header={<PageHeader title="Primeiros passos" Icon={IconRocket} />}
    >
      <StyledBody>
        <StyledIntro>
          <StyledTitle>Seu contexto inicial está pronto</StyledTitle>
          <StyledSubtitle>
            A IA organizou a descrição da sua operação. Revise os campos abaixo
            e ative o contexto para que ele passe a orientar análises, triagens
            e respostas em todo o CRM.
          </StyledSubtitle>
        </StyledIntro>
        <DiexOnboardingContextStep
          index={1}
          title="Revise o contexto preparado pela IA"
          description="Ajuste qualquer informação necessária e confirme. Campos sem evidência foram marcados para revisão, sem invenção de dados pela IA."
          workspaceContext={workspaceContext}
          readState={workspaceContextReadState}
          isLoading={isLoadingWorkspaceContext}
          isCreatingContext={isCreatingContext}
          isSavingContext={isSavingContext}
          isActivatingContext={isActivatingContext}
          onCreateContext={() => void createWorkspaceContext()}
          onSaveContext={(draft) => void saveWorkspaceContext(draft)}
          onActivateContext={() => void activateWorkspaceContext()}
          onRetry={() => void refetchWorkspaceContext()}
        />
      </StyledBody>
    </PageCardLayout>
  );
};
