import { defineAgent } from 'twenty-sdk/define';

export const INBOX_TRIAGE_AGENT_UNIVERSAL_IDENTIFIER =
  'd1e0a000-0000-4000-8000-000000000003';

export default defineAgent({
  universalIdentifier: INBOX_TRIAGE_AGENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-inbox-triage',
  label: 'Diex Inbox Triage',
  icon: 'IconMessageChatbot',
  description:
    'Analisa o histórico real da conversa, identifica sinal comercial e redige uma resposta revisável.',
  responseFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Resumo factual da situação em até 500 caracteres.',
        },
        intent: {
          type: 'string',
          description:
            'Intenção principal: BUY, QUESTION, OBJECTION, SUPPORT, CHURN, EXPANSION ou UNKNOWN.',
        },
        sentiment: {
          type: 'string',
          description: 'POSITIVE, NEUTRAL, NEGATIVE ou UNKNOWN.',
        },
        urgency: {
          type: 'number',
          description: 'Urgência de 1 a 5 baseada somente em evidências.',
        },
        signal_type: {
          type: 'string',
          description:
            'INTENT, ENGAGEMENT, OBJECTION, RISK, EXPANSION, CHURN_RISK, COMPETITOR ou NONE.',
        },
        signal_strength: {
          type: 'number',
          description: 'Força do sinal de 1 a 5.',
        },
        confidence: {
          type: 'number',
          description: 'Confiança de 0 a 100.',
        },
        evidence: {
          type: 'string',
          description:
            'Trechos parafraseados, fatos e datas que sustentam a análise.',
        },
        recommended_action: {
          type: 'string',
          description: 'Próxima ação interna recomendada.',
        },
        suggested_reply: {
          type: 'string',
          description:
            'Rascunho de resposta em português brasileiro, sem promessas não confirmadas.',
        },
        should_register_signal: {
          type: 'boolean',
          description: 'Verdadeiro apenas quando há evidência comercial útil.',
        },
        should_propose_reply: {
          type: 'boolean',
          description:
            'Verdadeiro quando o rascunho é útil, mas ainda exige aprovação humana.',
        },
      },
      required: [
        'summary',
        'intent',
        'sentiment',
        'urgency',
        'signal_type',
        'signal_strength',
        'confidence',
        'evidence',
        'recommended_action',
        'suggested_reply',
        'should_register_signal',
        'should_propose_reply',
      ],
      additionalProperties: false,
    },
  },
  prompt: [
    'Você é o analista da Inbox comercial da Diex.',
    'Receberá um pacote fechado com pessoa, empresa, oportunidade e mensagens já autorizadas.',
    'Use somente esse pacote; não procure dados externos e não invente fatos.',
    'Separe o que foi observado do que é inferência.',
    'Não confunda dúvida, suporte ou cordialidade com intenção de compra.',
    'O rascunho deve ser humano, direto e adequado à última mensagem recebida.',
    'Nunca envie nada, não altere registros e não prometa preço, prazo ou resultado ausente do contexto.',
    'Nunca peça credenciais, tokens, QR Code ou qualquer segredo.',
  ].join(' '),
});
