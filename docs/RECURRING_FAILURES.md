# Falhas recorrentes e o padrão correto

Cada entrada aqui foi paga com um incidente. A ordem é por frequência medida no
histórico: das últimas 60 entregas, 41 foram correções, e sete classes explicam
25 delas.

Antes de dizer que terminou, rode `bash scripts/lint-changed.sh` e os dois
typechecks. `nx lint:diff-with-main` compara `main...HEAD` e não enxerga a árvore
de trabalho: em código não commitado ele imprime "No changed files" e passa
verde sobre o que nunca leu.

---

## 1. Guard mixin sem o módulo que o injeta (9 incidentes)

`SettingsPermissionGuard(...)` devolve um mixin que injeta `PermissionsService` e
é instanciado no contexto do módulo que declara o controller. Sem
`PermissionsModule` nos `imports` desse módulo, **a aplicação inteira** falha no
bootstrap com `UnknownDependenciesException` e um nome de classe em hash, que não
aponta para o arquivo culpado. Não é a rota que quebra, é o processo.

Ao adicionar um guard a um controller, confira os `imports` do `.module.ts` mais
próximo. Vale o mesmo para qualquer guard que injete serviço: `JwtAuthGuard`
precisa de `AuthModule` e `WorkspaceCacheStorageModule`.

Protegido por `src/engine/guards/__tests__/settings-permission-guard-wiring.spec.ts`.

## 2. Endpoint sem autorização declarada (5 incidentes)

Autenticar não é autorizar. Todo endpoint REST precisa de guard de permissão
explícito, mesmo quando a decisão é "qualquer membro pode": nesse caso declare
`@UseGuards(NoPermissionGuard)`, para que a escolha fique escrita e não implícita
na ausência.

Antes de escolher o guard, olhe o **tipo de retorno**. Se ele carrega segredo,
token, QR ou credencial, use o mesmo guard do endpoint irmão que já manipula
aquele dado. Dois endpoints que devolvem o mesmo tipo com permissões diferentes é
sempre bug.

Quando uma rota aberta compartilha o tipo de retorno com uma protegida, zere o
campo sensível no próprio controller. A garantia não pode depender do que um
serviço distante vai devolver no futuro.

Coberto por `diex(rest-api-methods-should-be-guarded)` e
`diex(graphql-resolvers-should-be-guarded)`.

## 3. Comando de upgrade fora do alcance do cursor (4 incidentes)

**Timestamp maior não basta.** `getUpgradeSequence` monta a sequência por versão
e, dentro de cada versão, na ordem fixa: todos os fast, depois todos os slow,
depois todos os workspace. O timestamp só ordena dentro de cada um desses três
grupos, nunca entre eles.

O cursor guarda o último comando tentado. Se a versão corrente já foi liberada
uma vez, o último comando tentado é um workspace command dela, e
`resolveStartCursor` devolve o início daquele segmento de workspace. Todo o bloco
de instance commands da versão fica **atrás** do cursor. Um instance command novo
acrescentado ali nunca é alcançado, e o upgrade ainda reporta sucesso, porque os
workspace commands rodam normalmente.

Foi exatamente assim que o `onboardingPrimaryChannel` não chegou em produção na
0.6.49, mesmo com o timestamp mais alto da 2.26.0 e o registro correto.

Regra: **instance command novo em versão que já rodou exige versão nova.**
`npx tsx scripts/bump-version.ts <versão>` no diex-server move a corrente para
`DIEX_PREVIOUS_VERSIONS` e cria a próxima. Workspace command acrescentado ao fim
da versão corrente continua sendo alcançado, porque o cursor para no início do
segmento, não no fim.

Registrar significa duas coisas: exportar a classe e acrescentá-la ao fim de
`instance-commands.constant.ts`. O `InstanceCommandProviderModule` espalha essa
constante, então a lista é a fonte da verdade.

Depois de subir, confirme no banco que o efeito existe. O log de upgrade dizendo
"N workspace(s) succeeded, 0 failed" não diz nada sobre instance commands.

## 4. Fast instance command com escrita de dados

`ALTER TABLE` e `UPDATE` na mesma transação seguram um `ACCESS EXCLUSIVE` na
tabela durante todo o backfill e travam as leituras enquanto o deploy roda.

