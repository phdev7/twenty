import { t } from '@lingui/core/macro';

export const getStandardApplicationDescription =
  (): string => t`O núcleo de dados e operações de todos os workspaces Diex CRM.

#### Estrutura principal

Empresas, pessoas, oportunidades, atividades e automações compartilham o mesmo modelo, as mesmas permissões e a mesma camada de auditoria.

#### Capacidades incluídas
- **Empresas e pessoas**: contas e contatos
- **Oportunidades**: pipeline comercial
- **Notas e tarefas**: execução e acompanhamento
- **Inbox comercial**: conversas vinculadas ao CRM
- **Inteligência comercial**: sinais, score e próxima ação
- **Customer Success e renovações**: retenção, expansão e receita protegida
- **Governança de IA**: propostas, aprovação humana, execução e recibo
- **MCP, conectores e workflows**: integração segura sobre o mesmo workspace

Esse núcleo é obrigatório e não pode ser removido do workspace.`;
