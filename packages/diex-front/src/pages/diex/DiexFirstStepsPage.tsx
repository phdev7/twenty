import { styled } from '@linaria/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPath } from 'diex-shared/types';
import { IconCheck, IconRocket, IconSparkles } from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { Modal } from 'diex-ui/surfaces';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { DiexOnboardingAiTriageStep } from '@/diex-onboarding/components/DiexOnboardingAiTriageStep';
import { DiexOnboardingArchitectureStep } from '@/diex-onboarding/components/DiexOnboardingArchitectureStep';
import { DiexOnboardingContextStep } from '@/diex-onboarding/components/DiexOnboardingContextStep';
import { DiexOnboardingDataFlowStep } from '@/diex-onboarding/components/DiexOnboardingDataFlowStep';
import { DiexOnboardingGoalStep } from '@/diex-onboarding/components/DiexOnboardingGoalStep';
import { DiexOnboardingOfferStep } from '@/diex-onboarding/components/DiexOnboardingOfferStep';
import { DiexOnboardingPageCatalogStep } from '@/diex-onboarding/components/DiexOnboardingPageCatalogStep';
import { DiexOnboardingReadinessCard } from '@/diex-onboarding/components/DiexOnboardingReadinessCard';
import { DiexOnboardingWhatsappStep } from '@/diex-onboarding/components/DiexOnboardingWhatsappStep';
import { useDiexOnboarding } from '@/diex-onboarding/hooks/useDiexOnboarding';
import { StyledActions } from '@/diex-onboarding/components/DiexOnboardingStepCard';
import { postInboxAppRoute } from '@/inbox/utils/postInboxAppRoute';
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

const StyledError = styled.p`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xs};
  margin: 0;
`;

const StyledCockpit = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledJourneyFocus = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledJourneyFocusLabel = styled.div`
  color: ${themeCssVariables.color.blue};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  text-transform: uppercase;
`;

const StyledCockpitTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledCockpitMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
`;

const StyledCockpitMetric = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledCockpitValue = styled.div`
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledCockpitLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const formatPipelineValue = (amountMicros: number, currencyCode: string) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amountMicros / 1_000_000);

