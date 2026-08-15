import { styled } from '@linaria/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { IconArrowRight, IconCheck, IconSparkles } from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  DIEX_ONBOARDING_QUESTIONS,
  type DiexOnboardingAnswers,
  EMPTY_DIEX_ONBOARDING_ANSWERS,
  buildOperationDescriptionFromAnswers,
} from '@/diex-onboarding/types/diexOnboardingInterviewTypes';
import { TextArea } from '@/ui/input/components/TextArea';

const StyledRoot = styled.main`
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  justify-content: center;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledGrid = styled.div<{ hasSupplementaryContent: boolean }>`
  align-items: start;
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  // Centraliza quando sobra espaço e para de centralizar quando o formulário
  // fica mais alto que a viewport, senão o topo do cartão é cortado.
  margin: auto;
  grid-template-columns: ${({ hasSupplementaryContent }) =>
    hasSupplementaryContent
      ? 'minmax(0, 560px) minmax(280px, 340px)'
      : 'minmax(0, 560px)'};
  max-width: ${({ hasSupplementaryContent }) =>
    hasSupplementaryContent ? '920px' : '560px'};
  width: 100%;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCard = styled.form`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[5]};
  width: 100%;
`;

const StyledIcon = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.blue};
  border: 1px solid ${themeCssVariables.border.color.blue};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.color.blue};
  display: flex;
  height: 32px;
  justify-content: center;
  width: 32px;
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.4;
  margin: 0;
`;

const StyledFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledOptional = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledFooter = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledHint = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
`;

const StyledAiWorkState = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.blue};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledAiPulse = styled.div`
  align-items: center;
  color: ${themeCssVariables.color.blue};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};

  &::before {
    animation: diexAiWorking 1.2s ease-in-out infinite;
    background: ${themeCssVariables.color.blue};
    border-radius: 50%;
    content: '';
    height: 8px;
    width: 8px;
  }

  @keyframes diexAiWorking {
    0%,
    100% {
      opacity: 0.35;
      transform: scale(0.85);
    }
    50% {
      opacity: 1;
      transform: scale(1.15);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

const StyledAiStep = styled.div<{ active?: boolean }>`
  align-items: center;
  color: ${({ active }) =>
    active
      ? themeCssVariables.font.color.secondary
      : themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xxs};
  gap: ${themeCssVariables.spacing[2]};
`;

const REQUIRED_ANSWER_MIN_LENGTH = 3;

export const DiexOnboarding = ({
  isSubmitting,
  initialAnswers = EMPTY_DIEX_ONBOARDING_ANSWERS,
  supplementaryContent,
  onSubmit,
}: {
  isSubmitting: boolean;
  initialAnswers?: DiexOnboardingAnswers;
  supplementaryContent?: ReactNode;
  onSubmit: (operationDescription: string) => void;
}) => {
  const [answers, setAnswers] = useState(initialAnswers);
  const [hasEditedAnswers, setHasEditedAnswers] = useState(false);

  useEffect(() => {
    if (!hasEditedAnswers) {
      setAnswers(initialAnswers);
    }
  }, [hasEditedAnswers, initialAnswers]);

  const missingRequiredCount = DIEX_ONBOARDING_QUESTIONS.filter(
    ({ key, isRequired }) =>
      isRequired && answers[key].trim().length < REQUIRED_ANSWER_MIN_LENGTH,
  ).length;
  const canSubmit = missingRequiredCount === 0 && !isSubmitting;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (canSubmit) {
      onSubmit(buildOperationDescriptionFromAnswers(answers));
    }
  };

  return (
    <StyledRoot>
      <StyledGrid hasSupplementaryContent={Boolean(supplementaryContent)}>
        <StyledCard onSubmit={handleSubmit}>
          <StyledIcon>
            <IconSparkles size={16} />
          </StyledIcon>
          <StyledTitle>Sua operação em 7 respostas</StyledTitle>
          <StyledDescription>
            A IA usa isto para montar seu CRM com os nomes que você já usa.
            Frases curtas bastam.
          </StyledDescription>
          {isSubmitting ? (
            <StyledAiWorkState aria-live="polite" aria-busy="true">
              <StyledAiPulse>Montando seu CRM</StyledAiPulse>
              <StyledAiStep active>
                <IconCheck size={12} /> Respostas recebidas
              </StyledAiStep>
              <StyledAiStep active>
                <IconSparkles size={12} /> Definindo objetos, etapas, páginas e
                termos do seu nicho
              </StyledAiStep>
              <StyledAiStep>
                Você revisa e publica antes de qualquer mudança valer.
              </StyledAiStep>
            </StyledAiWorkState>
          ) : (
            <>
              <StyledFields>
                {DIEX_ONBOARDING_QUESTIONS.map(
                  ({ key, label, placeholder, isRequired }) => (
                    <StyledField key={key}>
                      <StyledLabel htmlFor={`diex-onboarding-${key}`}>
                        {label}
                        {isRequired ? null : (
                          <StyledOptional> · opcional</StyledOptional>
                        )}
                      </StyledLabel>
                      <TextArea
                        textAreaId={`diex-onboarding-${key}`}
                        minRows={2}
                        maxRows={5}
                        value={answers[key]}
                        placeholder={placeholder}
                        onChange={(value) => {
                          setHasEditedAnswers(true);
                          setAnswers((current) => ({
                            ...current,
                            [key]: value,
                          }));
                        }}
                      />
                    </StyledField>
                  ),
                )}
              </StyledFields>
              <StyledFooter>
                <StyledHint>
                  {missingRequiredCount === 0
                    ? 'Dá para ajustar tudo depois'
                    : missingRequiredCount === 1
                      ? 'Falta 1 resposta'
                      : `Faltam ${missingRequiredCount} respostas`}
                </StyledHint>
                <Button
                  type="submit"
                  title="Montar meu CRM"
                  Icon={IconArrowRight}
                  disabled={!canSubmit}
                />
              </StyledFooter>
            </>
          )}
        </StyledCard>
        {supplementaryContent}
      </StyledGrid>
    </StyledRoot>
  );
};
