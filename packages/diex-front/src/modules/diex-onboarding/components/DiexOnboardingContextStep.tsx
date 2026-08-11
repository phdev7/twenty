import { useMemo } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  DiexOnboardingBadge,
  type DiexOnboardingBadgeTone,
} from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  DiexOnboardingStepCard,
  StyledActions,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';
import { DiexOnboardingContextFields } from '@/diex-onboarding/components/DiexOnboardingContextFields';
import {
  type ContextField,
  type ContextFieldKey,
  type WorkspaceContextReadState,
  type WorkspaceContextDraft,
  type WorkspaceContextRecord,
} from '@/diex-onboarding/types/diexOnboardingTypes';

const CONTEXT_FIELDS: Array<{
  key: ContextFieldKey;
  label: string;
  hint: string;
  isRequiredForActivation: boolean;
}> = [
  {
    key: 'businessDescription',
    label: 'O que a empresa faz',
    hint: 'Atividade, mercado e como gera valor ou receita.',
    isRequiredForActivation: true,
  },
  {
    key: 'idealCustomerProfile',
    label: 'Cliente ideal',
    hint: 'Porte, segmento, dor e gatilho de compra.',
    isRequiredForActivation: true,
  },
  {
    key: 'toneOfVoice',
    label: 'Tom de voz',
    hint: 'Como a empresa fala com o cliente.',
    isRequiredForActivation: true,
  },
  {
    key: 'commercialRules',
    label: 'Regras comerciais',
    hint: 'Descontos, prazos e o que exige aprovação.',
    isRequiredForActivation: false,
  },
  {
    key: 'objectionPlaybook',
    label: 'Objeções e respostas',
    hint: 'O que ouvem muito e a resposta certa.',
    isRequiredForActivation: false,
  },
  {
    key: 'competitiveLandscape',
    label: 'Concorrência',
    hint: 'Concorrentes e o posicionamento de vocês.',
    isRequiredForActivation: false,
  },
  {
    key: 'forbiddenClaims',
    label: 'O que nunca afirmar',
    hint: 'Promessas que a IA não pode fazer.',
    isRequiredForActivation: false,
  },
];

const CONTEXT_STATUS: Record<
  string,
  { label: string; tone: DiexOnboardingBadgeTone }
> = {
  ACTIVE: { label: 'Ativo para a IA', tone: 'green' },
  DRAFT: { label: 'Rascunho, a IA não lê', tone: 'orange' },
  ARCHIVED: { label: 'Arquivado', tone: 'gray' },
};

const isFieldFilled = (
  record: WorkspaceContextRecord | null,
  key: ContextFieldKey,
): boolean => (record?.[key]?.markdown ?? '').trim().length > 0;

const StyledSkeleton = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 72px;
`;

const StyledFieldGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledField = styled.div`
  align-items: baseline;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledFieldLabel = styled.div`
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledFieldHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin-top: ${themeCssVariables.spacing['0.5']};
`;

const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin: 0;
`;

const StyledContextError = styled(StyledHint)`
  color: ${themeCssVariables.font.color.danger};
