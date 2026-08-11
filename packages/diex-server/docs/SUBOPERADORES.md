# Inventário de suboperadores

Levantado a partir do código em 2026-08-10. Serve de insumo para o DPA e para a
definição da base de transferência internacional.

Como ler: **Ativo** significa que a variável de ambiente correspondente está
provisionada nos apps de produção e o caminho existe no código. **Depende de
configuração** significa que o código suporta, mas a ativação não é verificável
sem revelar o valor das variáveis, o que despejaria segredos no transcript.
Confirme os marcados assim antes de publicar o inventário.

## Recebem dado pessoal

| Suboperador | Papel | Dado que chega | Onde se configura | Status |
|---|---|---|---|---|
| Provedor de modelo de IA | Geração de texto, copiloto, arquiteto de workspace | Conteúdo de conversa do inbox, contexto do workspace, descrição da operação | `OPENAI_API_KEY`, `AI_MODELS_DEFAULT_FAST`, `AI_MODELS_DEFAULT_SMART` | Ativo (OpenAI) |
| Armazenamento S3 | Anexos, avatares e mídia de WhatsApp | Arquivo enviado pelo titular, incluindo imagem | `STORAGE_TYPE`, `STORAGE_S3_*` | Ativo |
| Servidor SMTP | Envio de e-mail transacional e convite | Endereço do destinatário e corpo da mensagem | `EMAIL_DRIVER`, `EMAIL_SMTP_*` | Ativo |
| Evolution API | Canal de WhatsApp | Mensagens nos dois sentidos, número de telefone, mídia | `DIEX_EVOLUTION_SERVER_BASE_URL`, `_API_KEY`, `_WEBHOOK_SECRET` | Ativo |
| Google APIs | Login e, se habilitado, sincronização de e-mail e agenda | Credencial OAuth; com sync ativo, conteúdo de e-mail e evento | `AUTH_GOOGLE_*`, `MESSAGING_PROVIDER_GMAIL_ENABLED`, `CALENDAR_PROVIDER_GOOGLE_ENABLED` | Auth ativo; sync depende de configuração |
| AWS Lambda | Execução de logic function, driver `lambda` | O que a função processar | `LOGIC_FUNCTION_TYPE` | Depende de configuração |
| E2B | Sandbox do interpretador de código | O que o código processar | driver do code interpreter | Depende de configuração |
| Microsoft APIs | Login e sincronização | Credencial; com sync, e-mail e agenda | `AUTH_MICROSOFT_*`, `MESSAGING_PROVIDER_MICROSOFT_ENABLED` | Depende de configuração |

Provedores de modelo suportados no código: `openai`, `anthropic`, `google`,
`mistral`, `xai`. Só o primeiro tem chave provisionada em produção. Trocar o
modelo padrão troca o suboperador, e é uma mudança de configuração, não de
código: o inventário precisa ser revisto quando isso acontecer.

## Não recebem dado pessoal

| Fornecedor | Papel | Observação |
|---|---|---|
| Hostinger | DNS e desafio ACME do certificado | Token em `HOSTINGER_API_TOKEN`; trafega domínio, não dado de titular |
| GHCR | Registro da imagem de container | Artefato de build |
| Coolify e VPS | Orquestração e hospedagem | Postgres e Redis rodam aqui, autohospedados; não são terceiros |

## O ponto que decide o nicho médico

Duas rotas levam dado sensível para fora sem que ninguém precise decidir nada no
dia a dia:

O **conteúdo de conversa do inbox** vai para o provedor de modelo sempre que uma
função de IA roda. Numa clínica, é onde a paciente descreve sintoma e motivo da
consulta.

A **mídia de WhatsApp** vai para o S3. Numa clínica, é onde chega foto.

Nenhum dos dois é opcional hoje na experiência do produto, e os dois são
transferência internacional de dado sensível na configuração atual. Antes de
vender para o nicho, decida se quer poder fixar região e provedor por workspace,
e se quer permitir desligar IA sem quebrar o produto. É requisito de produto,
não de conformidade apenas.

## Manutenção

O inventário desatualiza sozinho por mudança de variável de ambiente, sem commit
nenhum. Duas defesas baratas: revisar esta lista a cada release que toque
`config-variables.ts`, e tratar a troca de `AI_MODELS_DEFAULT_*` como mudança que
exige atualizar o DPA, porque troca a parte contratada.
