import { defineAgent } from 'twenty-sdk/define';

export const CUSTOMER_SUCCESS_REVIEW_AGENT_UNIVERSAL_IDENTIFIER =
  'd1e0a000-0000-4000-8000-000000000005';

export default defineAgent({
  universalIdentifier: CUSTOMER_SUCCESS_REVIEW_AGENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-customer-success-review',
  label: 'Diex Customer Success Review',
  icon: 'IconHeartHandshake',
  description:
    'Consolida saúde, risco, renovação e expansão a partir do plano, marcos, sinais e contatos reais.',
  responseFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Resumo executivo factual para o plano de sucesso.',
        },
        risk_level: {
          type: 'string',
          description: 'HEALTHY, ATTENTION, CRITICAL ou UNKNOWN.',
        },
        confidence: {
          type: 'number',
          description: 'Confiança de 0 a 100.',
        },
        facts: {
          type: 'string',
          description: 'Resultados, marcos e contatos efetivamente observados.',
        },
        gaps: {
          type: 'string',
          description: 'Dados de adoção ou valor ainda não comprovados.',
        },
        intervention: {
          type: 'string',
          description: 'Próxima intervenção de CS recomendada.',
        },
        next_review_days: {
          type: 'number',
          description: 'Prazo recomendado em dias para a próxima revisão.',
        },
        action_type: {
          type: 'string',
          description: 'CS_INTERVENTION, EXPANSION, FOLLOW_UP ou NONE.',
        },
        action_title: {
          type: 'string',
          description: 'Título da eventual ação governada.',
        },
        action_rationale: {
          type: 'string',
          description: 'Fatos e inferências da eventual ação.',
        },
        action_proposal: {
          type: 'string',
          description: 'Prévia da intervenção para revisão humana.',
        },
        should_propose_action: {
          type: 'boolean',
          description:
            'Verdadeiro quando uma intervenção consequencial deve entrar na fila.',
        },
      },
      required: [
        'summary',
        'risk_level',
        'confidence',
        'facts',
        'gaps',
        'intervention',
        'next_review_days',
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
    'Você revisa Customer Success para a Diex.',
    'Receberá plano, cliente, contato, marcos, saúde calculada, sinais e histórico de comunicação.',
    'Use somente fatos recebidos e identifique explicitamente lacunas de adoção ou valor.',
    'Não afirme churn, renovação ou expansão como certeza.',
    'Priorize onboarding bloqueado, baixa adoção, valor não comprovado, renovação próxima e riscos sem tratamento.',
    'Nenhuma mensagem, tarefa ou oportunidade deve ser executada automaticamente.',
    'Nunca solicite ou exponha credenciais ou segredos.',
  ].join(' '),
});
