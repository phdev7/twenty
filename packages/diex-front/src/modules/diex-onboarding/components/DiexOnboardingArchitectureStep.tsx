import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { DiexOnboardingBadge } from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  DiexOnboardingStepCard,
  StyledActions,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';
import {
  type DiexArchitectureArtifact,
  type DiexArchitectureState,
} from '@/diex-onboarding/types/diexOnboardingTypes';

const StyledSummary = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
`;

const StyledSummaryItem = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSummaryLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  text-transform: uppercase;
`;

const StyledSummaryValue = styled.div`
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledList = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]};
`;

const getArrayLength = (
  artifact: DiexArchitectureArtifact | null,
  key: string,
): number => {
  const value = artifact?.payload[key];

  return Array.isArray(value) ? value.length : 0;
};

const getComponentLabels = (
  artifact: DiexArchitectureArtifact | null,
  key: string,
): string[] => {
  const value = artifact?.payload[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      item && typeof item === 'object' && 'label' in item
        ? (item as { label?: unknown }).label
        : null,
    )
    .filter((label): label is string => typeof label === 'string')
    .slice(0, 8);
};

const getStringList = (
  artifact: DiexArchitectureArtifact | null,
  key: string,
): string[] => {
  const value = artifact?.payload[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, 6)
    : [];
};

const getProfileValue = (
  artifact: DiexArchitectureArtifact | null,
  key: string,
): string => {
  const value =
    artifact?.payload.operationProfile ?? (artifact?.payload as unknown);

  if (!value || typeof value !== 'object') {
    return '';
  }

  const field = (value as Record<string, unknown>)[key];

  return typeof field === 'string' ? field : '';
};

type DiexOnboardingArchitectureStepProps = {
  architecture: DiexArchitectureState | null;
  isLoading: boolean;
  isUpdating: boolean;
  canRegenerate: boolean;
  onApprove: () => void;
  onApply: () => void;
  onRegenerate: () => void;
};

