# Diex CRM

Aplicativo oficial da camada comercial Diex sobre o núcleo Twenty.

## Capacidades

- catálogo de ofertas e playbooks;
- aderência ao ICP, papel de compra e intenção;
- score comercial explicável e próxima ação;
- sinais de intenção, objeção, risco, expansão e churn;
- planos e marcos de Customer Success;
- saúde de carteira e pressão de renovação;
- fila de ações propostas pela IA com aprovação, executor interno seguro e
  recibo;
- agentes e skills especializados em vendas e CS;
- inbox comercial ligado aos registros nativos do CRM;
- e-mail Gmail, Microsoft ou IMAP/SMTP nativo do Twenty espelhado na Inbox,
  com vínculo automático a pessoa, empresa e oportunidade e resposta por
  prévia confirmada;
- respostas prontas por workspace com atalho, variáveis CRM e rastreio de uso;
- etiquetas comerciais configuráveis, filtráveis e ligadas ao histórico da
  conversa;
- distribuição de conversas por equipe e responsável, com filas, membros, SLA
  próprio, roteamento manual ou por menor carga e filtros diretos na Inbox;
- filas de atenção para não lidas, SLA estourado, prioridade alta ou urgente e
  follow-up vencido, com prioridade editável no contexto;
- criação e conclusão de próxima ação dentro da conversa, com prazo,
  responsável e vínculo nativo à pessoa, empresa e oportunidade;
- menções estruturadas em notas internas, com alerta pessoal, leitura,
  resolução e trilha auditável por conversa e usuário;
- macros comerciais configuráveis com prévia, status, prioridade, equipe,
  responsável, etiqueta, nota interna e resposta pronta como rascunho;
- automações comerciais por nova conversa ou mensagem recebida, com condições
  de canal, palavras-chave e vínculo CRM, distribuição, prioridade, etiqueta,
  follow-up, tarefa, nota interna, idempotência e auditoria;
- linha do tempo operacional com eventos estruturados de status, prioridade,
  roteamento, etiquetas, tarefas, macros, menções e triagem de IA;
- adiamento com prazo, reabertura por vencimento e reativação por nova
  mensagem;
- cockpit de inteligência comercial com radar de sinais, ranking de
  oportunidades e fila acionável.
- Centro de IA com fila de decisão, evidências, contexto do CRM, aprovação
  humana e execução confirmada como tarefa nativa, com prazo, responsável,
  vínculos CRM, idempotência e trilha de auditoria.
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

### Menções internas

No modo `Nota interna`, digite `@` e selecione os usuários responsáveis. A
nota permanece privada no CRM e cada pessoa selecionada recebe uma pendência
individual em `Minhas menções`. Abrir a conversa registra a leitura; o botão
`Resolver` encerra somente a pendência daquele usuário sem remover a nota ou o
histórico.

Cada menção mantém vínculo com a conversa, a nota, o autor, o usuário
mencionado e as datas de criação, leitura e resolução. A visão
`Diex > Menções da inbox` fornece a trilha operacional completa.

### Macros comerciais

Cadastre em `Diex > Macros da inbox`. Cada macro pode combinar status,
prioridade, equipe, responsável, etiqueta, nota interna contextual e uma
resposta pronta. A macro pode ser limitada por canal e acompanha quantidade e
data do último uso.

Na conversa, selecione a macro e abra a prévia. A aplicação consolida as
mudanças internas e prepara a resposta como rascunho; nunca envia comunicação
externa automaticamente. Variáveis sem valor bloqueiam a nota interna e
continuam visíveis no rascunho para revisão antes da prévia de envio.

### Histórico operacional

A conversa intercala mensagens e eventos em ordem cronológica. Mudanças de
status, prioridade, equipe, responsável, etiqueta, adiamento, tarefas, macros,
menções e triagens de IA registram autor, data, resumo e detalhes.

A visão `Diex > Histórico da inbox` permite auditoria transversal por conversa
sem depender de texto solto em notas internas. Falha ao registrar o evento não
é ocultada: a ação concluída retorna aviso para revisão operacional.

### Automações comerciais

