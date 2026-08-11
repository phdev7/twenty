import { styled } from '@linaria/react';
import { IconCheck } from 'diex-ui/icon';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { DiexOnboardingBadge } from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  type DiexCommercialReadiness,
  type DiexReadinessItem,
} from '@/diex-onboarding/types/diexOnboardingTypes';

const StyledCard = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledScore = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledJourney = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledJourneyLabel = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xxs};
  text-transform: uppercase;
`;

const JOURNEY_LABELS: Record<string, string> = {
  DISCOVERY_REVIEW: 'Revisar o entendimento da operação',
  ARCHITECTURE_APPROVAL: 'Aprovar a arquitetura recomendada',
  CHANNEL_CONNECTION: 'Conectar e validar o canal principal',
  FIRST_REVENUE_FLOW: 'Executar o primeiro fluxo de resultado',
  TEAM_ENABLEMENT: 'Configurar a equipe para operar',
  COCKPIT_OPERATIONAL: 'Abrir o cockpit com dados acionáveis',
  READY: 'CRM pronto para operar',
  SELLING_READY: 'CRM pronto para vender',
};

const StyledProgress = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.pill};
  height: 8px;
  overflow: hidden;
`;

const StyledProgressValue = styled.div<{ score: number }>`
  background: ${themeCssVariables.color.green};
  border-radius: inherit;
  height: 100%;
  width: ${({ score }) => score}%;
`;

const StyledItems = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledTracks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTrack = styled.span`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xxs};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledItem = styled.div<{ ready: boolean }>`
  align-items: center;
  color: ${({ ready }) =>
    ready
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledItemMarker = styled.span<{ ready: boolean }>`
  align-items: center;
  background: ${({ ready }) =>
    ready
      ? themeCssVariables.tag.background.green
      : themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ ready }) =>
    ready ? themeCssVariables.color.green : themeCssVariables.font.color.tertiary};
  display: flex;
  height: 20px;
  justify-content: center;
  width: 20px;
`;

const renderItem = (item: DiexReadinessItem) => (
  <StyledItem key={item.key} ready={item.ready}>
    <StyledItemMarker ready={item.ready}>
      {item.ready ? <IconCheck size={12} /> : '·'}
    </StyledItemMarker>
    {item.label}
  </StyledItem>
);

type DiexOnboardingReadinessCardProps = {
  readiness: DiexCommercialReadiness | null;
  isLoading: boolean;
};

export const DiexOnboardingReadinessCard = ({
  readiness,
  isLoading,
}: DiexOnboardingReadinessCardProps) => {
  const readyLabel =
    readiness?.readinessPack?.readyLabel ?? 'CRM pronto para vender';

  return (
    <StyledCard>
      <StyledHeader>
        <StyledTitle>{readyLabel}</StyledTitle>
        {readiness ? (
          <DiexOnboardingBadge tone={readiness.ready ? 'green' : 'orange'}>
            {readiness.ready ? readyLabel : 'Em preparação'}
          </DiexOnboardingBadge>
        ) : null}
      </StyledHeader>
      <StyledScore>
        {isLoading && !readiness
          ? 'Calculando evidências da operação...'
          : `${readiness?.score ?? 0}% concluído · ${readiness?.activation?.completedCount ?? 0}/${readiness?.activation?.totalCount ?? readiness?.items.length ?? 0} provas · Próxima ação: ${readiness?.nextAction ?? 'carregar onboarding'}`}
      </StyledScore>
      <StyledProgress>
        <StyledProgressValue score={readiness?.score ?? 0} />
      </StyledProgress>
      {readiness?.onboardingJourney ? (
        <StyledJourney>
          <StyledJourneyLabel>
            Fase {readiness.onboardingJourney.phaseIndex + 1} ·{' '}
            {JOURNEY_LABELS[readiness.onboardingJourney.phase] ??
              readiness.onboardingJourney.phase}
          </StyledJourneyLabel>
          <StyledScore>{readiness.onboardingJourney.nextAction}</StyledScore>
          {readiness.onboardingJourney.blockers.length > 0 ? (
            <StyledScore>
              Bloqueios atuais:{' '}
              {readiness.onboardingJourney.blockers
                .map(
                  (blocker) =>
                    readiness.items.find(({ key }) => key === blocker)?.label ??
                    blocker,
                )
                .join(' · ')}
            </StyledScore>
          ) : null}
        </StyledJourney>
      ) : null}
      <StyledItems>{readiness?.items.map(renderItem)}</StyledItems>
      {readiness?.tracks?.length ? (
        <StyledTracks>
          {readiness.tracks.map((track) => (
            <StyledTrack key={track.key}>
              {track.label}: {track.score}%
              {track.selected ? '' : ' · disponível'}
            </StyledTrack>
          ))}
        </StyledTracks>
      ) : null}
    </StyledCard>
  );
};
