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
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      return item && typeof item === 'object' && 'label' in item
        ? (() => {
            const component = item as {
              label?: unknown;
              configuration?: { stages?: unknown };
            };
            const label = component.label;
            const stages = component.configuration?.stages;

            if (typeof label !== 'string') {
              return null;
            }

            return key === 'pipelines' && Array.isArray(stages)
              ? `${label}: ${stages
                  .filter((stage): stage is string => typeof stage === 'string')
                  .slice(0, 10)
                  .join(' → ')}`
              : label;
          })()
        : null;
    })
    .filter((label): label is string => typeof label === 'string')
    .slice(0, 8);
};

const getStringList = (
  artifact: DiexArchitectureArtifact | null,
  key: string,
): string[] => {
  const value = artifact?.payload[key];

  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .slice(0, 6)
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

const getProfileStringList = (
  artifact: DiexArchitectureArtifact | null,
  key: string,
): string[] => {
  const value =
    artifact?.payload.operationProfile ?? (artifact?.payload as unknown);

  if (!value || typeof value !== 'object') {
    return [];
  }

  const field = (value as Record<string, unknown>)[key];

  return Array.isArray(field)
    ? field
        .filter((item): item is string => typeof item === 'string')
        .slice(0, 8)
    : [];
};

type DiexOnboardingArchitectureStepProps = {
  architecture: DiexArchitectureState | null;
  isLoading: boolean;
  isReadConfirmed: boolean;
  isUpdating: boolean;
  canRegenerate: boolean;
  onApprove: () => void;
  onApply: () => void;
  onRegenerate: () => void;
  onEditContext: () => void;
};

export const DiexOnboardingArchitectureStep = ({
  architecture,
  isLoading,
  isReadConfirmed,
  isUpdating,
  canRegenerate,
  onApprove,
  onApply,
  onRegenerate,
  onEditContext,
}: DiexOnboardingArchitectureStepProps) => {
  const changeSetStatus = architecture?.changeSet?.status ?? null;
  const isApproved = changeSetStatus === 'APPROVED';
  const isPublished =
    changeSetStatus === 'ACTIVE' || changeSetStatus === 'PARTIALLY_APPLIED';
  const changeSetPublication = architecture?.changeSet?.payload?.publication;
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
  const productsAndServices = getProfileStringList(
    architecture?.profile ?? null,
    'productsAndServices',
  );
  const hypotheses = getProfileStringList(
    architecture?.profile ?? null,
    'hypotheses',
  );
  const unconfirmedInformation = getProfileStringList(
    architecture?.profile ?? null,
    'unconfirmedInformation',
  );
  const operationManifest = architecture?.blueprint?.payload.operationManifest;
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
      index={4}
      isDone={isPublished}
      title="Revisar e aprovar a arquitetura recomendada"
      badges={
        <DiexOnboardingBadge tone={isPublished ? 'green' : 'orange'}>
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
          Gere o contexto da operação para a IA montar a recomendação adaptada.
        </StyledText>
      ) : (
        <>
          <StyledText>
            Entendemos que sua empresa atua em{' '}
            <strong>{segment || 'uma operação ainda a confirmar'}</strong> e{' '}
            {productsAndServices.length > 0 ? (
              <>
                oferece{' '}
                <strong>
                  {productsAndServices.slice(0, 3).join(' · ')}
                </strong>{' '}
              </>
            ) : (
              <>ainda precisa confirmar a oferta principal </>
            )}
            para{' '}
            <strong>
              {idealCustomer || 'um cliente ideal ainda não definido'}
            </strong>
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
              ['Métricas', 'metrics'],
              ['Automações', 'automations'],
              ['Responsáveis', 'roles'],
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
            <span>
              Blueprint: {architecture?.blueprint?.status ?? 'pendente'}
            </span>
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
                .filter((label): label is string => typeof label === 'string')
                .slice(0, 8)
                .join(' · ')}
            </StyledText>
          ) : null}
          <StyledList>
            {[
              ['Objetos', 'objects'],
              ['Campos operacionais', 'fields'],
              ['Pipeline recomendado', 'pipelines'],
              ['Páginas', 'pages'],
              ['Dashboards', 'dashboards'],
              ['Métricas', 'metrics'],
              ['Automações', 'automations'],
              ['Papéis e responsáveis', 'roles'],
              ['Permissões', 'permissions'],
              ['Integrações', 'integrations'],
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
          {getStringList(architecture?.blueprint ?? null, 'alerts').length >
          0 ? (
            <StyledText>
              <strong>Confirmar antes de publicar:</strong>{' '}
              {getStringList(architecture?.blueprint ?? null, 'alerts').join(
                ' · ',
              )}
            </StyledText>
          ) : null}
          {unconfirmedInformation.length > 0 ? (
            <StyledText>
              <strong>Informações ainda não confirmadas:</strong>{' '}
              {unconfirmedInformation.join(' · ')}
            </StyledText>
          ) : null}
          {hypotheses.length > 0 ? (
            <StyledText>
              <strong>Hipóteses usadas na recomendação:</strong>{' '}
              {hypotheses.join(' · ')}
            </StyledText>
          ) : null}
        </>
      )}
      {!isReadConfirmed ? (
        <StyledText role="alert">
          A arquitetura exibida não foi confirmada nesta leitura. Aprovação,
          recálculo e publicação estão bloqueados até atualizar os dados.
        </StyledText>
      ) : null}
      <StyledActions>
        {hasRecommendation && !isPublished ? (
          <Button
            title="Corrigir entendimento"
            variant="secondary"
            disabled={isUpdating || !isReadConfirmed}
            onClick={onEditContext}
          />
        ) : null}
        {hasRecommendation && canRegenerate ? (
          <Button
            title={
              isUpdating
                ? 'Recalculando...'
                : 'Recalcular com contexto revisado'
            }
            variant="secondary"
            disabled={isUpdating || !isReadConfirmed}
            onClick={onRegenerate}
          />
        ) : null}
        {hasRecommendation && !isApproved && !isPublished ? (
          <Button
            title={isUpdating ? 'Aprovando...' : 'Aprovar arquitetura'}
            variant="primary"
            disabled={isUpdating || !isReadConfirmed}
            onClick={onApprove}
          />
        ) : null}
        {isApproved ? (
          <Button
            title={isUpdating ? 'Publicando...' : 'Publicar estrutura aprovada'}
            variant="primary"
            disabled={isUpdating || !isReadConfirmed}
            onClick={onApply}
          />
        ) : null}
      </StyledActions>
    </DiexOnboardingStepCard>
  );
};