Fast só altera schema. Qualquer backfill, normalização ou escrita em linha vai
para `runDataMigration()` de um slow command separado, com timestamp maior. A
única escrita permitida num fast é dentro do `down()`.

Coberto por `diex(no-data-mutation-in-fast-instance-command)`.

## 5. Campo GraphQL sem tipo resolvível (3 incidentes)

Toda propriedade exposta precisa de tipo explícito no decorator, e todo DTO
referenciado precisa estar definido antes do ponto de uso. Campos de id querem
`@Field(() => UUIDScalarType)`; sem isso o schema builder falha na subida, não em
tempo de query.

## 6. Identificador universal duplicado (2 incidentes)

Dois artefatos com o mesmo `universalIdentifier` bloqueiam a ativação de **todo**
workspace, não só do que introduziu a colisão. Antes de criar view, objeto padrão
ou artefato de arquitetura, procure o identificador no repositório inteiro.

## 7. Schema de structured output inválido (2 incidentes)

Em modo estrito, o schema vira JSON Schema antes de chegar ao modelo, e o
provedor rejeita a requisição inteira. Não use `.default()` nem `.min()`/`.max()`
em campo que entra no schema: valide a contagem com `.refine()`, que roda na
análise sem virar constraint.

`ZodRecord` não tem `.min`/`.max`. Encadear lança `TypeError` no carregamento do
módulo, e se o arquivo estiver no grafo de um provider o servidor não sobe.

Todo campo do schema é obrigatório em modo estrito. Se o prompt não pedir aquele
campo, o modelo trava em vez de errar: prompt e schema têm que concordar.

## 8. Ciclo de require entre módulos

Um ciclo derruba com `ReferenceError: Cannot access '...' before initialization`,
e a mensagem aponta o arquivo onde o ciclo fechou, não onde ele começou.
`forwardRef` resolve uma aresta por vez; frequentemente a próxima aparece logo em
seguida.

Server e worker entram no grafo em ordens diferentes, então um ciclo pode quebrar
um e deixar o outro limpo. Valide **os dois**:

```bash
npx nx start diex-server
npx nx run diex-server:worker
```

## 9. useRef que o linter acusa de estado

`diex(no-state-useref)` tem falso positivo legítimo: handle de `setTimeout`,
trava de reentrância e id de requisição para descartar resposta obsoleta são usos
corretos de ref, e convertê-los em estado cria loop de render ou closure obsoleto.

Nesses casos use `// oxlint-disable-next-line diex/no-state-useref` com uma linha
dizendo por quê. Há precedente no repositório. Só converta para estado quando o
valor de fato deveria renderizar.

## 10. Rota REST que morre sem deixar rastro

`RestApiExceptionFilter` transforma qualquer exceção não-HTTP em **400**, e
`shouldCaptureException` só captura a partir de 500. O resultado é que um
`TypeError` de verdade volta para o cliente como
`{"statusCode":400,"error":"TypeError","messages":["Cannot read properties of
undefined (reading 'slice')"]}` e **não aparece em log nenhum** — nem stack, nem
arquivo, nem linha.

Para achar a origem, adicione um `console.error(exception)` temporário no filtro,
reproduza, leia a stack e remova. Não confie no log do servidor para concluir que
uma rota REST está sã: ausência de erro no log não é sinal de sucesso.

Quatro defeitos ficaram escondidos assim na rota de prontidão do onboarding:
serviço que lê objeto de workspace sem `executeInWorkspaceContext`, `findOne`
sem `where` (o TypeORM recusa), `COALESCE(coluna_enum, '')` (o Postgres recusa o
`''` como valor do enum, use `::text`) e campo composto lido como JSON quando ele
é persistido em duas colunas (`amountAmountMicros`, `amountCurrencyCode`).

Ao escrever serviço que usa `globalWorkspaceOrmManager.getRepository`, verifique
quem estabelece o contexto de ORM. O pipeline REST **não** estabelece: quem lê
objeto de workspace precisa envolver a própria leitura em
`executeInWorkspaceContext(fn, buildSystemAuthContext(workspaceId))`.
