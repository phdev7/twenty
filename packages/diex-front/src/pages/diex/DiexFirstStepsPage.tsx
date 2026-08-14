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
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
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
    completeCommercialOnboarding,
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
    readiness?.readinessPack?.readyLabel ?? 'CRM pronto para vender';
  const hasOpportunityFlow = Boolean(
    readiness?.readinessPack?.criteria.some(
      ({ key, required }) => key === 'first_opportunity_created' && required,
    ),
  );
  const protectsRevenue = readiness?.goal === 'CUSTOMER_SUCCESS_RENEWALS';
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
          : 'Não foi possível concluir a ativação da operação.',
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
          hasOpportunityFlow
            ? 'O contato, a oportunidade e a próxima ação foram criados. A classificação com IA precisa ser repetida.'
            : 'O contato, o responsável e a próxima ação foram definidos. A classificação com IA precisa ser repetida.',
        );
      }
      await refreshCommercialData();
    } catch (error) {
      setFlowError(
        error instanceof Error
          ? error.message
          : 'Não foi possível executar o primeiro fluxo operacional.',
      );
    }
  };

  const journey = isReadinessReadConfirmed
    ? readiness?.onboardingJourney
    : undefined;
  // This restores navigation for existing tenants and requires no new data,
  // acknowledgement or product-update requirement from the workspace.
  const journeyAction = journey
    ? {
        DISCOVERY_REVIEW: {
          targetId: 'activation-discovery',
          label: 'Continuar revisão',
        },
        ARCHITECTURE_APPROVAL: {
          targetId: 'activation-architecture',
          label: 'Revisar arquitetura',
        },
        CHANNEL_CONNECTION: {
          targetId: 'activation-channel',
          label: 'Configurar entrada',
        },
        FIRST_REVENUE_FLOW: {
          targetId: 'activation-first-flow',
          label: 'Executar primeiro fluxo',
        },
        TEAM_ENABLEMENT: {
          targetId: 'activation-team',
          label: 'Configurar equipe',
        },
        COCKPIT_OPERATIONAL: {
          targetId: 'activation-cockpit',
          label: 'Abrir operação',
        },
        READY: {
          targetId: 'activation-cockpit',
          label: 'Abrir operação',
        },
        SELLING_READY: {
          targetId: 'activation-cockpit',
          label: 'Abrir operação',
        },
      }[journey.phase]
    : null;
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
  const discoveryStep = journey?.blockers.includes('goal_defined')
    ? 'GOAL'
    : journey?.blockers.some((key) =>
          ['context_active', 'ideal_customer_defined'].includes(key),
        )
      ? 'CONTEXT'
      : journey?.blockers.includes('offer_registered')
        ? 'OFFER'
        : 'CONTEXT';
  const journeyBlockerLabels =
    journey?.blockers.map(
      (blocker) =>
        readiness?.items.find(({ key }) => key === blocker)?.label ?? blocker,
    ) ?? [];

  return (
    <PageCardLayout header={<PageHeader title={pageLabel} Icon={IconRocket} />}>
      <StyledBody>
        <StyledIntro>
          <StyledTitle>
            Chegue ao primeiro resultado da {operationLabel}
          </StyledTitle>
          <StyledSubtitle>
            {hasOpportunityFlow
              ? 'A ativação só termina quando uma entrada real virar contato, oportunidade e próxima ação com responsável.'
              : 'A ativação só termina quando uma entrada real virar contato, responsável e próxima ação executável.'}{' '}
            O Diex precisa sair daqui pronto para operar e gerar resultado.
          </StyledSubtitle>
        </StyledIntro>
        <DiexOnboardingReadinessCard
          readiness={readiness}
          isLoading={isLoadingCommercialData}
          errorMessage={commercialError}
          onRetry={() => void load()}
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
            {journeyAction ? (
              <StyledActions>
                <Button
                  title={journeyAction.label}
                  variant="primary"
                  onClick={() =>
                    document
                      .getElementById(journeyAction.targetId)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                />
              </StyledActions>
            ) : null}
          </StyledJourneyFocus>
        ) : null}
        {journey?.phase === 'DISCOVERY_REVIEW' && discoveryStep === 'GOAL' ? (
          <div id="activation-discovery">
            <DiexOnboardingGoalStep
              selectedGoal={readiness?.goal ?? null}
              isSaving={isSavingGoal}
              onSelect={(goal) => void setCommercialGoal(goal)}
            />
          </div>
        ) : null}
        {journey?.phase === 'DISCOVERY_REVIEW' &&
        discoveryStep === 'CONTEXT' ? (
          <div id="activation-discovery">
            <DiexOnboardingContextStep
              index={2}
              title="Revise o contexto preparado pela IA"
              description="A IA extraiu empresa, cliente ideal, tom, regras, objeções, provas e limites. Corrija qualquer item antes de ativar. Nenhuma mudança estrutural é publicada nesta etapa."
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
        ) : null}
        {journey?.phase === 'DISCOVERY_REVIEW' && discoveryStep === 'OFFER' ? (
          <div id="activation-discovery">
            <DiexOnboardingOfferStep
              offers={dataFlow.offers}
              activeOfferCount={
                readiness?.counts.activeOffers ?? dataFlow.activeOfferCount
              }
              isReady={
                readiness?.items.find(({ key }) => key === 'offer_registered')
                  ?.ready
              }
              isReadConfirmed={!dataFlow.unconfirmedSources.includes('offers')}
              readError={dataFlow.errorMessage}
              onChanged={() => void load()}
            />
          </div>
        ) : null}
        {isEditingArchitectureContext &&
        (journey?.phase === 'ARCHITECTURE_APPROVAL' ||
          journey?.phase === 'COCKPIT_OPERATIONAL' ||
          journey?.phase === 'READY') ? (
          <div id="activation-architecture">
            <DiexOnboardingContextStep
              index={4}
              title="Corrigir o entendimento antes da aprovação"
              description="Revise cada informação que influencia objetos, pipeline, páginas, permissões, integrações e automações. Salve, volte à recomendação e peça o recálculo antes de aprovar."
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
              onBack={() => setIsEditingArchitectureContext(false)}
              onRegenerate={
                isArchitectureReadConfirmed
                  ? () => void regenerateArchitecture()
                  : undefined
              }
              isRegenerating={isUpdatingArchitecture}
            />
          </div>
        ) : null}
        {journey?.phase === 'ARCHITECTURE_APPROVAL' &&
        !isEditingArchitectureContext ? (
          <div id="activation-architecture">
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
          </div>
        ) : null}
        {journey?.phase === 'CHANNEL_CONNECTION' ? (
          <div id="activation-channel">
            <DiexOnboardingWhatsappStep
              index={5}
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
          </div>
        ) : null}
        {journey?.phase === 'FIRST_REVENUE_FLOW' &&
        (operatesWithRecords || !readiness?.evidence.firstConversationId) ? (
          <div id="activation-first-flow">
            <DiexOnboardingDataFlowStep
              index={6}
              dataFlow={dataFlow}
              inboxRoute={inboxRoute}
              entryRoute="/objects/people"
              primaryChannel={primaryChannel}
              isReady={firstRevenueFlowReady}
              onRefresh={() => void load()}
            />
          </div>
        ) : null}
        {journey?.phase === 'FIRST_REVENUE_FLOW' &&
        !operatesWithRecords &&
        readiness?.evidence.firstConversationId ? (
          <div id="activation-first-flow">
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
          </div>
        ) : null}
        {journey?.phase === 'TEAM_ENABLEMENT' ? (
          <StyledCockpit id="activation-team">
            <StyledCockpitTitle>Configure quem vai operar</StyledCockpitTitle>
            <StyledSubtitle>
              Convide a equipe, defina responsáveis, distribuição, permissões e
              SLA. A IA continua sujeita às aprovações configuradas.
            </StyledSubtitle>
            <StyledActions>
              <Button
                title="Convidar e configurar equipe"
                variant="primary"
                to={AppPath.InviteTeam}
              />
              <Button
                title="Configurar distribuição e SLA"
                variant="secondary"
                to={'/objects/inboxTeams'}
              />
              <Button
                title="Vincular responsáveis às equipes"
                variant="secondary"
                to={'/objects/inboxTeamMembers'}
              />
              <Button
                title="Configurar permissões"
                variant="secondary"
                to={'/settings/members/roles'}
              />
              <Button
                title="Atualizar prontidão"
                variant="secondary"
                onClick={() => void load()}
              />
            </StyledActions>
          </StyledCockpit>
        ) : null}
        {(journey?.phase === 'COCKPIT_OPERATIONAL' ||
          journey?.phase === 'READY') &&
        !isEditingArchitectureContext ? (
          <StyledCockpit id="activation-cockpit">
            <StyledCockpitTitle>
              Seu cockpit inicial de {operationLabel.toLowerCase()}
            </StyledCockpitTitle>
            <StyledSubtitle>
              A pergunta operacional é:{' '}
              {protectsRevenue
                ? 'qual ação protege mais receita hoje?'
                : 'qual ação gera mais resultado hoje?'}
            </StyledSubtitle>
            <StyledCockpitMetrics>
              {hasOpportunityFlow ? (
                <>
                  <StyledCockpitMetric>
                    <StyledCockpitValue>
                      {(readiness?.dashboard.pipelineValues?.length
                        ? readiness.dashboard.pipelineValues
                        : [
                            {
                              amountMicros:
                                readiness?.dashboard.pipelineValueMicros ?? 0,
                              currencyCode:
                                readiness?.dashboard.pipelineCurrencyCode ??
                                'BRL',
                            },
                          ]
                      )
                        .map(({ amountMicros, currencyCode }) =>
                          formatPipelineValue(amountMicros, currencyCode),
                        )
                        .join(' + ')}
                    </StyledCockpitValue>
                    <StyledCockpitLabel>
                      Valor no pipeline
                      {(readiness?.dashboard.pipelineValues?.length ?? 0) > 1
                        ? ' por moeda'
                        : ''}
                    </StyledCockpitLabel>
                  </StyledCockpitMetric>
                  <StyledCockpitMetric>
                    <StyledCockpitValue>
                      {readiness?.dashboard.unassignedOpportunities ?? 0}
                    </StyledCockpitValue>
                    <StyledCockpitLabel>
                      Oportunidades sem responsável
                    </StyledCockpitLabel>
                  </StyledCockpitMetric>
                </>
              ) : (
                <>
                  <StyledCockpitMetric>
                    <StyledCockpitValue>
                      {readiness?.counts.conversations ?? 0}
                    </StyledCockpitValue>
                    <StyledCockpitLabel>
                      Entradas acompanhadas
                    </StyledCockpitLabel>
                  </StyledCockpitMetric>
                  <StyledCockpitMetric>
                    <StyledCockpitValue>
                      {readiness?.counts.activeOwners ?? 0}
                    </StyledCockpitValue>
                    <StyledCockpitLabel>Responsáveis ativos</StyledCockpitLabel>
                  </StyledCockpitMetric>
                </>
              )}
              <StyledCockpitMetric>
                <StyledCockpitValue>
                  {readiness?.dashboard.overdueFollowUps ?? 0}
                </StyledCockpitValue>
                <StyledCockpitLabel>Ações vencidas</StyledCockpitLabel>
              </StyledCockpitMetric>
              <StyledCockpitMetric>
                <StyledCockpitValue>
                  {readiness?.dashboard.unansweredLeads ?? 0}
                </StyledCockpitValue>
                <StyledCockpitLabel>Entradas sem resposta</StyledCockpitLabel>
              </StyledCockpitMetric>
              <StyledCockpitMetric>
                <StyledCockpitValue>
                  {readiness?.dashboard.averageResponseMinutes ?? '—'}
                </StyledCockpitValue>
                <StyledCockpitLabel>
                  Minutos médios de resposta
                </StyledCockpitLabel>
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
                <StyledCockpitLabel>Riscos da operação</StyledCockpitLabel>
              </StyledCockpitMetric>
            </StyledCockpitMetrics>
            <StyledActions>
              {(readiness?.counts.activeOwners ?? 0) === 0 ? (
                <Button
                  title="Convidar e configurar equipe"
                  variant="primary"
                  to={AppPath.InviteTeam}
                />
              ) : null}
              <Button
                title={
                  operatesWithRecords
                    ? 'Abrir contatos da operação'
                    : `Abrir Inbox da ${operationLabel}`
                }
                variant="secondary"
                to={operatesWithRecords ? '/objects/people' : inboxRoute}
              />
              <Button
                title="Abrir cockpit da operação"
                variant="secondary"
                to={cockpitRoute}
              />
              <Button
                title="Revisar contexto e arquitetura"
                variant="secondary"
                onClick={() => setIsEditingArchitectureContext(true)}
              />
              <Button
                title="Equipe, SLA e distribuição"
                variant="secondary"
                to={'/objects/inboxTeams'}
              />
            </StyledActions>
            {readiness?.dataFreshness?.queriedAt ? (
              <StyledCockpitLabel>
                Dados consultados diretamente da operação às{' '}
                {new Date(readiness.dataFreshness.queriedAt).toLocaleTimeString(
                  'pt-BR',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}
                .
              </StyledCockpitLabel>
            ) : null}
          </StyledCockpit>
        ) : null}
        {primaryChannel === 'WHATSAPP' && errorMessage ? (
          <StyledError>{errorMessage}</StyledError>
        ) : null}
        {flowError ? <StyledError>{flowError}</StyledError> : null}
        {isReadinessReadConfirmed && readiness?.ready ? (
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
              {readyLabel}.
            </StyledModalTitle>
            <StyledModalText>
              O contexto foi ativado, a arquitetura foi aprovada e a primeira
              operação real já possui contato, responsável e próxima ação
              {hasOpportunityFlow ? ' com oportunidade vinculada' : ''}.
              {operatesWithRecords
                ? ' A entrada foi validada sem exigir conexão de WhatsApp.'
                : ' O canal foi validado por uma entrada real e a IA concluiu a triagem.'}{' '}
              O cockpit já mostra a prioridade da operação.
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
