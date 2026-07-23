import { defineSkill } from 'twenty-sdk/define';

export const AI_ACTION_GOVERNANCE_SKILL_UNIVERSAL_IDENTIFIER =
  'd1e0a100-0000-4000-8000-000000000003';

export default defineSkill({
  universalIdentifier: AI_ACTION_GOVERNANCE_SKILL_UNIVERSAL_IDENTIFIER,
  name: 'diex-ai-action-governance',
  label: 'Governança de ações da IA',
  icon: 'IconShieldCheck',
  description:
    'Transforma recomendações em ações rastreáveis, aprováveis e auditáveis.',
  content: [
    '# Governança de ações da IA',
    '',
    'Use Ação de IA para qualquer recomendação que possa causar comunicação externa, mudança de pipeline, intervenção de CS ou efeito financeiro.',
    '',
    'Fluxo obrigatório:',
    '1. Crie a ação como AGUARDANDO APROVAÇÃO.',
    '2. Registre tipo, confiança, justificativa, evidências e efeito proposto.',
    '3. Mostre uma prévia clara do que será alterado ou enviado.',
    '4. Espere confirmação explícita do operador.',
    '5. Registre aprovação, execução e recibo; se falhar, registre o erro sem repetir silenciosamente.',
    '',
    'Nunca inclua senha, API key, token, webhook secret, QR Code ou pairing code no registro.',
    'Nunca suponha opt-in ou consentimento de canal.',
    'Aprovação de uma ação não aprova ações futuras semelhantes.',
  ].join('\n'),
});
