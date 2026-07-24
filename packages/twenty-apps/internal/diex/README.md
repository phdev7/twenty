# Diex CRM

Aplicativo oficial da camada comercial Diex sobre o núcleo Twenty.

## Capacidades

- catálogo de ofertas e playbooks;
- aderência ao ICP, papel de compra e intenção;
- score comercial explicável e próxima ação;
- sinais de intenção, objeção, risco, expansão e churn;
- planos e marcos de Customer Success;
- saúde de carteira e pressão de renovação;
- fila de ações propostas pela IA com aprovação e recibo;
- agentes e skills especializados em vendas e CS;
- inbox comercial ligado aos registros nativos do CRM;
- respostas prontas por workspace com atalho, variáveis CRM e rastreio de uso;
- etiquetas comerciais configuráveis, filtráveis e ligadas ao histórico da
  conversa;
- distribuição de conversas por equipe e responsável, com filas, membros, SLA
  próprio, roteamento manual ou por menor carga e filtros diretos na Inbox;
- filas de atenção para não lidas, SLA estourado, prioridade alta ou urgente e
  follow-up vencido, com prioridade editável no contexto;
- criação e conclusão de próxima ação dentro da conversa, com prazo,
  responsável e vínculo nativo à pessoa, empresa e oportunidade;
- adiamento com prazo, reabertura por vencimento e reativação por nova
  mensagem;
- cockpit de inteligência comercial com radar de sinais, ranking de
  oportunidades e fila acionável.
- Centro de IA com fila de decisão, evidências, contexto do CRM, aprovação
  humana e trilha de auditoria sem execução externa automática.
- painel de Customer Success com jornada da carteira, receita sob risco,
  horizonte de renovação, marcos e revisão inteligente aplicável.

### Respostas prontas

Cadastre em `Diex > Respostas prontas`. No composer da Inbox, selecione o
modelo ou digite `/atalho`. O texto entra como rascunho editável e continua
passando pela prévia e confirmação antes do envio.

Variáveis disponíveis:

- `{{contact.name}}`, `{{contact.first_name}}`,
  `{{contact.last_name}}` e `{{contact.phone}}`;
- `{{company.name}}`;
- `{{opportunity.name}}` e `{{opportunity.stage}}`;
- `{{conversation.id}}` e `{{conversation.contact_handle}}`.

Use fallback quando o dado puder faltar:
`{{contact.first_name || 'Olá'}}`. A Inbox bloqueia a prévia enquanto houver
placeholder não resolvido.

### Etiquetas da inbox

Cadastre em `Diex > Etiquetas da inbox`. Cada etiqueta possui chave única,
cor, descrição de uso, status e contagem de aplicações. Na lateral de contexto
da conversa, clique para aplicar ou remover. A Inbox preserva o vínculo e as
datas da última aplicação ou remoção, além de permitir filtrar a fila por
etiqueta.

Use etiquetas para criar filas operacionais como `Lead quente`, `Proposta`,
`Objeção de preço`, `Aguardando cliente`, `Risco de churn` e `Expansão`.

### Distribuição de conversas

Cadastre as filas em `Diex > Equipes da inbox` e vincule os usuários em
`Diex > Membros das equipes`. Cada equipe define SLA, status, fila padrão e
estratégia manual ou por menor carga.

Ao escolher uma equipe na conversa, a estratégia balanceada seleciona o membro
ativo com menos conversas abertas. Novas conversas da Evolution entram na
primeira fila padrão ativa, recebem o SLA da equipe e, quando configurado,
também são distribuídas. A lista pode ser filtrada por equipe, responsável ou
conversas ainda sem distribuição.

### Adiamento

A conversa pode ser adiada por uma ou quatro horas, até amanhã às 9h ou até
segunda-feira, além de aceitar data e hora personalizadas. A Inbox reabre
adiamentos vencidos ao carregar a fila; uma nova mensagem recebida ou um envio
manual também reabre imediatamente e limpa o prazo anterior.

### Páginas operacionais

As áreas principais usam componentes compartilhados com diagramações
diferentes. A primeira página própria é `Diex > Inteligência`: hero em radar,
faixa de KPIs, fluxo vertical de sinais, ranking por score e grade de próximas
ações. Sinais podem ser assumidos e marcados como tratados sem sair do cockpit.

`Diex > Centro de IA` usa uma diagramação de console: fila de decisões à
esquerda, evidência e ação proposta no centro, contexto relacionado e comando
humano à direita, além da trilha recente. A aprovação apenas registra e libera
a proposta; nenhum efeito externo é disparado pelo front-end.

`Diex > Customer Success` usa uma diagramação de carteira e jornada: pulso de
saúde, receita protegida e sob risco, etapas clicáveis, carteira priorizada,
plano detalhado, marcos e horizonte de renovação. A revisão de IA possui prévia
sem mutação; quando aplicada explicitamente, atualiza saúde, resumo e próxima
revisão e cria somente uma proposta governada quando houver intervenção.

Os componentes `Card`, `Badge`, `Progress`, `Button`, `Separator` e `Skeleton`
seguem a composição source-owned do shadcn/ui, adaptada aos tokens e ao sandbox
Remote DOM do Twenty. Isso preserva a experiência nativa sem introduzir um
segundo tema Tailwind dentro do CRM.

## Instalação

No diretório deste aplicativo:

```bash
yarn install
yarn twenty app dev
```

O aplicativo usa o workspace do Twenty como fronteira de tenant. Objetos,
relações, views, agentes, variáveis e permissões são instalados separadamente em
cada workspace.

## Evolution

Configure pelo painel autenticado do aplicativo:

- `EVOLUTION_BASE_URL`
- `EVOLUTION_INSTANCE_NAME`
- `EVOLUTION_PHONE`
- `EVOLUTION_API_KEY`
- `EVOLUTION_WEBHOOK_SECRET`
- `AUTO_CREATE_WHATSAPP_CONTACTS`
- `DEFAULT_RESPONSE_SLA_MINUTES`

API key e webhook secret são variáveis secretas e não ficam disponíveis para
componentes front-end. Nunca grave token, senha, QR Code ou pairing code em
objetos do CRM, mensagens, logs, skills ou contexto MCP.

## Governança da IA

Scores e diagnósticos são apoio à decisão. Comunicação externa, mudança de
pipeline e intervenções consequenciais devem ser registradas como Ação de IA e
permanecer em `Aguardando aprovação` até confirmação humana explícita.

## Migração

O fluxo em `tools/diex-migration` importa um tenant legado por workspace com
prévia, checksum, ordem de dependências e upsert idempotente. A importação por
API key só funciona quando o operador habilita temporariamente
`DIEX_MIGRATION_API_ENABLED=true`; nenhuma credencial ou payload bruto entra no
pacote.
