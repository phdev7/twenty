import { type CurrentWorkspace } from '@/auth/states/currentWorkspaceState';
import { isNonEmptyString } from '@sniptt/guards';

const SIGNUP_ANSWER_LABELS: Array<{
  key: keyof CurrentWorkspace;
  label: string;
}> = [
  { key: 'onboardingCompanyDescription', label: 'O que a empresa faz' },
  { key: 'onboardingIdealCustomerProfile', label: 'Cliente ideal' },
  { key: 'onboardingToneOfVoice', label: 'Tom de voz' },
  { key: 'onboardingPrimaryGoal', label: 'Objetivo principal' },
  { key: 'onboardingCompanySize', label: 'Tamanho da operação' },
  { key: 'onboardingCurrentProcess', label: 'Processo atual e gargalos' },
];

// The sign-up form already asked all of this before the workspace went for
// approval. Re-opening an empty box made the requester type it a second time,
// so the answers come back as the starting text for them to confirm or adjust.
export const buildDescriptionFromSignupAnswers = (
  workspace: CurrentWorkspace | null,
): string => {
  if (workspace === null) {
    return '';
  }

  return SIGNUP_ANSWER_LABELS.map(({ key, label }) => {
    const answer = workspace[key];

    return isNonEmptyString(answer) ? `${label}: ${answer.trim()}` : null;
  })
    .filter((line): line is string => line !== null)
    .join('\n\n');
};
