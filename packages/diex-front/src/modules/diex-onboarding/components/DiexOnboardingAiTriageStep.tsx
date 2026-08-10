import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { useOpenAskAiPageWithPreprompt } from '@/ai/hooks/useOpenAskAiPageWithPreprompt';
import { DiexOnboardingBadge } from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  DiexOnboardingStepCard,
  StyledActions,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';

const WORKSPACE_TRIAGE_PROMPT = `Faça uma entrevista comercial curta para revisar o onboarding deste workspace.

Leia o contexto ativo e faça uma pergunta por vez para confirmar:
- objetivo comercial e oferta principal;
- cliente ideal, canais de aquisição e ciclo de vendas;
- processo comercial e etapas do funil;
- objeções, provas, diferenciais e CTA;
- tom de voz, regras comerciais e promessas proibidas;
- responsáveis, metas e SLA de resposta.

Ao final, apresente apenas correções no entendimento e nas próximas ações de receita. Não publique mudanças estruturais sem aprovação explícita.`;

const StyledResult = styled.div`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.5;
  padding: ${themeCssVariables.spacing[3]};
`;

export const DiexOnboardingAiTriageStep = ({
  index = 7,
  isDone,
  canRun,
  isRunning,
  triageResult,
  onStart,
}: {
  index?: number;
  isDone: boolean;
  canRun: boolean;
  isRunning: boolean;
  triageResult?: {
    summary?: string;
    intent?: string;
    suggestedReply?: string;
  } | null;
  onStart: () => void;
}) => {
  const { openAskAiPageWithPreprompt } = useOpenAskAiPageWithPreprompt();

  // The commercial flow is the completion event. The interview remains a
  // secondary action so it can refine the AI context without hiding revenue
  // progress behind a chat screen.
  const openInterview = () => {
    openAskAiPageWithPreprompt({
      text: WORKSPACE_TRIAGE_PROMPT,
      mode: 'SEND',
      model: 'SMART',
    });
  };

  return (
    <DiexOnboardingStepCard
      index={index}
      isDone={isDone}
      title="Executar o primeiro fluxo de receita"
      badges={
        <DiexOnboardingBadge tone={isDone ? 'green' : 'blue'}>
          {isDone ? 'Fluxo executado' : 'Resultado obrigatório'}
        </DiexOnboardingBadge>
      }
    >
      <StyledText>
        A mensagem recebida deve virar contato, oportunidade, responsável,
        classificação de intenção e follow-up. Só depois disso o CRM pode dizer
        que está pronto para vender.
      </StyledText>
      {triageResult ? (
        <StyledResult>
          <strong>{triageResult.intent || 'Intenção classificada'}</strong>
          {triageResult.summary ? ` · ${triageResult.summary}` : ''}
          {triageResult.suggestedReply
            ? ` Sugestão: ${triageResult.suggestedReply}`
            : ''}
        </StyledResult>
      ) : null}
      <StyledActions>
        <Button
          title={isRunning ? 'Executando fluxo...' : 'Executar primeiro fluxo'}
          variant="primary"
          disabled={!canRun || isRunning}
          onClick={onStart}
        />
        <Button
          title="Refinar entrevista com IA"
          variant="secondary"
          onClick={openInterview}
        />
      </StyledActions>
    </DiexOnboardingStepCard>
  );
};
