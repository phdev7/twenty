import { useEffect, useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  type ContextFieldKey,
  type WorkspaceContextDraft,
  type WorkspaceContextRecord,
} from '@/diex-onboarding/types/diexOnboardingTypes';

const FIELD_DEFINITIONS: Array<{
  key: ContextFieldKey;
  label: string;
  placeholder: string;
}> = [
  {
    key: 'businessDescription',
    label: 'O que a empresa faz *',
    placeholder: 'Atividade, mercado e como gera receita.',
  },
  {
    key: 'idealCustomerProfile',
    label: 'Cliente ideal *',
    placeholder: 'Porte, segmento, dor e gatilho de compra.',
  },
  {
    key: 'toneOfVoice',
    label: 'Tom de voz *',
    placeholder: 'Como a empresa fala com o cliente.',
  },
  {
    key: 'commercialRules',
    label: 'Regras comerciais',
    placeholder: 'Descontos, prazos e o que exige aprovação.',
  },
  {
    key: 'objectionPlaybook',
    label: 'Objeções e respostas',
    placeholder: 'O que ouvem muito e a resposta certa.',
  },
  {
    key: 'competitiveLandscape',
    label: 'Concorrência',
    placeholder: 'Concorrentes e o posicionamento da empresa.',
  },
  {
    key: 'forbiddenClaims',
    label: 'O que nunca afirmar',
    placeholder: 'Promessas que a IA não pode fazer.',
  },
];

const EMPTY_DRAFT = Object.fromEntries(
  FIELD_DEFINITIONS.map(({ key }) => [key, '']),
) as WorkspaceContextDraft;

const StyledFields = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const StyledField = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTextarea = styled.textarea`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font: inherit;
  min-height: 92px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  resize: vertical;
`;

const toDraft = (
  workspaceContext: WorkspaceContextRecord,
): WorkspaceContextDraft =>
  Object.fromEntries(
    FIELD_DEFINITIONS.map(({ key }) => [
      key,
      workspaceContext[key]?.markdown ?? '',
    ]),
  ) as WorkspaceContextDraft;

export const DiexOnboardingContextFields = ({
  workspaceContext,
  isSaving,
  onSave,
}: {
  workspaceContext: WorkspaceContextRecord;
  isSaving: boolean;
  onSave: (draft: WorkspaceContextDraft) => void;
}) => {
  const [draft, setDraft] = useState<WorkspaceContextDraft>(EMPTY_DRAFT);

  useEffect(() => {
    setDraft(toDraft(workspaceContext));
  }, [workspaceContext]);

  return (
    <>
      <StyledFields>
        {FIELD_DEFINITIONS.map(({ key, label, placeholder }) => (
          <StyledField key={key}>
            {label}
            <StyledTextarea
              value={draft[key]}
              placeholder={placeholder}
              maxLength={4_000}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
            />
          </StyledField>
        ))}
      </StyledFields>
      <Button
        variant="secondary"
        title={isSaving ? 'Salvando...' : 'Salvar contexto'}
        disabled={isSaving}
        isLoading={isSaving}
        onClick={() => onSave(draft)}
      />
    </>
  );
};
