# Infraestrutura oficial do Diex CRM

## Decisão

O Twenty passa a ser o único core do CRM. Chatwoot e o Diex CRM Laravel são
fontes de produto e migração, não runtimes permanentes.

A topologia de produção é:

- `server`: web/API, migrações e registro de cron;
- `worker`: filas, automações, IA e funções;
- PostgreSQL 16 dedicado;
- Redis 7 dedicado e sem exposição pública;
- armazenamento S3 compatível;
- Evolution API existente, acessada somente por origin autorizada;
- capacidades nativas do Diex CRM entregues pela mesma imagem e disponíveis em
  todos os workspaces.

Isso substitui os três processos Laravel atuais (`app`, `horizon`,
`scheduler`) por dois processos Twenty. PostgreSQL e Redis continuam
separados do runtime e cada ambiente mantém recursos próprios.

## Evidência do ambiente atual

Em 23 de julho de 2026, produção e homologação do Diex CRM estavam saudáveis
no Coolify. Produção usava três aplicações Laravel, PostgreSQL 16 e Redis 7.
O PostgreSQL possuía backup local a cada seis horas, retenção de 28 cópias por
14 dias e nenhuma cópia S3. A aplicação não possuía storage persistente
declarado no Coolify.

O novo stack corrige os dois riscos operacionais principais:

1. arquivos deixam de depender do filesystem do container e passam para S3;
2. backup do PostgreSQL precisa ter segunda cópia externa, não apenas no host
   do Coolify.

## Ambientes

### Homologação

- domínio inicial: `next-crm.bydiex.com`;
- PostgreSQL, Redis, bucket e chave de criptografia exclusivos;
- capacidades nativas disponíveis no workspace de homologação;
- Evolution com instância exclusiva;
- sem acesso ao banco de produção.

### Produção

- domínio final: `crm.bydiex.com`;
- recursos exclusivos e tags de imagem imutáveis;
- criação de workspace limitada a administradores do servidor;
- múltiplos workspaces habilitados com isolamento nativo do Twenty;
- backup PostgreSQL a cada seis horas, retenção local de 14 dias e cópia S3
  de pelo menos 30 dias.

Nunca reutilizar banco, Redis, bucket, `ENCRYPTION_KEY`, instância Evolution
ou API key entre ambientes.

## Endereçamento multi-tenant

Com `IS_MULTIWORKSPACE_ENABLED=true`, o Twenty resolve o tenant pelo
subdomínio. Não existe modo multiworkspace em host único: cada workspace passa
a responder em `{subdomain}.${SERVER_HOST}` e o padrão da instância em
`${DEFAULT_SUBDOMAIN}.${SERVER_HOST}`.

Isso impõe três pré-requisitos, nesta ordem:

1. **DNS**: registro wildcard `*.${SERVER_HOST}` apontando para o host do
   Coolify, além do registro do próprio `${SERVER_HOST}`.
2. **Certificado**: SAN wildcard `*.${SERVER_HOST}`, que só pode ser emitido
   pelo desafio DNS-01. O resolver do Traefik precisa estar configurado com
   credencial do provedor de DNS e ser informado em `DIEX_CERT_RESOLVER`. O
   desafio HTTP-01 padrão do Coolify não emite wildcard.
3. **Subdomínio do workspace existente**: antes de ligar a flag, confirmar em
   qual `subdomain` o workspace atual está gravado — é por ele que o acesso
   passará a acontecer.

Ligar a flag antes de 1 e 2 deixa a instância inacessível: o login redireciona
para `${DEFAULT_SUBDOMAIN}.${SERVER_HOST}`, que não resolve. Por isso o Compose
mantém `false` como padrão quando a variável não é declarada.

`SERVER_HOST_REGEX` repete `SERVER_HOST` com os pontos escapados e alimenta o
`HostRegexp` do Traefik. Sem o escape, o ponto casaria qualquer caractere e o
router aceitaria hostnames de terceiros.

## Implantação no Coolify

1. Publicar uma imagem imutável pelo pipeline de imagem do servidor.
2. Criar PostgreSQL 16 e Redis 7 dedicados no ambiente alvo.
3. Criar um serviço Docker Compose usando
   `deploy/coolify/docker-compose.yml`.
