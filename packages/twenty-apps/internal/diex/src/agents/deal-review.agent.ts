import { defineAgent } from 'twenty-sdk/define';

export const DEAL_REVIEW_AGENT_UNIVERSAL_IDENTIFIER =
  'd1e0a000-0000-4000-8000-000000000004';

export default defineAgent({
  universalIdentifier: DEAL_REVIEW_AGENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-deal-review',
  label: 'Diex Deal Review',
  icon: 'IconTargetArrow',
  description:
    'Explica risco e próxima ação de uma oportunidade usando qualificação, sinais e comunicação reais.',
  responseFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        risk: {
          type: 'string',
          description: 'LOW, MEDIUM, HIGH ou UNKNOWN.',
        },
        confidence: {
          type: 'number',
          description: 'Confiança de 0 a 100.',
        },
        facts: {
          type: 'string',
          description: 'Fatos observados que sustentam o diagnóstico.',
        },
        gaps: {
          type: 'string',
          description: 'Dados relevantes ainda ausentes ou não confirmados.',
        },
        reasoning: {
          type: 'string',
          description: 'Explicação curta do risco sem tratar previsão como fato.',
        },
        next_action: {
          type: 'string',
          description: 'Próximo passo objetivo com maior impacto comercial.',
        },
        action_type: {
          type: 'string',
          description:
            'QUALIFY, FOLLOW_UP, RISK_MITIGATION, PIPELINE_UPDATE ou NONE.',
        },
        action_title: {
          type: 'string',
          description: 'Título curto da eventual ação governada.',
        },
        action_rationale: {
          type: 'string',
          description: 'Evidências e inferências da eventual ação.',
        },
        action_proposal: {
          type: 'string',
          description: 'Prévia exata do que um humano deverá revisar.',
        },
        should_propose_action: {
          type: 'boolean',
          description:
            'Verdadeiro apenas quando há uma intervenção consequencial útil.',
        },
      },
      required: [
        'risk',
        'confidence',
        'facts',
        'gaps',
        'reasoning',
        'next_action',
        'action_type',
        'action_title',
        'action_rationale',
        'action_proposal',
        'should_propose_action',
      ],
      additionalProperties: false,
    },
  },
  prompt: [
    'Antes de qualquer análise ou redação destinada ao cliente, carregue o contexto do workspace com get-diex-workspace-context: ele traz negócio, cliente ideal, tom de voz, regras comerciais, objeções, concorrência, proibições e ofertas ativas desta empresa. Respeite tom e regras; nunca produza afirmação listada como proibida; trate lacuna de contexto como informação ausente, não como licença para supor.',
    'Você revisa oportunidades comerciais para a Diex.',
    'Receberá dados reais já resolvidos pelo CRM, incluindo score transparente, qualificação, sinais e conversas.',
    'Use somente os dados recebidos e diga quando a evidência for insuficiente.',
    'Não altere estágio, não trate forecast como compromisso e não recomende avançar sem critério.',
    'Priorize o próximo passo que aumenta chance de receita ou reduz atraso.',
    'Qualquer efeito externo deve permanecer como proposta aguardando aprovação humana.',
    'Nunca solicite ou exponha credenciais ou segredos.',
  ].join(' '),
});
