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

const WORKSPACE_TRIAGE_PROMPT = `Faça uma entrevista operacional e comercial curta para revisar a ativação deste workspace.

Leia o contexto ativo e faça uma pergunta por vez para confirmar:
- objetivo prioritário, oferta e resultado esperado;
- cliente ou público ideal, canais de entrada e ciclo da operação;
- processo principal, responsáveis e etapas do fluxo;
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
  requiresOpportunity = true,
  readyLabel = 'CRM pronto para vender',
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
  requiresOpportunity?: boolean;
  readyLabel?: string;
  onStart: () => void;
}) => {
  const { openAskAiPageWithPreprompt } = useOpenAskAiPageWithPreprompt();

  // The first-value flow is the completion event. The interview remains a
  // secondary action so it can refine the AI context without hiding progress
  // behind a chat screen.
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
      title="Executar o primeiro fluxo de resultado"
      badges={
        <DiexOnboardingBadge tone={isDone ? 'green' : 'blue'}>
          {isDone ? 'Fluxo executado' : 'Resultado obrigatório'}
        </DiexOnboardingBadge>
      }
    >
      <StyledText>
        {requiresOpportunity
          ? 'A entrada recebida deve virar contato, oportunidade, responsável, classificação de intenção e próxima ação.'
          : 'A entrada recebida deve virar contato, responsável, classificação de intenção e próxima ação.'}{' '}
        Só depois disso o sistema pode ser considerado {readyLabel.toLowerCase()}.
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
