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
import { DiexOnboardingProductUpdates } from '@/diex-onboarding/components/DiexOnboardingProductUpdates';
import { DiexOnboardingWhatsappStep } from '@/diex-onboarding/components/DiexOnboardingWhatsappStep';
import { useDiexOnboarding } from '@/diex-onboarding/hooks/useDiexOnboarding';
import { StyledActions } from '@/diex-onboarding/components/DiexOnboardingStepCard';
import { postInboxAppRoute } from '@/inbox/utils/postInboxAppRoute';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const StyledBody = styled.main`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledIntro = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  max-width: 640px;
`;

const StyledTitle = styled.h1`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.4;
  margin: 0;
`;

const StyledSetupBar = styled.section`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledSetupSteps = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledSetupStep = styled.div<{ ready: boolean }>`
  align-items: center;
  color: ${({ ready }) =>
    ready
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSetupMarker = styled.span<{ ready: boolean }>`
  align-items: center;
  background: ${({ ready }) =>
    ready
      ? themeCssVariables.tag.background.green
      : themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ ready }) =>
    ready
      ? themeCssVariables.color.green
      : themeCssVariables.font.color.tertiary};
  display: flex;
  height: 18px;
  justify-content: center;
  width: 18px;
`;

const StyledMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
`;

const StyledError = styled.p`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xs};
  margin: 0;
