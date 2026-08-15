import { type CurrentWorkspace } from '@/auth/states/currentWorkspaceState';
import { isNonEmptyString } from '@sniptt/guards';

import {
  type DiexOnboardingAnswers,
  EMPTY_DIEX_ONBOARDING_ANSWERS,
} from '@/diex-onboarding/types/diexOnboardingInterviewTypes';
import { type DiexPrimaryChannel } from '@/diex-onboarding/types/diexOnboardingTypes';

const ENTRY_ANSWER_BY_PRIMARY_CHANNEL: Record<DiexPrimaryChannel, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  IMPORT: 'Importação de uma base existente',
  MANUAL: 'Cadastro manual pela equipe',
  LATER: '',
};

const SIGNUP_ANSWER_SOURCES: Array<{
  key: keyof DiexOnboardingAnswers;
  source: keyof CurrentWorkspace;
}> = [
  { key: 'offer', source: 'onboardingCompanyDescription' },
  { key: 'customer', source: 'onboardingIdealCustomerProfile' },
  { key: 'process', source: 'onboardingCurrentProcess' },
  { key: 'team', source: 'onboardingCompanySize' },
];

// O cadastro já perguntou parte disto antes do workspace ir para aprovação.
// Reabrir os campos vazios fazia a pessoa digitar tudo de novo, então as
// respostas voltam preenchidas para confirmar ou ajustar.
export const buildOnboardingAnswersFromSignup = (
  workspace: CurrentWorkspace | null,
  primaryChannel?: DiexPrimaryChannel | null,
): DiexOnboardingAnswers => {
  const entry = primaryChannel
    ? (ENTRY_ANSWER_BY_PRIMARY_CHANNEL[primaryChannel] ?? '')
    : '';

  if (workspace === null) {
    return { ...EMPTY_DIEX_ONBOARDING_ANSWERS, entry };
  }

  return SIGNUP_ANSWER_SOURCES.reduce<DiexOnboardingAnswers>(
    (answers, { key, source }) => {
      const answer = workspace[source];

      return isNonEmptyString(answer)
        ? { ...answers, [key]: answer.trim() }
        : answers;
    },
    { ...EMPTY_DIEX_ONBOARDING_ANSWERS, entry },
  );
};
