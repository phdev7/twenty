import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { TextInput } from '@/ui/input/components/TextInput';
import { themeCssVariables } from 'diex-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[5]};
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
`;

const StyledMessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
`;

const StyledMessageItem = styled.div<{ isUser?: boolean }>`
  align-self: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
  background: ${(props) =>
    props.isUser ? 'rgba(103, 58, 183, 0.2)' : themeCssVariables.background.tertiary};
  border: 1px solid
    ${(props) => (props.isUser ? 'rgba(103, 58, 183, 0.4)' : themeCssVariables.border.color.light)};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  max-width: 85%;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.5;
`;

const StyledBadge = styled.span<{ scope?: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  background: ${(props) =>
    props.scope === 'GLOBAL'
      ? 'rgba(233, 30, 99, 0.2)'
      : props.scope === 'AGENCY_SCOPED'
      ? 'rgba(33, 150, 243, 0.2)'
      : 'rgba(76, 175, 80, 0.2)'};
  color: ${(props) =>
    props.scope === 'GLOBAL'
      ? '#ff4081'
      : props.scope === 'AGENCY_SCOPED'
      ? '#448aff'
      : '#69f0ae'};
  text-transform: uppercase;
`;

const ASK_DIEX_COPILOT = gql`
  mutation AskDiexCopilot($input: AskDiexCopilotInput!) {
    askDiexCopilot(input: $input) {
      reply
      scopeLevel
      workspacesAnalyzed
      actionSuggested
    }
  }
`;

export const DiexCopilotChatModal = () => {
  const [askCopilot, { loading }] = useMutation<{ askDiexCopilot: { reply: string; scopeLevel: string; workspacesAnalyzed: string[]; actionSuggested?: string } }>(ASK_DIEX_COPILOT);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; scopeLevel?: string; action?: string }>
  >([
    {
      sender: 'ai',
      text: 'Olá! Sou o Copilot de Operações Diex. Como posso ajudar com a inteligência multi-workspace da sua agência ou plataforma?',
      scopeLevel: 'AGENCY_SCOPED',
    },
  ]);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userText = prompt;
    setPrompt('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    try {
      const res = await askCopilot({
        variables: {
          input: {
            prompt: userText,
          },
        },
      });

      const data = res.data?.askDiexCopilot;
      if (data) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.reply,
            scopeLevel: data.scopeLevel,
            action: data.actionSuggested,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Erro ao consultar Copilot: ${err?.message || 'Erro de comunicação.'}`,
        },
      ]);
    }
  };

  return (
    <StyledContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Diex Copilot Multi-Workspace (IA RLS)</h3>
        <StyledBadge scope={messages[messages.length - 1]?.scopeLevel || 'AGENCY_SCOPED'}>
          {messages[messages.length - 1]?.scopeLevel || 'AGENCY_SCOPED'}
        </StyledBadge>
      </div>

      <StyledMessageList>
        {messages.map((msg, index) => (
          <StyledMessageItem key={index} isUser={msg.sender === 'user'}>
            {msg.text}
            {msg.action && (
              <div style={{ marginTop: '8px' }}>
                <Button
                  title={msg.action}
                  onClick={() => {
                    if (msg.action?.includes('/')) {
                      window.location.href = msg.action.split(' ').pop() || '/';
                    }
                  }}
                />
              </div>
            )}
          </StyledMessageItem>
        ))}
      </StyledMessageList>

      <div style={{ display: 'flex', gap: '8px' }}>
        <TextInput
          placeholder="Pergunte sobre tráfego, CPL, gargalos em clientes ou métricas da agência..."
          value={prompt}
          onChange={setPrompt}
        />
        <Button title={loading ? 'Analisando...' : 'Enviar'} onClick={handleSend} />
      </div>
    </StyledContainer>
  );
};