`;

const StyledCard = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledCardTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledPending = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledPendingItem = styled.li`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
`;

const StyledMetric = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledMetricValue = styled.div`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMetricLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin-top: ${themeCssVariables.spacing['0.5']};
`;

const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledModalTitle = styled.h2`
  align-items: center;
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  margin: 0;
`;

const SETUP_STEP_LABELS: Record<string, string> = {
  context_active: 'Entendimento revisado',
  architecture_approved: 'Estrutura publicada',
};

const formatPipelineValue = (amountMicros: number, currencyCode: string) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amountMicros / 1_000_000);

export const DiexFirstStepsPage = () => {
  const navigate = useNavigate();
  const canManageWorkspace = useHasPermissionFlag(PermissionFlagType.WORKSPACE);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [triageResult, setTriageResult] = useState<{
    summary?: string;
    intent?: string;
    suggestedReply?: string;
  } | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isFinishingSetup, setIsFinishingSetup] = useState(false);
  const [isEditingArchitectureContext, setIsEditingArchitectureContext] =
    useState(false);
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
    isSavingPrimaryChannel,
    isExecutingFirstFlow,
    isAcknowledgingProductUpdate,
    commercialError,
    isReadinessReadConfirmed,
    isArchitectureReadConfirmed,
    isPageCatalogReadConfirmed,
    refreshCommercialData,
    requestConnection,
    createWorkspaceContext,
    saveWorkspaceContext,
    activateWorkspaceContext,
    approveArchitecture,
    applyArchitecture,
    regenerateArchitecture,
    setCommercialGoal,
    setPrimaryChannel,
    executeFirstCommercialFlow,
    acknowledgeProductUpdate,
    completeCommercialOnboarding,
    unlockWorkspaceSetup,
    load,
  } = useDiexOnboarding();
  const operationLabel =
    (isReadinessReadConfirmed
      ? readiness?.readinessPack?.operationLabel
      : null) ?? 'operação';
  const pageLabel =
    (isPageCatalogReadConfirmed
      ? architecture?.pageCatalog?.items.find(
          ({ key }) => key === 'first-steps',
        )?.label
      : null) ?? 'Primeiros passos';
  const readyLabel =
    readiness?.readinessPack?.readyLabel ?? 'CRM pronto para operar';
  const hasOpportunityFlow = Boolean(
    readiness?.readinessPack?.criteria.some(
      ({ key, required }) => key === 'first_opportunity_created' && required,
    ),
  );
  const protectsRevenue = readiness?.goal === 'CUSTOMER_SUCCESS_RENEWALS';
  const canViewCommercialData =
    readiness?.visibility?.canViewCommercialData !== false;
  const activeOperationalPages =
    architecture?.pageCatalog?.items.filter(
      ({ status }) => status === 'ACTIVE',
    ) ?? [];
  const inboxRoute =
    activeOperationalPages.find(({ key }) => key === 'inbox-commercial')
      ?.route ??
    activeOperationalPages.find(({ renderer }) => renderer === 'INBOX')
      ?.route ??
    '/diex/pages';
  const cockpitRoute =
    activeOperationalPages.find(({ key }) => key === 'commercial-intelligence')
      ?.route ??
    activeOperationalPages.find(({ renderer }) => renderer === 'DASHBOARD')
      ?.route ??
    '/diex/pages';

  const journey = isReadinessReadConfirmed
    ? readiness?.onboardingJourney
    : undefined;
  const setup = isReadinessReadConfirmed ? readiness?.setup : undefined;
  // Servidor sem o portão de configuração (deploy em rolagem) continua no
  // comportamento anterior, em que só a prontidão total liberava a conclusão.
  const isSetupComplete = setup ? setup.complete : (readiness?.ready ?? false);
  const setupBlockerKeys = new Set(setup?.blockers.map(({ key }) => key) ?? []);
  // Os passos que travam o uso vêm do portão, não da fase da jornada: um
  // critério não estrutural pendente mantinha a jornada em descoberta e a
  // aprovação da estrutura nunca aparecia.
  const needsContextReview = setup
    ? setupBlockerKeys.has('context_active')
    : journey?.phase === 'DISCOVERY_REVIEW';
  const needsArchitectureApproval =
    !needsContextReview &&
    (setup
      ? setupBlockerKeys.has('architecture_approved')
      : journey?.phase === 'ARCHITECTURE_APPROVAL');
  const setupSteps =
    setup?.steps.map(({ key, label, ready }) => ({
      key,
      label: SETUP_STEP_LABELS[key] ?? label,
      ready,
    })) ?? [];
  const pendingNextSteps = (readiness?.items ?? []).filter(
    ({ required, ready, blocksActivation }) =>
      required && !ready && blocksActivation !== true,
  );
  const primaryChannel = isReadinessReadConfirmed
    ? (readiness?.evidence.primaryChannel ?? null)
    : null;
  const operatesWithRecords =
    primaryChannel === 'IMPORT' || primaryChannel === 'MANUAL';
  const firstRevenueFlowReady =
    readiness?.items
      .filter(({ key }) =>
        [
          'first_contact_identified',
          'first_company_linked',
          'first_opportunity_created',
          'first_follow_up_created',
        ].includes(key),
      )
      .every(({ required, ready }) => !required || ready) ?? false;
  const showGoalStep =
    isSetupComplete &&
    pendingNextSteps.some(({ key }) => key === 'goal_defined');
  const showOfferStep =
    isSetupComplete &&
    pendingNextSteps.some(({ key }) => key === 'offer_registered');
  const showChannelStep =
    isSetupComplete &&
    !showGoalStep &&
    !showOfferStep &&
    pendingNextSteps.some(({ key }) => key === 'channel_connected');
  const showFirstFlowStep =
    isSetupComplete &&
    !showGoalStep &&
    !showOfferStep &&
    !showChannelStep &&
    pendingNextSteps.some(({ key }) => key.startsWith('first_'));

  const handleFinishSetup = async () => {
    setIsFinishingSetup(true);

    try {
      await completeCommercialOnboarding();
      setIsCompletionModalOpen(false);
      window.location.replace(cockpitRoute);
    } catch (error) {
      setFlowError(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a configuração.',
      );
      setIsFinishingSetup(false);
    }
  };

  const handleUnlockWorkspace = async () => {
    setIsFinishingSetup(true);

    try {
      await unlockWorkspaceSetup();
      window.location.replace(cockpitRoute);
    } catch (error) {
      setFlowError(
        error instanceof Error
          ? error.message
          : 'Não foi possível liberar o CRM.',
      );
      setIsFinishingSetup(false);
    }
  };

  const handleActivateContext = async () => {
    await activateWorkspaceContext();
    await refreshCommercialData();
  };

  const handleReviewProductUpdate = (actionRoute: string) => {
    navigate(actionRoute);

    if (!actionRoute.startsWith('/diex/first-steps')) {
      return;
    }

    setIsEditingArchitectureContext(true);
    window.requestAnimationFrame(() => {
      document.getElementById('diex-commercial-context')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
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
          'O contato e a próxima ação foram criados. A triagem com IA precisa ser repetida.',
        );
      }
      await refreshCommercialData();
    } catch (error) {
      setFlowError(
        error instanceof Error
          ? error.message
          : 'Não foi possível executar o primeiro fluxo.',
      );
    }
  };

  return (
    <PageCardLayout header={<PageHeader title={pageLabel} Icon={IconRocket} />}>
      <StyledBody>
        <StyledIntro>
          <StyledTitle>
            {isSetupComplete
              ? `Seu CRM de ${operationLabel.toLowerCase()} está configurado`
              : `Configurar sua ${operationLabel.toLowerCase()}`}
          </StyledTitle>
          <StyledSubtitle>
            {isSetupComplete
              ? 'Use agora. Os itens abaixo melhoram o resultado e não travam nada.'
              : 'Revise o que a IA entendeu e publique a estrutura. São duas confirmações.'}
          </StyledSubtitle>
        </StyledIntro>

        <StyledSetupBar>
          <StyledSetupSteps>
            {setupSteps.length > 0
              ? setupSteps.map(({ key, label, ready }) => (
                  <StyledSetupStep key={key} ready={ready}>
                    <StyledSetupMarker ready={ready}>
                      {ready ? <IconCheck size={11} /> : '·'}
                    </StyledSetupMarker>
                    {label}
                  </StyledSetupStep>
                ))
              : null}
          </StyledSetupSteps>
          <StyledMeta>
            {isLoadingCommercialData && !readiness
              ? 'Lendo a operação...'
              : readiness
                ? `Prontidão ${readiness.score}%`
                : 'Prontidão não confirmada'}
          </StyledMeta>
        </StyledSetupBar>

        {commercialError ? (
          <StyledCard>
            <StyledError>{commercialError}</StyledError>
            <StyledActions>
              <Button
                title="Tentar novamente"
                variant="secondary"
                disabled={isLoadingCommercialData}
                onClick={() => void load()}
              />
            </StyledActions>
          </StyledCard>
        ) : null}

        {isReadinessReadConfirmed && readiness?.productUpdates ? (
          <DiexOnboardingProductUpdates
            productUpdates={readiness.productUpdates}
            canManageUpdates={canManageWorkspace}
            isAcknowledging={isAcknowledgingProductUpdate}
            onReview={handleReviewProductUpdate}
            onAcknowledge={(updateKey) =>
              void acknowledgeProductUpdate(updateKey)
            }
          />
        ) : null}

        {needsContextReview || isEditingArchitectureContext ? (
          <div id="diex-commercial-context">
            <DiexOnboardingContextStep
              index={1}
              title="Revise o que a IA entendeu"
              description="Corrija o que estiver errado e ative. Nada de estrutural é publicado aqui."
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
              onBack={
                isEditingArchitectureContext
                  ? () => setIsEditingArchitectureContext(false)
                  : undefined
              }
              onRegenerate={
                isEditingArchitectureContext && isArchitectureReadConfirmed
                  ? () => void regenerateArchitecture()
                  : undefined
              }
              isRegenerating={isUpdatingArchitecture}
            />
          </div>
        ) : null}

        {needsArchitectureApproval && !isEditingArchitectureContext ? (
          <DiexOnboardingArchitectureStep
            architecture={architecture}
            isLoading={isLoadingCommercialData}
            isReadConfirmed={isArchitectureReadConfirmed}
            isUpdating={isUpdatingArchitecture}
            canRegenerate={workspaceContext?.status === 'ACTIVE'}
            onApprove={() => void approveArchitecture()}
            onApply={() => void applyArchitecture()}
            onRegenerate={() => void regenerateArchitecture()}
            onEditContext={() => setIsEditingArchitectureContext(true)}
          />
        ) : null}

        {isSetupComplete && !isEditingArchitectureContext ? (
          <StyledCard>
            <StyledCardTitle>Abrir o CRM</StyledCardTitle>
            <StyledSubtitle>
              Estrutura, páginas e menu já seguem os termos da sua operação.
            </StyledSubtitle>
            <StyledActions>
              <Button
                title="Abrir meu CRM"
                Icon={IconRocket}
                variant="primary"
                onClick={() => setIsCompletionModalOpen(true)}
              />
              <Button
                title="Revisar entendimento e estrutura"
                variant="secondary"
                onClick={() => setIsEditingArchitectureContext(true)}
              />
            </StyledActions>
            {pendingNextSteps.length > 0 ? (
              <>
                <StyledMeta>Melhoram o resultado, sem travar o uso:</StyledMeta>
                <StyledPending>
                  {pendingNextSteps.slice(0, 5).map(({ key, label }) => (
                    <StyledPendingItem key={key}>· {label}</StyledPendingItem>
                  ))}
                </StyledPending>
              </>
            ) : null}
          </StyledCard>
        ) : null}

        {!isSetupComplete && canManageWorkspace ? (
          <StyledCard>
            <StyledCardTitle>Precisa usar agora?</StyledCardTitle>
            <StyledSubtitle>
              Libera o CRM inteiro e mantém esta página no menu para terminar
              depois.
            </StyledSubtitle>
            <StyledActions>
              <Button
                title="Usar o CRM agora"
                variant="secondary"
                disabled={isFinishingSetup}
                onClick={() => void handleUnlockWorkspace()}
              />
            </StyledActions>
          </StyledCard>
        ) : null}

        {showGoalStep ? (
          <DiexOnboardingGoalStep
            selectedGoal={readiness?.goal ?? null}
            isSaving={isSavingGoal}
            onSelect={(goal) => void setCommercialGoal(goal)}
          />
        ) : null}

        {showOfferStep ? (
          <DiexOnboardingOfferStep
            offers={dataFlow.offers}
            activeOfferCount={
              readiness?.counts?.activeOffers ?? dataFlow.activeOfferCount
            }
            isReady={
              readiness?.items.find(({ key }) => key === 'offer_registered')
                ?.ready
            }
            isReadConfirmed={!dataFlow.unconfirmedSources.includes('offers')}
            readError={dataFlow.errorMessage}
            onChanged={() => void load()}
          />
        ) : null}

        {showChannelStep ? (
          <DiexOnboardingWhatsappStep
            index={3}
            connection={connection}
            primaryChannel={primaryChannel}
            isSavingPreference={isSavingPrimaryChannel}
            isConnecting={isConnecting}
            isDone={Boolean(
              readiness?.items.find(({ key }) => key === 'channel_connected')
                ?.ready,
            )}
            errorMessage={errorMessage}
            onSelectChannel={(channel) => void setPrimaryChannel(channel)}
            onOpenEmail={() => navigate('/settings/accounts/emails')}
            onOpenRecords={() => navigate('/objects/people')}
            onRequestConnection={() => void requestConnection()}
          />
        ) : null}

        {showFirstFlowStep &&
        (operatesWithRecords || !readiness?.evidence.firstConversationId) ? (
          <DiexOnboardingDataFlowStep
            index={4}
            dataFlow={dataFlow}
            inboxRoute={inboxRoute}
            entryRoute="/objects/people"
            primaryChannel={primaryChannel}
            isReady={firstRevenueFlowReady}
            onRefresh={() => void load()}
          />
        ) : null}

        {showFirstFlowStep &&
        !operatesWithRecords &&
        readiness?.evidence.firstConversationId ? (
          <DiexOnboardingAiTriageStep
            isDone={Boolean(
              readiness?.firstValueRun?.status === 'COMPLETED' ||
              (readiness.evidence.firstFollowUpCreated &&
                readiness.evidence.firstAiTriageCompleted),
            )}
            canRun
            isRunning={isExecutingFirstFlow}
            triageResult={triageResult}
            requiresOpportunity={hasOpportunityFlow}
            readyLabel={readyLabel}
            onStart={() => void handleFirstCommercialFlow()}
          />
        ) : null}

        {isSetupComplete &&
        !isEditingArchitectureContext &&
        canViewCommercialData ? (
          <StyledCard>
            <StyledCardTitle>
              {protectsRevenue
                ? 'O que protege receita hoje'
                : 'O que gera resultado hoje'}
            </StyledCardTitle>
            <StyledMetrics>
              {hasOpportunityFlow ? (
                <StyledMetric>
                  <StyledMetricValue>
                    {(readiness?.dashboard?.pipelineValues?.length
                      ? readiness.dashboard.pipelineValues
                      : [
                          {
                            amountMicros:
                              readiness?.dashboard?.pipelineValueMicros ?? 0,
                            currencyCode:
                              readiness?.dashboard?.pipelineCurrencyCode ??
                              'BRL',
                          },
                        ]
                    )
                      .map(({ amountMicros, currencyCode }) =>
                        formatPipelineValue(amountMicros, currencyCode),
                      )
                      .join(' + ')}
                  </StyledMetricValue>
                  <StyledMetricLabel>Pipeline</StyledMetricLabel>
                </StyledMetric>
              ) : (
                <StyledMetric>
                  <StyledMetricValue>
                    {readiness?.counts?.conversations ?? 0}
                  </StyledMetricValue>
                  <StyledMetricLabel>Entradas</StyledMetricLabel>
                </StyledMetric>
              )}
              <StyledMetric>
                <StyledMetricValue>
                  {readiness?.dashboard?.overdueFollowUps ?? 0}
                </StyledMetricValue>
                <StyledMetricLabel>Ações vencidas</StyledMetricLabel>
              </StyledMetric>
              <StyledMetric>
                <StyledMetricValue>
                  {readiness?.dashboard?.unansweredLeads ?? 0}
                </StyledMetricValue>
                <StyledMetricLabel>Sem resposta</StyledMetricLabel>
              </StyledMetric>
              <StyledMetric>
                <StyledMetricValue>
                  {readiness?.dashboard?.nextActions ?? 0}
                </StyledMetricValue>
                <StyledMetricLabel>Próximas ações</StyledMetricLabel>
              </StyledMetric>
            </StyledMetrics>
            <StyledActions>
              {(readiness?.counts?.activeOwners ?? 0) === 0 ? (
                <Button
                  title="Convidar a equipe"
                  variant="secondary"
                  to={AppPath.InviteTeam}
                />
              ) : null}
              <Button
                title={operatesWithRecords ? 'Contatos' : 'Inbox'}
                variant="secondary"
                to={operatesWithRecords ? '/objects/people' : inboxRoute}
              />
              <Button title="Cockpit" variant="secondary" to={cockpitRoute} />
              <Button
                title="Equipe e SLA"
                variant="secondary"
                to={'/objects/inboxTeams'}
              />
            </StyledActions>
          </StyledCard>
        ) : null}

        {primaryChannel === 'WHATSAPP' && errorMessage ? (
          <StyledError>{errorMessage}</StyledError>
        ) : null}
        {flowError ? <StyledError>{flowError}</StyledError> : null}
      </StyledBody>

      {isCompletionModalOpen && (
        <Modal isOpen={isCompletionModalOpen}>
          <StyledModalContent>
            <StyledModalTitle>
              <IconSparkles size={20} color={themeCssVariables.color.blue} />
              Configuração concluída
            </StyledModalTitle>
            <StyledSubtitle>
              {readiness?.ready
                ? `${readyLabel}. Esta página sai do menu.`
                : 'O CRM abre agora. Os itens restantes continuam aqui, sem travar o uso.'}
            </StyledSubtitle>
            <StyledActions>
              <Button
                title="Ir para a plataforma"
                Icon={IconRocket}
                variant="primary"
                disabled={isFinishingSetup}
                onClick={handleFinishSetup}
              />
              <Button
                title="Voltar"
                variant="secondary"
                disabled={isFinishingSetup}
                onClick={() => setIsCompletionModalOpen(false)}
              />
            </StyledActions>
          </StyledModalContent>
        </Modal>
      )}
    </PageCardLayout>
  );
};
