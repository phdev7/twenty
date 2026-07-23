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
- app privado `diex` publicado e instalado no workspace após o core estar
  saudável.

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
- app Diex publicado no workspace de homologação;
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

## Implantação no Coolify

1. Publicar uma imagem imutável pelo workflow `Diex CRM image`.
2. Criar PostgreSQL 16 e Redis 7 dedicados no ambiente alvo.
3. Criar um serviço Docker Compose usando
   `deploy/coolify/docker-compose.yml`.
4. Cadastrar as variáveis de `.env.example` diretamente no Coolify.
5. Expor apenas o serviço `server` na porta 3000.
6. Habilitar health check em `/healthz`.
7. Criar backup do banco a cada seis horas com cópia S3.
8. Publicar e instalar o app privado `packages/twenty-apps/internal/diex`
   pelo workflow `Diex app release`.

O arquivo de exemplo contém placeholders, nunca credenciais reais.

## Migração do CRM anterior

O fluxo operacional está em `tools/diex-migration`. A rota de importação exige
autenticação, começa em prévia, limita lotes, vincula o workspace ao primeiro
`team_id` aplicado e usa IDs legados únicos. Para uso por API key,
`DIEX_MIGRATION_API_ENABLED=true` deve existir somente durante a janela de
migração. Depois do aceite, a chave deve ser revogada e a variável removida.

## Regra de release

- Imagem: usar tag de release ou SHA, nunca `latest`.
- App Diex: aumentar o `version` antes de cada publicação.
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