4. Cadastrar as variáveis de `.env.example` diretamente no Coolify.
   Homologação pode iniciar com o volume local persistente declarado no
   Compose; produção continua obrigada a usar S3.
5. Expor apenas o serviço `server` na porta 3000.
   O Compose cria os routers Traefik a partir de `SERVER_HOST`,
   `SERVER_HOST_REGEX` e `DIEX_PROXY_ROUTER`, cobrindo o host raiz e os
   subdomínios de tenant; na homologação, manter `noindex`.
6. Habilitar health check em `/healthz`.
7. Criar backup do banco a cada seis horas com cópia S3.
8. Confirmar nos logs que o servidor iniciou corretamente; nenhuma API key ou
   instalação manual é necessária.

O arquivo de exemplo contém placeholders, nunca credenciais reais.

### Primeiro workspace

1. O administrador cria a primeira conta e o primeiro workspace diretamente
   em `next-crm.bydiex.com`.
2. O servidor inicializa o conjunto nativo de capacidades e o workspace já
   nasce completo, sem instalação de aplicativo.
3. Confirma no workspace os objetos e as páginas `Inbox Comercial`,
   `Inteligência Comercial`, `Governança de IA`, `Customer Success` e
   `Renovações`.
4. API keys continuam sendo criadas somente para integrações e MCP, nunca para
   instalar o próprio produto.

### Proteção da homologação

A homologação não usa Basic Auth no proxy. O controle de acesso fica no próprio
Twenty, evitando disputa pelo cabeçalho `Authorization` usado por API keys,
publicação do app e MCP. O Traefik mantém HTTPS e `noindex`.

Webhooks do provedor validam segredo exclusivo; a rota de migração exige API
key, flag temporária e vínculo imutável entre `team_id` e workspace. Não
desabilite essas validações para facilitar integrações.

## Migração do CRM anterior

O fluxo operacional está em `tools/diex-migration`. A rota de importação exige
autenticação, começa em prévia, limita lotes, vincula o workspace ao primeiro
`team_id` aplicado e usa IDs legados únicos. Para uso por API key,
`DIEX_MIGRATION_API_ENABLED=true` deve existir somente durante a janela de
migração. Depois do aceite, a chave deve ser revogada e a variável removida.

## Regra de release

- Imagem: usar tag de release ou SHA, nunca `latest`.
- **Publicar a imagem não implanta nada.** O processo de publicação só envia a
  tag para o GHCR; enquanto `DIEX_IMAGE_TAG` no Coolify não for atualizado
  para essa tag, o redeploy reinstala a imagem anterior e o ambiente segue
  idêntico. Toda entrega termina com o passo de verificação abaixo.
- Verificação obrigatória após cada deploy:
  `curl -s https://${SERVER_HOST}/client-config | grep -o '"appVersion":"[^"]*"'`
  O valor precisa ser igual à tag publicada, sem o prefixo `diex-v`. Se
  divergir, a implantação não aconteceu — não investigar o código antes de
  fechar essa diferença.
- Metadados nativos: aumentar o `version` antes de cada imagem que altere
  objetos, campos ou rotas.
- Banco: apenas o `server` executa migrações.
- Worker: inicia somente depois do health check do `server`.
- Cutover: somente depois de backup final, delta de migração e aceite
  operacional.

## Cutover e rollback

1. Manter `crm.bydiex.com` apontando para o Laravel durante a migração.
2. Migrar snapshot para o Twenty em homologação.
3. Abrir uma janela curta de escrita no legado, gerar backup final e importar
   o delta.
4. Trocar o domínio para o `server` Twenty.
5. Manter o Laravel parado, mas recuperável, por sete dias.
6. Em falha crítica, restaurar o domínio para o legado e reabrir escrita
   somente após reconciliar o delta produzido no Twenty.
7. Após o aceite, manter o banco legado em modo arquivado por 30 dias antes
   de qualquer remoção.

O rollback não reutiliza o banco Twenty no Laravel nem o banco Laravel no
Twenty.
