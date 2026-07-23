import { defineSkill } from 'twenty-sdk/define';

export const COMMERCIAL_INTELLIGENCE_SKILL_UNIVERSAL_IDENTIFIER =
  'd1e0a100-0000-4000-8000-000000000001';

export default defineSkill({
  universalIdentifier:
    COMMERCIAL_INTELLIGENCE_SKILL_UNIVERSAL_IDENTIFIER,
  name: 'diex-commercial-intelligence',
  label: 'Inteligência comercial Diex',
  icon: 'IconRadar',
  description:
    'Diagnostica oportunidade, evidência, risco e próxima ação sem inventar contexto.',
  content: [
    '# Inteligência comercial Diex',
    '',
    '1. Resolva os IDs da oportunidade, empresa e pessoas antes de analisar.',
    '2. Leia oferta, etapa, valor, responsável, contatos, atividades, tarefas e sinais comerciais relacionados.',
    '3. Organize a saída em: fatos observados, lacunas, sinais, risco e próxima ação.',
    '4. Calcule score somente quando existirem dados suficientes e sempre explique os componentes.',
    '5. Para uma oportunidade existente, prefira review-diex-opportunity; por padrão use modo somente leitura.',
    '6. Não transforme ausência de dados em sinal negativo; registre a lacuna.',
    '7. Registre novo sinal com fonte, evidência, força, confiança, validade e ação recomendada.',
    '8. Se a recomendação enviar mensagem, mudar pipeline ou provocar outro efeito externo, crie uma Ação de IA aguardando aprovação.',
    '9. Não trate previsão como compromisso e não invente valor, data, consentimento ou fala do cliente.',
  ].join('\n'),
});
