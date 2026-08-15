import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { DiexOnboardingBadge } from '@/diex-onboarding/components/DiexOnboardingBadge';
import { StyledActions } from '@/diex-onboarding/components/DiexOnboardingStepCard';
import { type DiexCommercialReadiness } from '@/diex-onboarding/types/diexOnboardingTypes';

type ProductUpdates = NonNullable<DiexCommercialReadiness['productUpdates']>;

const StyledContainer = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.color.orange};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: 0;
`;

const StyledUpdate = styled.article`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledUpdateHeader = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledUpdateTitle = styled.h3`
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledMissingFields = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

export const DiexOnboardingProductUpdates = ({
  productUpdates,
  canManageUpdates,
  isAcknowledging,
  onReview,
  onAcknowledge,
}: {
  productUpdates: ProductUpdates;
  canManageUpdates: boolean;
  isAcknowledging: boolean;
  onReview: (actionRoute: string) => void;
  onAcknowledge: (updateKey: string) => void;
}) => {
  const pendingUpdates = productUpdates.items.filter(
    ({ status }) => status !== 'COMPLETED',
  );

  if (pendingUpdates.length === 0) {
    return null;
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>
          {productUpdates.adminNoticeCount > 0
            ? 'O Diex recebeu atualizações importantes'
            : 'Complete os novos requisitos da operação'}
        </StyledTitle>
        <StyledText>
          O uso atual continua disponível. O status de prontidão não chega a
          100% enquanto uma atualização obrigatória estiver sem evidência.
        </StyledText>
      </StyledHeader>

      {pendingUpdates.map((update) => (
        <StyledUpdate key={`${update.key}@${update.version}`}>
          <StyledUpdateHeader>
            <StyledUpdateTitle>{update.title}</StyledUpdateTitle>
            <DiexOnboardingBadge tone="orange">
              {update.importance === 'REQUIRED'
                ? 'Obrigatória'
                : update.importance === 'RECOMMENDED'
                  ? 'Recomendada'
                  : 'Informativa'}
            </DiexOnboardingBadge>
            {update.status === 'ACKNOWLEDGED' ? (
              <DiexOnboardingBadge tone="gray">Aviso lido</DiexOnboardingBadge>
            ) : null}
          </StyledUpdateHeader>
          <StyledText>{update.summary}</StyledText>
          <StyledText>{update.revenueImpact}</StyledText>
          {update.missingFields.length > 0 ? (
            <StyledMissingFields>
              Falta preencher:{' '}
              {update.missingFields.map(({ label }) => label).join(' · ')}
            </StyledMissingFields>
          ) : update.needsAdminConfirmation ? (
            <StyledMissingFields>
              {!canManageUpdates
                ? 'Dados preenchidos. Um administrador do workspace precisa confirmar esta atualização.'
                : update.canAdminConfirm
                  ? 'Dados preenchidos. Revise e confirme a atualização como administrador.'
                  : 'Dados preenchidos. Ative o contexto para liberar a confirmação administrativa.'}
            </StyledMissingFields>
          ) : null}
          <StyledActions>
            <Button
              title={update.actionLabel}
              variant="primary"
              onClick={() => onReview(update.actionRoute)}
            />
            {canManageUpdates &&
            ((update.needsAdminConfirmation && update.canAdminConfirm) ||
              (update.completionKind === 'ACKNOWLEDGEMENT' &&
                update.status === 'PENDING')) ? (
              <Button
                title={
                  isAcknowledging
                    ? 'Confirmando...'
                    : update.completionKind === 'CONTEXT_FIELDS'
                      ? 'Confirmar atualização'
                      : 'Marcar aviso como lido'
                }
                variant="secondary"
                disabled={isAcknowledging}
                isLoading={isAcknowledging}
                onClick={() => onAcknowledge(update.key)}
              />
            ) : null}
          </StyledActions>
        </StyledUpdate>
      ))}
    </StyledContainer>
  );
};
