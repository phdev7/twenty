import { styled } from '@linaria/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { IconCheck, IconRocket, IconSparkles } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { Modal } from 'twenty-ui/surfaces';
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

const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledModalTitle = styled.h2`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledModalText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: 0;
`;

export const DiexFirstStepsPage = () => {
  const navigate = useNavigate();
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
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

  const handleFinishSetup = () => {
    window.localStorage.setItem('diex_first_steps_hidden', 'true');
    setIsCompletionModalOpen(false);
    navigate(AppPath.Index);
    window.location.reload();
  };

  const handleActivateAndShowModal = async () => {
    await activateWorkspaceContext();
    setIsCompletionModalOpen(true);
  };

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
          onActivateContext={() => void handleActivateAndShowModal()}
          onRetry={() => void refetchWorkspaceContext()}
        />
        {workspaceContextReadState === 'READY' && (
          <div style={{ marginTop: 16 }}>
            <Button
              title="Concluir Primeiros passos e Ocultar Menu"
              Icon={IconCheck}
              variant="primary"
              onClick={() => setIsCompletionModalOpen(true)}
            />
          </div>
        )}
      </StyledBody>

      {isCompletionModalOpen && (
        <Modal isOpen={isCompletionModalOpen}>
          <StyledModalContent>
            <StyledModalTitle>
              <IconSparkles size={24} color={themeCssVariables.color.blue} />
              Seu CRM está pronto!
            </StyledModalTitle>
            <StyledModalText>
              O contexto operacional foi ativado e o Arquiteto de Workspace deixou a estrutura pronta para sua equipe.
              O item &quot;Primeiros passos&quot; foi ocultado do menu lateral para manter sua navegação limpa. Administradores podem reabri-lo a qualquer momento em Configurações.
            </StyledModalText>
            <Button
              title="Ir para a plataforma"
              Icon={IconRocket}
              variant="primary"
              onClick={handleFinishSetup}
            />
          </StyledModalContent>
        </Modal>
      )}
    </PageCardLayout>
  );
};