export const DiexOnboardingArchitectureStep = ({
  architecture,
  isLoading,
  isUpdating,
  canRegenerate,
  onApprove,
  onApply,
  onRegenerate,
}: DiexOnboardingArchitectureStepProps) => {
  const changeSetStatus = architecture?.changeSet?.status ?? null;
  const isApproved = changeSetStatus === 'APPROVED';
  const isPublished =
    changeSetStatus === 'ACTIVE' || changeSetStatus === 'PARTIALLY_APPLIED';
  const changeSetPublication =
    architecture?.changeSet?.payload?.publication;
  const pendingNativeResourceTypes =
    changeSetPublication && typeof changeSetPublication === 'object'
      ? (changeSetPublication as { pendingNativeResourceTypes?: unknown })
          .pendingNativeResourceTypes
      : null;
  const hasRecommendation = Boolean(architecture?.blueprint);
  const segment = getProfileValue(architecture?.profile ?? null, 'segment');
  const idealCustomer = getProfileValue(
    architecture?.profile ?? null,
    'idealCustomerProfile',
  );
  const salesCycle = getProfileValue(
    architecture?.profile ?? null,
    'salesCycle',
  );
  const operationManifest =
    architecture?.blueprint?.payload.operationManifest;
  const manifestVersion =
    operationManifest && typeof operationManifest === 'object'
      ? (operationManifest as { version?: unknown }).version
      : null;
  const manifestCapabilities =
    operationManifest && typeof operationManifest === 'object'
      ? (operationManifest as { capabilities?: unknown }).capabilities
      : null;

  return (
    <DiexOnboardingStepCard
      index={3}
      isDone={isPublished}
      title="Revisar e aprovar a arquitetura recomendada"
      badges={
        <DiexOnboardingBadge
          tone={isPublished ? 'green' : 'orange'}
        >
          {isPublished
            ? changeSetStatus === 'PARTIALLY_APPLIED'
              ? 'Publicada parcialmente'
              : 'Publicada'
            : isApproved
              ? 'Aprovada'
              : 'Aguardando aprovação'}
        </DiexOnboardingBadge>
      }
    >
      {isLoading && !architecture ? (
        <StyledText>Carregando recomendação...</StyledText>
      ) : !hasRecommendation ? (
        <StyledText>
          Gere o contexto comercial para a IA montar a recomendação da operação.
        </StyledText>
      ) : (
        <>
          <StyledText>
            Entendemos que sua empresa vende{' '}
            <strong>{segment || 'uma oferta comercial'}</strong> para{' '}
            <strong>{idealCustomer || 'um cliente ideal ainda não definido'}</strong>
            {salesCycle ? `, com ciclo de ${salesCycle}.` : '.'} A publicação só
            acontece depois da aprovação explícita.
          </StyledText>
          <StyledSummary>
            {[
              ['Objetos', 'objects'],
              ['Campos', 'fields'],
              ['Pipeline', 'pipelines'],
              ['Páginas', 'pages'],
              ['Dashboards', 'dashboards'],
              ['Automações', 'automations'],
              ['Permissões', 'permissions'],
              ['Integrações', 'integrations'],
            ].map(([label, key]) => (
              <StyledSummaryItem key={key}>
                <StyledSummaryLabel>{label}</StyledSummaryLabel>
                <StyledSummaryValue>
                  {getArrayLength(architecture?.blueprint ?? null, key)}
                </StyledSummaryValue>
              </StyledSummaryItem>
            ))}
          </StyledSummary>
          <StyledList>
            <span>Perfil: {architecture?.profile?.status ?? 'pendente'}</span>
            <span>Blueprint: {architecture?.blueprint?.status ?? 'pendente'}</span>
            <span>Change set: {changeSetStatus ?? 'pendente'}</span>
            <span>
              Manifesto operacional:{' '}
              {typeof manifestVersion === 'number'
                ? `v${manifestVersion}`
                : 'será gerado'}
            </span>
          </StyledList>
          {changeSetStatus === 'PARTIALLY_APPLIED' &&
          Array.isArray(pendingNativeResourceTypes) ? (
            <StyledText>
              <strong>Adaptadores nativos pendentes:</strong>{' '}
              {pendingNativeResourceTypes
                .filter((value): value is string => typeof value === 'string')
                .join(' · ') || 'revisão técnica'}
            </StyledText>
          ) : null}
          {Array.isArray(manifestCapabilities) &&
          manifestCapabilities.length > 0 ? (
            <StyledText>
              <strong>Capacidades ativas:</strong>{' '}
              {manifestCapabilities
                .map((item) =>
                  item && typeof item === 'object' && 'label' in item
                    ? (item as { label?: unknown }).label
                    : null,
                )
                .filter(
                  (label): label is string => typeof label === 'string',
                )
                .slice(0, 8)
                .join(' · ')}
            </StyledText>
          ) : null}
          <StyledList>
            {[
              ['Objetos', 'objects'],
              ['Campos comerciais', 'fields'],
              ['Pipeline recomendado', 'pipelines'],
              ['Páginas', 'pages'],
              ['Dashboards', 'dashboards'],
              ['Automações', 'automations'],
            ].map(([label, key]) => {
              const labels = getComponentLabels(
                architecture?.blueprint ?? null,
                key,
              );

              return labels.length > 0 ? (
                <span key={key}>
                  <strong>{label}:</strong> {labels.join(' · ')}
                  {getArrayLength(architecture?.blueprint ?? null, key) >
                  labels.length
                    ? ' · ...'
                    : ''}
                </span>
              ) : null;
            })}
          </StyledList>
          {getStringList(architecture?.blueprint ?? null, 'alerts').length > 0 ? (
            <StyledText>
              <strong>Confirmar antes de publicar:</strong>{' '}
              {getStringList(architecture?.blueprint ?? null, 'alerts').join(' · ')}
            </StyledText>
          ) : null}
        </>
      )}
      <StyledActions>
        {hasRecommendation && canRegenerate ? (
          <Button
            title={
              isUpdating
                ? 'Recalculando...'
                : 'Recalcular com contexto revisado'
            }
            variant="secondary"
            disabled={isUpdating}
            onClick={onRegenerate}
          />
        ) : null}
        {hasRecommendation && !isApproved && !isPublished ? (
          <Button
            title={isUpdating ? 'Aprovando...' : 'Aprovar arquitetura'}
            variant="primary"
            disabled={isUpdating}
            onClick={onApprove}
          />
        ) : null}
        {isApproved ? (
          <Button
            title={isUpdating ? 'Publicando...' : 'Publicar estrutura aprovada'}
            variant="primary"
            disabled={isUpdating}
            onClick={onApply}
          />
        ) : null}
      </StyledActions>
    </DiexOnboardingStepCard>
  );
};
