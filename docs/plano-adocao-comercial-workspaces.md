# Plano de adoção comercial para workspaces

## Escopo vendável confirmado no código

- **Agências:** há cadastro de agência, limite de slots, vínculo `managedByAgencyId`, portal para criar workspace de cliente e convite inicial ao administrador. O onboarding comercial do cliente continua sendo responsabilidade do workspace e do seu administrador.
- **Agendas individuais:** há calendário conectado por usuário (Google, Microsoft e CalDAV) e regra de visibilidade (`SHARE_EVERYTHING`, `METADATA` ou oculto). Não há produto de agenda pública, distribuição de horários ou booking comercial pronto para anunciar.
- **Inbox:** a operação comercial suporta WhatsApp via Evolution e e-mail, com conversa/mensagem idempotentes, responsável, tarefas e status de entrega. Não anunciar Instagram, Facebook Messenger, Telegram ou outros canais.
- **Ads:** há OAuth e contas de **Meta Ads**, métricas manuais por cliente e consolidado da agência (investimento, leads, CPL, ROAS, CAC e LTV). Não há integração com Google Ads.
- **Relatório do cliente:** a métrica pode ser marcada como visível ao cliente, mas a tela atual é autenticada para a agência e consulta apenas workspaces geridos por ela. Não existe link público, login de cliente ou dashboard compartilhável externo.

## Adoção em workspaces existentes

1. **Preservar a operação.** Não atribuir uma agência, canal, calendário ou métrica por inferência. O workspace sem adesão continua disponível; somente a nova operação fica pendente.
2. **Agência.** O administrador Diex cria a agência e vincula o gestor; a agência associa somente clientes que confirmou comercialmente. Clientes já ativos permanecem sem `managedByAgencyId` até confirmação explícita.
3. **Agenda.** Cada vendedor conecta sua própria conta e escolhe a visibilidade. O critério comercial é uma agenda conectada e um responsável identificado, não apenas uma tela de calendário aberta.
4. **Inbox.** Escolher o canal primário e validar o primeiro fluxo real: entrada → contato/empresa → oportunidade → responsável → follow-up. Para WhatsApp, só considerar conectado após evidência de conexão e conversa recebida; para e-mail, após conversa recebida.
5. **Ads.** Conectar somente Meta Ads autorizado ou lançar métrica manual com período e origem. Exibir ausência de dados como ausência de dados. Não vender dashboard ao cliente como compartilhado até existir acesso externo com escopo por workspace.
6. **Permissões.** Manter o cliente no seu workspace e limitar dados de agenda, inbox e pipeline pelas permissões nativas. O acesso de agência às APIs comerciais deve continuar restrito à agência dona do workspace ou ao administrador do sistema; a navegação não substitui a checagem no servidor.

## Criação de novos workspaces de agência

1. Agência com slot disponível cria o workspace do cliente e informa o administrador do cliente.
2. O administrador do cliente completa o onboarding: contexto comercial, oferta, objetivo, canal primário, responsáveis e primeiro fluxo comercial real.
3. A agência conecta as agendas dos vendedores, configura WhatsApp ou e-mail e define o dono do atendimento e do follow-up.
4. Se houver tráfego pago, conecta Meta Ads ou registra métricas manuais. O relatório só pode ser apresentado como interno da agência até a entrega de acesso externo seguro.
5. Só declarar **pronto para vender** quando a prontidão tiver evidência persistida de contexto, oferta, canal, contato/oportunidade, responsável e follow-up. Um convite enviado, um dashboard vazio ou uma atualização apenas lida não concluem a operação.

## Regra para próximos lançamentos comerciais

Antes de anunciar Google Ads, dashboard compartilhável, novo canal de inbox, booking ou cargo de agência, implementar o contrato e criar uma nova entrada versionada em `workspace-product-update-registry.constant.ts` com impacto em receita, ação, rota, evidência de conclusão e efeito na prontidão.

O registro atual já aparece no onboarding e compõe a prontidão. Para workspaces anteriores ao lançamento, gera aviso administrativo e reduz a prontidão enquanto obrigatório estiver pendente, sem bloquear o uso atual. A mesma fonte deve continuar alimentando tela, IA, MCP e automações.

## Referências de código

- Agência e acesso: `packages/diex-server/src/engine/core-modules/diex-agency/` e `packages/diex-front/src/modules/agency/`.
- Agenda e visibilidade: `packages/diex-server/src/modules/calendar/`.
- Inbox: `packages/diex-server/src/modules/inbox/` e `packages/diex-front/src/modules/inbox/`.
- Onboarding, evidências e prontidão: `packages/diex-server/src/modules/workspace-architecture/` e `packages/diex-front/src/modules/diex-onboarding/`.
