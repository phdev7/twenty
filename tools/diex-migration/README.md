# Migração Diex CRM para Diex Diex

Este fluxo migra um `team_id` do CRM Laravel para um único workspace Diex.
Ele não exporta credenciais de canais, tokens, segredos, payloads brutos de
provedor, usuários apagados ou registros apagados.

## Ordem operacional

1. Instale a aplicação Diex no workspace Diex de destino.
2. Crie uma API key exclusiva do workspace para a janela de migração.
3. Ative temporariamente `DIEX_MIGRATION_API_ENABLED=true` no servidor e no
   worker Diex.
4. Exporte o tenant legado:

   ```bash
   SOURCE_DATABASE_URL='postgresql://...' \
   SOURCE_TEAM_ID='01...' \
   ./tools/diex-migration/export.sh /caminho/seguro/diex-export
   ```

5. Execute a prévia. Ela consulta o destino, mas não grava:

   ```bash
   DIEX_API_URL='https://crm.bydiex.com' \
   DIEX_FUNCTIONS_URL='https://funcoes-do-app-diex.exemplo' \
   DIEX_API_KEY='...' \
   node ./tools/diex-migration/import.mjs /caminho/seguro/diex-export
   ```

6. Corrija qualquer erro ou relação não resolvida. Só então aplique:

   ```bash
   DIEX_API_URL='https://crm.bydiex.com' \
   DIEX_FUNCTIONS_URL='https://funcoes-do-app-diex.exemplo' \
   DIEX_API_KEY='...' \
   DIEX_MIGRATION_CONFIRM='01...' \
   node ./tools/diex-migration/import.mjs /caminho/seguro/diex-export --apply
   ```

7. Repita a prévia. O resultado esperado passa de `creates` para `updates`,
   provando a idempotência sem duplicação.
8. Revogue a API key e remova `DIEX_MIGRATION_API_ENABLED` do servidor e do
   worker.

Se o app expuser uma URL completa para a função, use
`DIEX_MIGRATION_ROUTE_URL`. `DIEX_FUNCTIONS_URL` é preferida ao fallback
legado `/s`.

O workspace é vinculado ao primeiro `SOURCE_TEAM_ID` aplicado. Um tenant
legado diferente é rejeitado. Conversas antigas entram como provedor `MANUAL`;
isso preserva o histórico sem permitir que uma thread externa antiga seja usada
acidentalmente para envio.

Usuários e responsáveis não são criados automaticamente. Convites e associação
de proprietários devem ser feitos no workspace de destino depois da importação,
evitando recriar contas, permissões ou acessos antigos sem validação.

Para repetir apenas uma entidade:

```bash
node ./tools/diex-migration/import.mjs /caminho/seguro/diex-export --only=companies
```

Entidades válidas: `companies`, `people`, `offers`, `opportunities`, `tasks`,
`notes`, `successPlans`, `successMilestones`, `commercialSignals`,
`inboxConversations`, `inboxMessages` e `aiActions`.
