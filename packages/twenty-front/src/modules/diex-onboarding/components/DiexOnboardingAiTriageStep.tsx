import { Button } from 'twenty-ui/input';

import { useOpenAskAiPageWithPreprompt } from '@/ai/hooks/useOpenAskAiPageWithPreprompt';
import { DiexOnboardingBadge } from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  DiexOnboardingStepCard,
  StyledActions,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';

const WORKSPACE_TRIAGE_PROMPT = `Quero organizar este workspace de acordo com a operação da minha empresa.

Comece lendo o contexto ativo do workspace. Depois conduza uma triagem objetiva, com uma pergunta por vez, para entender:
- processo comercial e etapas do funil;
- tipos de clientes, empresas, oportunidades e atividades;
- dados que precisam ser obrigatórios;
- indicadores e metas que a gestão acompanha;
- equipes, responsáveis e regras de acesso;
- módulos e atalhos que devem aparecer no menu lateral;
- automações, Inbox Comercial, Customer Success e renovações.

Ao final, apresente um plano de configuração com objetos, campos, pipelines, páginas, dashboards, filtros e menu lateral. Não altere nada sem minha confirmação. Depois da confirmação, use as ferramentas disponíveis para aplicar a estrutura aprovada e reporte cada mudança.`;

export const DiexOnboardingAiTriageStep = ({
  isDone,
  onStart,
}: {
  isDone: boolean;
  onStart: () => void;
}) => {
  const { openAskAiPageWithPreprompt } = useOpenAskAiPageWithPreprompt();

  const startTriage = () => {
    onStart();
    openAskAiPageWithPreprompt({
      text: WORKSPACE_TRIAGE_PROMPT,
      mode: 'SEND',
      model: 'SMART',
    });
  };

  return (
    <DiexOnboardingStepCard
      index={4}
      isDone={isDone}
      title="Desenhar o CRM com a IA"
      badges={
        <DiexOnboardingBadge tone={isDone ? 'green' : 'blue'}>
          {isDone ? 'Diagnóstico iniciado' : 'Recomendado'}
        </DiexOnboardingBadge>
      }
    >
      <StyledText>
        A IA vai ler o contexto cadastrado, entrevistar você e propor modelo de
        dados, funil, páginas, dashboards, filtros e menu lateral. Nenhuma
        alteração será aplicada sem sua confirmação.
      </StyledText>
      <StyledActions>
        <Button
          title={
            isDone ? 'Abrir novo diagnóstico' : 'Iniciar diagnóstico com IA'
          }
          variant="primary"
          onClick={startTriage}
        />
      </StyledActions>
    </DiexOnboardingStepCard>
  );
};
