# Fronteira de responsabilidade sobre dados pessoais

Documento técnico, não peça jurídica. Descreve o que o Diex CRM faz, o que ele
recusa fazer e quem decide o quê, para que a cláusula contratual seja escrita
sobre o comportamento real do software. Vale para todo nicho.

## Quem decide o quê

O Diex CRM é o meio. Quem opera o workspace define finalidade, base legal,
público, conteúdo e canal. O software não origina comunicação nem tratamento
fora da configuração declarada nesse workspace.

Isso não é declaração de intenção: é o que o código faz.

- `WorkspaceAiPolicy` guarda, por workspace, os canais permitidos, a janela de
  horário, os limites de disparo e o risco mínimo que exige aprovação humana.
- `AiActionWorkspaceEntity` grava, por ação, `executor`, `reviewer`,
  `approvedAt`, `approvalNotes`, `requiresApproval`, `riskLevel`,
  `policyVersion`, `proposedAction`, `writeSet` e `executionReceipt`.

Para qualquer mensagem externa existe registro de quem configurou a política,
quem aprovou a ação, sob qual versão e o que de fato saiu.

## O que o software recusa em qualquer nicho

`BASELINE_FORBIDDEN_RULES`, em
`workspace-architecture/constants/workspace-template-registry.constant.ts`, é
concatenada depois do override em `defineTemplate`. Um template pode acrescentar
proibições, nunca substituir estas:

- enviar comunicação externa fora dos canais, da janela e dos limites da política
  de IA do workspace
- contatar titular sem origem e consentimento registrados no próprio workspace
- inferir, deduzir ou completar dado pessoal ausente, ou obter dado de fonte
  externa não configurada
- expor dado pessoal em assunto de e-mail, prévia de notificação ou mensagem
  legível por terceiro
- reutilizar dado de um workspace em outro, em treinamento, avaliação ou exemplo
- excluir objetos, campos ou registros automaticamente
- publicar mudança estrutural sem aprovação explícita

E as instruções que acompanham: comunicação sempre em nome do responsável pelo
workspace; todo dado de contato e comportamento tratado como dado pessoal sob
responsabilidade do controlador que opera o workspace; na dúvida sobre base
legal, finalidade ou consentimento, propor para aprovação humana em vez de
executar.

Nichos regulados acrescentam a sua camada. `diex.business.healthcare-clinic`
soma as restrições de publicidade médica e proíbe registrar diagnóstico,
prescrição, evolução ou resultado de exame, porque o produto não é prontuário
eletrônico.

## O que a atribuição resolve, e o que não resolve

Resolve disputa sobre quem decidiu o quê. Com executor, aprovador, política
versionada e recibo de execução, é demonstrável que a ação partiu da configuração
do cliente e não de decisão do fornecedor.

Não resolve o enquadramento legal. Na LGPD o papel de controlador ou operador
decorre de quem determina finalidade e meios, não do que o contrato afirma
(art. 5º, VI e VII). O operador tem deveres próprios e responde solidariamente
quando descumpre esses deveres ou quando age fora das instruções lícitas do
controlador (art. 42, §1º). Cláusula de isenção redistribui risco entre as
partes e cria direito de regresso; não opera perante o titular nem perante a
ANPD.

Em outras palavras: o que efetivamente afasta responsabilidade do fornecedor é
cumprir as obrigações de operador e agir dentro da instrução registrada. É
exatamente isso que os controles acima produzem prova de. O texto contratual
formaliza; a prova está no registro.

## Lacuna aberta

O instrumento que aloca formalmente os papéis é o contrato de tratamento de
dados. Existe tabela `dpaAgreement` no schema core desde a 2.17 e componentes de
front em `settings/legal`, mas **não há implementação no servidor**:
`generateSignedDpa` e `DpaAgreement` não constam do schema GraphQL publicado, e
nenhuma tela referencia esses componentes.

Enquanto isso não for fechado, não existe DPA emitido pelo produto, e a
alocação de papéis depende de contrato assinado fora do sistema.