export const DiexFirstStepsPage = () => {
  const navigate = useNavigate();
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [triageResult, setTriageResult] = useState<{
    summary?: string;
    intent?: string;
    suggestedReply?: string;
  } | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isFinishingSetup, setIsFinishingSetup] = useState(false);
  const {
    workspaceContext,
    workspaceContextReadState,
    isLoading,
    isCreatingContext,
    isSavingContext,
    isActivatingContext,
    dataFlow,
    connection,
    isConnecting,
    errorMessage,
    readiness,
    architecture,
    isLoadingCommercialData,
    isUpdatingArchitecture,
    isSavingGoal,
    isExecutingFirstFlow,
    commercialError,
    refreshCommercialData,
    requestConnection,
    createWorkspaceContext,
    saveWorkspaceContext,
    activateWorkspaceContext,
    approveArchitecture,
    applyArchitecture,
    regenerateArchitecture,
    createPage,
    archivePage,
    restorePage,
    togglePageNavigation,
    updatePage,
    setCommercialGoal,
    executeFirstCommercialFlow,
    completeCommercialOnboarding,
    load,
  } = useDiexOnboarding();

  const handleFinishSetup = async () => {
    setIsFinishingSetup(true);

    try {
      await completeCommercialOnboarding();
      window.localStorage.setItem('diex_first_steps_hidden', 'true');
      setIsCompletionModalOpen(false);
      navigate(AppPath.Index);
      window.location.reload();
    } catch (error) {
      setFlowError(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir o onboarding comercial.',
      );
      setIsFinishingSetup(false);
    }
  };

  const handleActivateContext = async () => {
    await activateWorkspaceContext();
    await refreshCommercialData();
  };

  const handleFirstCommercialFlow = async () => {
    setFlowError(null);

    try {
      const flow = await executeFirstCommercialFlow();

      try {
        const triage = await postInboxAppRoute<{
          summary?: string;
          intent?: string;
          suggestedReply?: string;
        }>('/rest/inbox/conversations/triage', {
          conversationId: flow.conversationId,
          registerSignal: true,
          proposeReply: true,
        });
        setTriageResult(triage);
      } catch {
        setFlowError(
          'O contato, a oportunidade e o follow-up foram criados. A classificação com IA precisa ser repetida.',
        );
      }
      await refreshCommercialData();
    } catch (error) {
      setFlowError(
        error instanceof Error
          ? error.message
          : 'Não foi possível executar o primeiro fluxo comercial.',
      );
    }
  };

  const journey = readiness?.onboardingJourney;
  const journeyBlockerLabels =
    journey?.blockers.map(
      (blocker) =>
        readiness?.items.find(({ key }) => key === blocker)?.label ?? blocker,
    ) ?? [];
  const journeyActionLabel =
    journey?.phase === 'DISCOVERY_REVIEW'
      ? 'Revisar contexto e oferta'
      : journey?.phase === 'ARCHITECTURE_APPROVAL'
        ? 'Revisar arquitetura'
        : journey?.phase === 'CHANNEL_CONNECTION'
          ? 'Conectar WhatsApp'
          : journey?.phase === 'FIRST_REVENUE_FLOW' &&
              readiness?.evidence.firstConversationId
            ? 'Executar primeiro fluxo'
            : journey?.phase === 'TEAM_ENABLEMENT'
              ? 'Configurar equipe'
              : journey?.phase === 'COCKPIT_OPERATIONAL'
                ? 'Abrir cockpit'
                : null;
  const handleJourneyAction = () => {
    if (!journey) {
      return;
    }

    if (journey.phase === 'DISCOVERY_REVIEW') {
      const targetId = journey.blockers.includes('offer_registered')
        ? 'diex-onboarding-offer'
        : 'diex-onboarding-context';
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (journey.phase === 'ARCHITECTURE_APPROVAL') {
      document
        .getElementById('diex-onboarding-architecture')
        ?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (journey.phase === 'CHANNEL_CONNECTION') {
      void requestConnection();
      return;
    }

    if (
      journey.phase === 'FIRST_REVENUE_FLOW' &&
      readiness?.evidence.firstConversationId
    ) {
      void handleFirstCommercialFlow();
      return;
    }

    if (journey.phase === 'TEAM_ENABLEMENT') {
      navigate(AppPath.InviteTeam);
      return;
    }

    if (journey.phase === 'COCKPIT_OPERATIONAL') {
      navigate('/diex/pages/commercial-intelligence');
    }
  };

  return (
    <PageCardLayout
      header={<PageHeader title="Primeiros passos" Icon={IconRocket} />}
    >
      <StyledBody>
        <StyledIntro>
          <StyledTitle>Chegue ao primeiro resultado comercial</StyledTitle>
          <StyledSubtitle>
            O onboarding só termina quando uma conversa real virar próxima ação
            no pipeline. O CRM precisa sair daqui pronto para operar e vender.
          </StyledSubtitle>
        </StyledIntro>
        <DiexOnboardingReadinessCard
          readiness={readiness}
          isLoading={isLoadingCommercialData}
        />
        {journey ? (
          <StyledJourneyFocus>
            <StyledJourneyFocusLabel>Agora</StyledJourneyFocusLabel>
            <StyledCockpitTitle>{journey.nextAction}</StyledCockpitTitle>
            {journey.blockers.length > 0 ? (
              <StyledSubtitle>
                A trilha só avança depois de confirmar:{' '}
                {journeyBlockerLabels.join(' · ')}.
              </StyledSubtitle>
            ) : null}
            {journeyActionLabel ? (
              <StyledActions>
                <Button
                  title={journeyActionLabel}
                  variant="primary"
                  disabled={
                    isConnecting ||
                    isExecutingFirstFlow ||
                    isUpdatingArchitecture
                  }
                  onClick={handleJourneyAction}
                />
              </StyledActions>
            ) : null}
          </StyledJourneyFocus>
        ) : null}
        <DiexOnboardingGoalStep
          selectedGoal={readiness?.goal ?? null}
          isSaving={isSavingGoal}
          onSelect={(goal) => void setCommercialGoal(goal)}
        />
        <div id="diex-onboarding-context">
          <DiexOnboardingContextStep
            index={2}
            title="Revise o contexto preparado pela IA"
            description="A IA extraiu empresa, cliente ideal, tom, regras, objeções, provas e limites. Corrija qualquer item antes de ativar; a ativação ainda não conclui o onboarding."
            workspaceContext={workspaceContext}
            readState={workspaceContextReadState}
            isLoading={isLoading}
            isCreatingContext={isCreatingContext}
            isSavingContext={isSavingContext}
            isActivatingContext={isActivatingContext}
            onCreateContext={() => void createWorkspaceContext()}
            onSaveContext={(draft) => void saveWorkspaceContext(draft)}
            onActivateContext={() => void handleActivateContext()}
            onRetry={() => void load()}
          />
        </div>
        <div id="diex-onboarding-architecture">
          <DiexOnboardingArchitectureStep
            architecture={architecture}
            isLoading={isLoadingCommercialData}
            isUpdating={isUpdatingArchitecture}
            canRegenerate={workspaceContext?.status === 'ACTIVE'}
            onApprove={() => void approveArchitecture()}
            onApply={() => void applyArchitecture()}
            onRegenerate={() => void regenerateArchitecture()}
          />
        </div>
        <div id="diex-onboarding-offer">
          <DiexOnboardingOfferStep
            offerCount={dataFlow.offerCount}
            isReady={readiness?.items.find(
              ({ key }) => key === 'offer_registered',
            )?.ready}
            onCreated={() => void load()}
          />
        </div>
        <DiexOnboardingWhatsappStep
          index={5}
          connection={connection}
          isConnecting={isConnecting}
          isDone={connection?.state === 'CONNECTED'}
          onRequestConnection={() => void requestConnection()}
        />
        <DiexOnboardingDataFlowStep
          index={6}
          dataFlow={dataFlow}
          onRefresh={() => void load()}
        />
        <DiexOnboardingAiTriageStep
          isDone={Boolean(
            readiness?.evidence.firstOpportunityId &&
              readiness.evidence.firstFollowUpCreated &&
              readiness.evidence.firstAiTriageCompleted,
          )}
          canRun={Boolean(readiness?.evidence.firstConversationId)}
          isRunning={isExecutingFirstFlow}
          triageResult={triageResult}
          onStart={() => void handleFirstCommercialFlow()}
        />
        <DiexOnboardingPageCatalogStep
          catalog={architecture?.pageCatalog ?? null}
          isLoading={isLoadingCommercialData}
          isUpdating={isUpdatingArchitecture}
          onCreate={(label, description) => void createPage(label, description)}
          onArchive={(key) => void archivePage(key)}
          onRestore={(key) => void restorePage(key)}
          onToggleNavigation={(page) => void togglePageNavigation(page)}
          onUpdate={(page) => void updatePage(page)}
        />
        <StyledCockpit>
          <StyledCockpitTitle>Seu cockpit inicial de receita</StyledCockpitTitle>
          <StyledSubtitle>
            A pergunta operacional é: qual ação gera mais receita hoje?
          </StyledSubtitle>
          <StyledCockpitMetrics>
            <StyledCockpitMetric>
              <StyledCockpitValue>
                {formatPipelineValue(
                  readiness?.dashboard.pipelineValueMicros ?? 0,
                  readiness?.dashboard.pipelineCurrencyCode ?? 'BRL',
                )}
              </StyledCockpitValue>
              <StyledCockpitLabel>Valor no pipeline</StyledCockpitLabel>
            </StyledCockpitMetric>
            <StyledCockpitMetric>
              <StyledCockpitValue>
                {readiness?.dashboard.unassignedOpportunities ?? 0}
              </StyledCockpitValue>
              <StyledCockpitLabel>Oportunidades sem responsável</StyledCockpitLabel>
            </StyledCockpitMetric>
            <StyledCockpitMetric>
              <StyledCockpitValue>
                {readiness?.dashboard.overdueFollowUps ?? 0}
              </StyledCockpitValue>
              <StyledCockpitLabel>Follow-ups vencidos</StyledCockpitLabel>
            </StyledCockpitMetric>
            <StyledCockpitMetric>
              <StyledCockpitValue>
                {readiness?.dashboard.unansweredLeads ?? 0}
              </StyledCockpitValue>
              <StyledCockpitLabel>Leads sem resposta</StyledCockpitLabel>
            </StyledCockpitMetric>
            <StyledCockpitMetric>
              <StyledCockpitValue>
                {readiness?.dashboard.averageResponseMinutes ?? '—'}
              </StyledCockpitValue>
              <StyledCockpitLabel>Minutos médios de resposta</StyledCockpitLabel>
            </StyledCockpitMetric>
            <StyledCockpitMetric>
              <StyledCockpitValue>
                {readiness?.dashboard.nextActions ?? 0}
              </StyledCockpitValue>
              <StyledCockpitLabel>Próximas ações</StyledCockpitLabel>
            </StyledCockpitMetric>
            <StyledCockpitMetric>
              <StyledCockpitValue>
                {readiness?.dashboard.commercialRisks ?? 0}
              </StyledCockpitValue>
              <StyledCockpitLabel>Riscos comerciais</StyledCockpitLabel>
            </StyledCockpitMetric>
          </StyledCockpitMetrics>
          <StyledActions>
            {(readiness?.counts.activeOwners ?? 0) === 0 ? (
              <Button
                title="Convidar e configurar equipe"
                variant="primary"
                onClick={() => navigate(AppPath.InviteTeam)}
              />
            ) : null}
            <Button
              title="Abrir Inbox Comercial"
              variant="secondary"
              onClick={() => navigate('/diex/pages/inbox-commercial')}
            />
            <Button
              title="Abrir cockpit comercial"
              variant="secondary"
              onClick={() => navigate('/diex/pages/commercial-intelligence')}
            />
          </StyledActions>
        </StyledCockpit>
        {errorMessage ? <StyledError>{errorMessage}</StyledError> : null}
        {commercialError ? <StyledError>{commercialError}</StyledError> : null}
        {flowError ? <StyledError>{flowError}</StyledError> : null}
        {readiness?.ready ? (
          <div style={{ marginTop: 16 }}>
            <Button
              title="Concluir e ocultar Primeiros passos"
              Icon={IconCheck}
              variant="primary"
              onClick={() => setIsCompletionModalOpen(true)}
            />
          </div>
        ) : null}
      </StyledBody>

      {isCompletionModalOpen && (
        <Modal isOpen={isCompletionModalOpen}>
          <StyledModalContent>
            <StyledModalTitle>
              <IconSparkles size={24} color={themeCssVariables.color.blue} />
              Seu CRM está pronto para vender.
            </StyledModalTitle>
            <StyledModalText>
              O contexto foi ativado, a arquitetura foi aprovada, o canal recebeu
              uma conversa real, a empresa foi vinculada e a IA classificou o
              lead com resposta sugerida. O sistema criou oportunidade,
              responsável e follow-up; o cockpit já mostra a próxima ação comercial.
            </StyledModalText>
            <Button
              title="Ir para a plataforma"
              Icon={IconRocket}
              variant="primary"
              disabled={isFinishingSetup}
              onClick={handleFinishSetup}
            />
          </StyledModalContent>
        </Modal>
      )}
    </PageCardLayout>
  );
};
