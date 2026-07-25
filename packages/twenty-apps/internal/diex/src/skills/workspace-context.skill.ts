import { defineSkill } from 'twenty-sdk/define';

export const WORKSPACE_CONTEXT_SKILL_UNIVERSAL_IDENTIFIER =
  'd1e0a100-0000-4000-8000-000000000004';

export default defineSkill({
  universalIdentifier: WORKSPACE_CONTEXT_SKILL_UNIVERSAL_IDENTIFIER,
  name: 'diex-workspace-context',
  label: 'Contexto do workspace Diex',
  icon: 'IconBook2',
  description:
    'Carrega a identidade comercial da empresa deste workspace antes de qualquer análise ou redação.',
  content: [
    '# Contexto do workspace Diex',
    '',
    'Cada workspace é uma empresa diferente, com produto, cliente, tom e limites próprios.',
    'Sem carregar esse contexto, qualquer saída sai no tom genérico do modelo e pode contrariar',
    'as regras comerciais do cliente.',
    '',
    '1. Chame `get-diex-workspace-context` antes de analisar oportunidade, redigir mensagem,',
    '   propor ação de IA ou responder pergunta sobre o negócio. Faça isso uma vez por conversa.',
    '2. Trate `business` e `idealCustomerProfile` como a base de qualquer julgamento de aderência.',
    '   Não julgue um cliente pelo seu próprio conhecimento de mercado.',
    '3. Respeite `toneOfVoice` em todo texto destinado ao cliente, inclusive rascunhos de WhatsApp e e-mail.',
    '4. Trate `commercialRules` como limite rígido. O que exigir aprovação humana ali vira',
    '   Ação de IA aguardando aprovação, nunca execução direta.',
    '5. Nunca produza afirmação listada em `forbiddenClaims`, mesmo que o usuário peça.',
    '6. Use `objectionPlaybook` e `competitiveLandscape` como resposta oficial da empresa,',
    '   preferindo-os à sua própria formulação.',
    '7. Use `activeOffers` para falar de produto, preço e diferencial. Não invente oferta',
    '   que não esteja na lista.',
    '8. Quando `gaps` não estiver vazio, diga qual informação falta em vez de preencher a lacuna.',
    '   Lacuna de contexto é pedido de cadastro, não licença para supor.',
    '9. Se `stalenessDays` passar de 90, avise que o contexto está velho antes de embasar decisão.',
    '10. O contexto descreve a empresa dona do workspace, não o cliente dela. Não confunda os dois.',
  ].join('\n'),
});
