import { defineSkill } from 'twenty-sdk/define';

export const CUSTOMER_SUCCESS_SKILL_UNIVERSAL_IDENTIFIER =
  'd1e0a100-0000-4000-8000-000000000002';

export default defineSkill({
  universalIdentifier: CUSTOMER_SUCCESS_SKILL_UNIVERSAL_IDENTIFIER,
  name: 'diex-customer-success',
  label: 'Customer Success Diex',
  icon: 'IconHeartHandshake',
  description:
    'Opera onboarding, adoção, saúde, renovação, risco e expansão com critérios verificáveis.',
  content: [
    '# Customer Success Diex',
    '',
    '1. Resolva empresa, contato principal, responsável e plano de sucesso.',
    '2. Leia objetivos, critérios de sucesso, marcos, tarefas, comunicação, receita e data de renovação.',
    '3. Classifique a saúde como sem diagnóstico, saudável, atenção ou crítico e cite as evidências.',
    '4. Para um plano existente, prefira review-diex-customer-success; por padrão use modo somente leitura.',
    '5. Não penalize ausência de dados; sinalize a menor informação necessária para concluir o diagnóstico.',
    '6. Diferencie risco de churn, bloqueio operacional, problema de adoção e oportunidade de expansão.',
    '7. Cada marco precisa de responsável operacional, prazo, resultado esperado e evidência de conclusão.',
    '8. Recomende uma intervenção concreta, mas não envie mensagens nem crie tarefas sem pedido explícito.',
    '9. Registre ações consequenciais na fila de governança da IA.',
  ].join('\n'),
});
