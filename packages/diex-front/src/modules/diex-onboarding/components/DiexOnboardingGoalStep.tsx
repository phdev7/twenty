import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { DiexOnboardingBadge } from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  DiexOnboardingStepCard,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';

const GOALS = [
  { key: 'SELL_MORE', label: 'Vender mais' },
  { key: 'RESPOND_FASTER', label: 'Responder leads mais rápido' },
  { key: 'ORGANIZE_WHATSAPP', label: 'Organizar o WhatsApp' },
  { key: 'CONTROL_FOLLOWUPS', label: 'Controlar follow-ups' },
  {
    key: 'CUSTOMER_SUCCESS_RENEWALS',
    label: 'Melhorar Customer Success e renovações',
  },
] as const;

const StyledGoalGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

type DiexOnboardingGoalStepProps = {
  selectedGoal: string | null;
  isSaving: boolean;
  onSelect: (goal: string) => void;
};

export const DiexOnboardingGoalStep = ({
  selectedGoal,
  isSaving,
  onSelect,
}: DiexOnboardingGoalStepProps) => (
  <DiexOnboardingStepCard
    index={1}
    isDone={selectedGoal !== null}
    title="Defina o resultado comercial"
    badges={
      selectedGoal ? (
        <DiexOnboardingBadge tone="green">Objetivo escolhido</DiexOnboardingBadge>
      ) : (
        <DiexOnboardingBadge tone="orange">Obrigatório</DiexOnboardingBadge>
      )
    }
  >
    <StyledText>
      O onboarding será priorizado pela ação que precisa gerar receita primeiro.
    </StyledText>
    <StyledGoalGrid>
      {GOALS.map((goal) => (
        <Button
          key={goal.key}
          title={goal.label}
          variant={selectedGoal === goal.key ? 'primary' : 'secondary'}
          disabled={isSaving}
          onClick={() => onSelect(goal.key)}
        />
      ))}
    </StyledGoalGrid>
  </DiexOnboardingStepCard>
);