`;

type DiexOnboardingContextStepProps = {
  index?: number;
  title?: string;
  description?: string;
  workspaceContext: WorkspaceContextRecord | null;
  readState: WorkspaceContextReadState;
  isLoading: boolean;
  isCreatingContext: boolean;
  isSavingContext: boolean;
  isActivatingContext: boolean;
  onCreateContext: () => void;
  onSaveContext: (draft: WorkspaceContextDraft) => void;
  onActivateContext: () => void;
  onRetry: () => void;
};

export const DiexOnboardingContextStep = ({
  index = 2,
  title = 'Descrever a empresa para a IA',
  description = 'Sem isto a IA escreve genérico e não sabe o que sua empresa não pode prometer. Preencha os três campos marcados, ative, e o contexto passa a valer em toda triagem, rascunho e análise.',
  workspaceContext,
  readState,
  isLoading,
  isCreatingContext,
  isSavingContext,
  isActivatingContext,
  onCreateContext,
  onSaveContext,
  onActivateContext,
  onRetry,
}: DiexOnboardingContextStepProps) => {
  const contextFields: ContextField[] = useMemo(
    () =>
      CONTEXT_FIELDS.map((field) => ({
        ...field,
        isFilled: isFieldFilled(workspaceContext, field.key),
      })),
    [workspaceContext],
  );
  const filledCount = contextFields.filter(({ isFilled }) => isFilled).length;
  const canActivateContext = contextFields
    .filter(({ isRequiredForActivation }) => isRequiredForActivation)
    .every(({ isFilled }) => isFilled);
  const isContextDone = workspaceContext?.status === 'ACTIVE';
  const contextStatus =
    CONTEXT_STATUS[workspaceContext?.status ?? 'DRAFT'] ?? CONTEXT_STATUS.DRAFT;
  const hasReadError = readState === 'READ_ERROR';
  const hasReconciliationError = readState === 'RECONCILIATION_ERROR';

  return (
    <DiexOnboardingStepCard
      index={index}
      isDone={isContextDone}
      title={title}
      badges={
        <StyledActions>
          <DiexOnboardingBadge tone="gray">
            {filledCount} de {CONTEXT_FIELDS.length} campos
          </DiexOnboardingBadge>
          {workspaceContext ? (
            <DiexOnboardingBadge tone={contextStatus.tone}>
              {contextStatus.label}
            </DiexOnboardingBadge>
          ) : null}
        </StyledActions>
      }
    >
      <StyledText>{description}</StyledText>

      {hasReadError ? (
        <>
          <StyledContextError>
            A leitura do contexto falhou. A ausência não foi confirmada; criar
            outro registro está bloqueado para evitar duplicação.
          </StyledContextError>
          <StyledActions>
            <Button
              variant="secondary"
              title="Tentar novamente"
              onClick={onRetry}
            />
          </StyledActions>
        </>
      ) : isLoading && readState === 'LOADING' ? (
        <StyledSkeleton />
      ) : workspaceContext ? (
        <>
          <StyledFieldGrid>
            {contextFields.map(
              ({ key, label, hint, isFilled, isRequiredForActivation }) => (
                <StyledField key={key}>
                  <div>
                    <StyledFieldLabel>
                      {label}
                      {isRequiredForActivation ? ' *' : ''}
                    </StyledFieldLabel>
                    <StyledFieldHint>{hint}</StyledFieldHint>
                  </div>
                  <DiexOnboardingBadge tone={isFilled ? 'green' : 'gray'}>
                    {isFilled ? 'ok' : 'vazio'}
                  </DiexOnboardingBadge>
                </StyledField>
              ),
            )}
          </StyledFieldGrid>
          <DiexOnboardingContextFields
            workspaceContext={workspaceContext}
            isSaving={isSavingContext}
            onSave={onSaveContext}
          />
          <StyledActions>
            {isContextDone ? null : (
              <Button
                variant="primary"
                title={isActivatingContext ? 'Ativando...' : 'Ativar para a IA'}
                disabled={!canActivateContext || isActivatingContext}
                onClick={onActivateContext}
              />
            )}
          </StyledActions>
          {isContextDone || canActivateContext ? null : (
            <StyledHint>
              Preencha os três campos marcados com * para poder ativar.
            </StyledHint>
          )}
          {hasReconciliationError ? (
            <StyledContextError>
              A gravação foi confirmada, mas a releitura falhou. O registro
              exibido foi preservado; atualize para reconciliar.
            </StyledContextError>
          ) : null}
          {hasReconciliationError ? (
            <StyledActions>
              <Button
                variant="secondary"
                title="Reconciliar"
                onClick={onRetry}
              />
            </StyledActions>
          ) : null}
        </>
      ) : (
        <StyledActions>
          <Button
            variant="primary"
            title={isCreatingContext ? 'Criando...' : 'Criar contexto'}
            disabled={isCreatingContext}
            onClick={onCreateContext}
          />
        </StyledActions>
      )}
    </DiexOnboardingStepCard>
  );
};
