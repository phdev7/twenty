# Diex CRM Platform

## Decisão

O Diex CRM passa a evoluir sobre o fork do Twenty. Chatwoot permanece como
referência de produto para atendimento e inbox; o CRM Diex anterior permanece
como fonte de regras comerciais e dados a migrar.

Não haverá três aplicações em produção. O destino é uma única plataforma:

- núcleo, UX, metadados e multiworkspace do Twenty;
- domínio comercial, Customer Success e inteligência da Diex;
- padrões de inbox, distribuição e colaboração inspirados no Chatwoot.

## Por que esta é a base

O Twenty já entrega a infraestrutura mais cara de reconstruir corretamente:

- frontend React e backend NestJS no mesmo monorepo;
- PostgreSQL como fonte de verdade;
- Redis e workers para processamento assíncrono;
- separação por workspace para operação SaaS multi-tenant;
- objetos, campos, relações, views, permissões e automações configuráveis;
- e-mail, calendário, API, webhooks, MCP e agentes de IA;
- Docker Compose, Kubernetes, Helm e armazenamento S3.

O Chatwoot possui o inbox mais maduro, mas exigiria reconstruir o núcleo de CRM.
O Diex anterior possui conhecimento comercial relevante, mas exigiria evoluir
uma infraestrutura menor. O Twenty reduz tempo de mercado e concentra o
investimento nas funções que diferenciam e vendem o Diex.

## Arquitetura-alvo

```text
Internet
   |
Proxy/TLS
   |
Diex Web/API -------- PostgreSQL
   |                      |
   +---- Redis -----------+
   |      |
   |   Diex Worker
   |
   +---- S3/objetos
   |
   +---- provedores de e-mail, calendário, WhatsApp e MCP
```

### Isolamento SaaS

O `workspace` nativo é a fronteira de tenant. Toda empresa cliente opera em um
workspace próprio, com membros, permissões, objetos, automações, credenciais e
dados isolados. Não deve ser criada uma segunda camada paralela de tenant.

### Extensão sem perder o upstream

As mudanças ficam separadas por responsabilidade:

1. `packages/twenty-apps/internal/diex`: modelo comercial, CS, views,
   agentes, skills e automações instaláveis.
2. Núcleo: apenas identidade Diex, comportamento global de IA/MCP e capacidades
   que o SDK ainda não permite entregar.
3. Inbox: reutiliza pessoas, empresas, oportunidades, tarefas e infraestrutura
   de mensagens do núcleo; adaptadores de canal ficam isolados.

Essa divisão mantém a UX do Twenty e reduz conflitos ao incorporar atualizações
do repositório upstream.

## Domínio Diex

O modelo deve conectar:

- pessoa e empresa;
- oportunidade e etapa do funil;
- conversa e mensagens;
- responsável, fila e SLA;
- próxima ação e tarefa;
- sinais comerciais, score e justificativa;
- saúde da conta, risco, expansão e renovação;
- histórico, notas e atividades.

IA não substitui fatos do CRM. Scores, previsões e riscos devem sempre registrar
evidência, confiança e próxima ação recomendada.

## Inbox comercial

O inbox não será um help desk solto. Cada conversa deve resolver ou criar o
vínculo com pessoa, empresa e oportunidade, exibir contexto comercial e
permitir:

- atribuição individual ou por equipe;
- estados aberto, pendente e resolvido;
- prioridade, SLA e tags;
- notas internas e menções;
- resposta com aprovação humana;
- criação de tarefa e próxima ação;
- sugestão de resposta e resumo por IA;
- captura de sinal de compra, objeção, risco e intenção.

E-mail pode aproveitar a infraestrutura nativa. WhatsApp deve entrar por um
adaptador próprio, sem expor token, QR Code ou segredo via MCP.

## Infraestrutura de produção

Começar com uma topologia simples e escalável:

- 1 serviço web/API;
- 1 ou mais workers;
- PostgreSQL 16 gerenciado ou dedicado;
- Redis com política `noeviction`;
- armazenamento S3 compatível;
- proxy com TLS;
- backups externos do banco e dos objetos;
- logs, métricas e alertas separados por serviço.

Web e worker usam a mesma imagem versionada. Migrações rodam apenas no serviço
web durante o deploy. O worker inicia com migrações e registro de cron
desabilitados.

## Migração

1. Consolidar identidade, domínio comercial, CS, IA e MCP.
2. Entregar inbox comercial conectado à Evolution, com painel seguro,
   consentimento, prévia e confirmação de envio.
3. Expandir canais aproveitando e-mail e calendário nativos do Twenty.
4. Importar cada `team_id` para um workspace isolado usando
   `tools/diex-migration`, com prévia, checksums e upsert idempotente.
5. Operar uma validação assistida por cliente.
6. Desativar as infraestruturas antigas somente após paridade de dados e fluxos.

## Estado operacional

O app privado `diex` chegou à versão `0.11.0` com:

- Inbox em três painéis, contexto de pessoa, empresa e oportunidade, SLA,
  prioridade, responsável, tarefas, notas internas e triagem por IA;
- Evolution isolada por workspace, webhooks idempotentes, consentimento,
  prévia e confirmação de envio;
- respostas prontas com variáveis do CRM, etiquetas, filtros, adiamento e
  reabertura automática;
- filas de atenção, prioridade editável e criação/conclusão de próxima ação
  vinculada à conversa, pessoa, empresa e oportunidade;
- equipes de Inbox com membros, SLA por fila, distribuição manual ou pela
  menor carga, filtro operacional e roteamento da Evolution para a fila padrão;
- cockpit de inteligência comercial, fila de sinais e ranking acionável;
- Centro de IA com evidência, aprovação humana e trilha de execução;
- Customer Success com carteira, receita sob risco, renovação, marcos e revisão
  inteligente;
- MCP identificado como Diex CRM e instruído para operar vendas, retenção,
  aprovação e segurança;
- migração por tenant com prévia, checksum e upsert idempotente.

Isso ainda não autoriza o cutover. Os gates restantes são:

1. criar o primeiro workspace de homologação e instalar o app;
2. configurar IA, Evolution e armazenamento pelos painéis e secrets corretos;
3. executar prévia e aplicação da migração com reconciliação;
4. validar os fluxos reais de venda, atendimento e CS em homologação;
5. gerar backup final, importar o delta e obter aceite operacional;
6. só então trocar `crm.bydiex.com` e manter o Laravel recuperável durante a
   janela de rollback.

## Regra de evolução

Cada função nova deve aumentar receita, velocidade comercial, retenção ou
eficiência operacional. Recursos genéricos que não atendem a um desses quatro
resultados não entram na prioridade do produto.
