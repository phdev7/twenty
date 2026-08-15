export type DiexOnboardingAnswerKey =
  | 'offer'
  | 'customer'
  | 'entry'
  | 'process'
  | 'afterSale'
  | 'rules'
  | 'team';

export type DiexOnboardingAnswers = Record<DiexOnboardingAnswerKey, string>;

export const DIEX_ONBOARDING_QUESTIONS: Array<{
  key: DiexOnboardingAnswerKey;
  label: string;
  placeholder: string;
  isRequired: boolean;
}> = [
  {
    key: 'offer',
    label: 'O que você vende',
    placeholder: 'Ex.: implantes e ortodontia, ticket de 3 a 12 mil',
    isRequired: true,
  },
  {
    key: 'customer',
    label: 'Quem compra',
    placeholder: 'Ex.: adultos de 30 a 55 anos, procuram por dor e estética',
    isRequired: true,
  },
  {
    key: 'entry',
    label: 'Por onde chegam os contatos',
    placeholder: 'Ex.: WhatsApp, Instagram e indicação',
    isRequired: true,
  },
  {
    key: 'process',
    label: 'Como a venda acontece',
    placeholder: 'Ex.: contato, avaliação, orçamento, fechamento em 15 dias',
    isRequired: true,
  },
  {
    key: 'afterSale',
    label: 'Depois da venda',
    placeholder: 'Ex.: agendamento, tratamento em 6 meses, retorno anual',
    isRequired: false,
  },
  {
    key: 'rules',
    label: 'Regras e limites',
    placeholder: 'Ex.: desconto até 10% com o gestor, nunca prometer resultado',
    isRequired: false,
  },
  {
    key: 'team',
    label: 'Quem opera',
    placeholder: 'Ex.: 2 vendedores, 1 recepção e o dono aprova desconto',
    isRequired: false,
  },
];

export const EMPTY_DIEX_ONBOARDING_ANSWERS: DiexOnboardingAnswers = {
  offer: '',
  customer: '',
  entry: '',
  process: '',
  afterSale: '',
  rules: '',
  team: '',
};

// A IA recebe texto corrido. Os rótulos viram cabeçalho de cada resposta para
// que a extração saiba de qual parte da operação cada trecho fala.
export const buildOperationDescriptionFromAnswers = (
  answers: DiexOnboardingAnswers,
): string =>
  DIEX_ONBOARDING_QUESTIONS.map(({ key, label }) => {
    const answer = answers[key].trim();

    return answer.length > 0 ? `${label}: ${answer}` : null;
  })
    .filter((line): line is string => line !== null)
    .join('\n\n');