Cadastre em `Diex > Automações da inbox`. Cada regra escolhe o gatilho `Nova
conversa` ou `Nova mensagem recebida`, canal, palavras-chave, condição de
vínculo CRM e a exigência de conversa sem responsável. Regras ativas são
avaliadas pela ordem configurada e podem interromper a cadeia após aplicar.
Novas regras nascem inativas e só entram em operação após ativação explícita.

As ações disponíveis são status, prioridade, equipe, responsável, etiqueta,
prazo de follow-up, tarefa vinculada à pessoa, empresa e oportunidade e nota
interna contextual. Os templates aceitam variáveis como `{{contact.name}}`,
`{{company.name}}`, `{{opportunity.name}}`, `{{conversation.name}}` e
`{{message.body}}`.

Cada execução cria antes uma chave idempotente no histórico da conversa. Isso
evita tarefas e notas duplicadas em reentregas do webhook ou nova
sincronização. Falhas ficam registradas no mesmo evento e não bloqueiam a
entrada da mensagem. Automações nunca enviam comunicação externa; WhatsApp e
e-mail continuam exigindo prévia e confirmação humana.

### Executor interno da IA

Em `Diex > Centro de IA`, propostas aprovadas dos tipos qualificação,
follow-up, mitigação de risco, intervenção de CS e expansão podem virar uma
tarefa nativa do Twenty. Propostas de atualização de pipeline podem mover uma
única oportunidade entre etapas reais configuradas no workspace. Primeiro o
operador gera a prévia; depois confirma a tarefa exata ou a transição exata de
origem para destino.

A confirmação é individual, vinculada ao workspace, expira em dez minutos e é
consumida uma única vez. A tarefa possui identificador determinístico para
evitar duplicidade e a ação registra executor, data, tarefa e recibo.

Respostas externas continuam obrigatoriamente no fluxo de prévia e confirmação
da Inbox. A mudança de pipeline usa atualização condicional: se outra operação
alterar a etapa depois da prévia, a execução é recusada e deve ser revisada
novamente. Texto livre aprovado nunca define sozinho a oportunidade ou a etapa.

### E-mail nativo na Inbox

Conecte Gmail, Microsoft ou IMAP/SMTP pelas contas nativas do Twenty, habilite
a sincronização e defina a visibilidade do canal como `Compartilhar tudo`.
Depois, use `Sincronizar e-mail` no cabeçalho da Inbox. Somente canais
explicitamente compartilhados são espelhados.

Cada thread vira uma conversa `EMAIL / TWENTY_EMAIL` de forma idempotente. A
Inbox reaproveita participantes e vínculos nativos para conectar pessoa,
empresa e oportunidade, preserva direção, assunto, corpo, datas e
identificadores do provedor e reabre a conversa quando chega uma nova
mensagem.

O envio exige uma prévia com destinatário, assunto e corpo. A confirmação usa
a conta nativa disponível ao usuário atual e volta a sincronizar o histórico.
Credenciais, tokens e segredos permanecem no núcleo autenticado do Twenty e
não entram nos registros da aplicação nem no MCP.

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

`Diex > Renovações` usa uma esteira horizontal de retenção com seis etapas,
forecast ponderado, receita sob risco, prazo, probabilidade e próxima ação.
Cada caso nasce de um plano de sucesso e herda empresa, responsável, valor,
data e risco. O operador pode registrar contatos, atualizar negociação,
fechar como renovada ou churn com motivo obrigatório e consultar o histórico
por autor. A IA cria somente uma intervenção pendente de aprovação no Centro
de IA.

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

## MCP

Em `Configurações > MCP & APIs > MCP`, a Central MCP verifica o endpoint ao
vivo, HTTPS e a existência de uma chave ativa. Clientes com OAuth usam a
configuração sem segredo e concluem o login no navegador. Clientes sem OAuth
podem criar uma chave com o papel `Diex CRM function role` pré-selecionado.

A chave é exibida uma única vez dentro do painel autenticado, junto da
configuração completa para cópia. O token não entra na URL, em objetos do CRM,
nos logs ou no pacote do aplicativo.

## Migração

O fluxo em `tools/diex-migration` importa um tenant legado por workspace com
prévia, checksum, ordem de dependências e upsert idempotente. A importação por
API key só funciona quando o operador habilita temporariamente
`DIEX_MIGRATION_API_ENABLED=true`; nenhuma credencial ou payload bruto entra no
pacote.
