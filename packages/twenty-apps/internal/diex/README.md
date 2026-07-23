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
  conversa.

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
