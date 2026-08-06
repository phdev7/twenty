# Arquiteto de Workspace — Documentação Técnica e Operacional

## Visão Geral

O **Arquiteto de Workspace** é um agente autônomo e supervisionado especialista em infraestrutura, onboarding e evolução contínua de workspaces no **Diex CRM**. Ele interpreta descrições operacionais em linguagem natural, extrai um perfil canônico (`WorkspaceOperationProfile`), combina templates declarativos (`WorkspaceBlueprint`), calcula diffs seguros (`WorkspaceChangeSet`), solicita aprovação explícita e publica a estrutura sobre os metadados nativos do Twenty.

---

## Princípio Arquitetural dos Três Estados

Para garantir segurança, auditabilidade e isolamento entre workspaces, o sistema separa rigorosamente três estados:

1. **Estado Recomendado**: O que a IA sugere (Artefatos `OPERATION_PROFILE` e `BLUEPRINT` em status `AWAITING_APPROVAL`).
2. **Estado Aprovado**: O que o usuário autorizou expressamente (`CHANGE_SET` com status `APPROVED`).
3. **Estado Publicado**: Os metadados aplicados no banco PostgreSQL e no cache de entidades nativo do Twenty (`STATUS: ACTIVE`).

### Fluxo Obrigatório
`INSPEÇÃO → PROPOSTA → VALIDAÇÃO → PREVIEW → APROVAÇÃO → APLICAÇÃO → VERIFICAÇÃO → PUBLICAÇÃO`

---

## Estrutura de Contratos Canônicos

### 1. WorkspaceOperationProfile
Representa o perfil operacional extraído da resposta do cliente à pergunta *"Descreva sua operação atualmente:"*.

### 2. Catálogo Declarativo de Templates
- **Base Universal**: `diex.base.universal` (Pessoas, Empresas, Oportunidades, Tarefas, Agenda, Inbox, Contexto de IA, Atividades, Dashboard Executivo, Roles).
- **Modelos de Negócio (8)**: Agência, SaaS, Imobiliária, Consultoria, Serviços recorrentes, Vendas B2B, Franquia, Customer Success.
- **Pacotes Operacionais (11)**: Prospecção, Pré-vendas, Comercial, Implantação, Entrega, Atendimento, CS, Renovação, Cobrança, Governança de IA, Multiunidade.
- **Variações de Escala (4)**: Operação individual, Pequena equipe, Múltiplas equipes, Múltiplas unidades.

### 3. WorkspaceBlueprint
Consolida os templates selecionados, justificativas de confiança, objetos recomendados, visões, dashboards e contexto de IA.

### 4. WorkspaceChangeSet
Representa o conjunto auditável e versionado de operações (`CREATE`, `UPDATE`, `NO_CHANGE`). Operações destrutivas (`ARCHIVE`, `DELETE`) são bloqueadas pela engine de segurança.

---

## Ferramentas de IA Interna e Paridade MCP (14 Ferramentas)

A IA interna e clientes MCP externos (Codex, Claude, ChatGPT, controle por voz) utilizam a mesma camada de serviço (`WorkspaceArchitectureToolWorkspaceService`):

1. `inspect_workspace_architecture`
2. `list_workspace_templates`
3. `extract_workspace_operation_profile`
4. `recommend_workspace_blueprint`
5. `compare_workspace_blueprint`
6. `validate_workspace_change_set`
7. `preview_workspace_change_set`
8. `approve_workspace_change_set`
9. `apply_workspace_change_set`
10. `get_workspace_setup_readiness`
11. `get_workspace_blueprint_history`
12. `rollback_workspace_blueprint_version`
13. `update_workspace_ai_context`
14. `explain_workspace_recommendation`

---

## Pipeline de Fine-Tuning e Avaliações Offline

### Privacidade e Sanitização (PII Redaction)
Antes da exportação, qualquer dado sensível é filtrado:
- E-mails (`[EMAIL_REDACTED]`)
- Telefones (`[PHONE_REDACTED]`)
- Segredos, chaves e tokens (`[SECRET_REDACTED]`)
- UUIDs reais substituídos por hashes determinísticos.

### Pipeline de Execução (`WorkspaceFineTuningService`)
1. Coleta de exemplos aprovados.
2. Sanitização PII.
3. Validação de schema.
4. Deduplicação e versionamento do dataset.
5. Estimativa de tokens e custo.
6. Apresentação prévia ao usuário para aprovação financeira antes de disparar jobs pagos.
7. Avaliações offline de groundedness, segurança contra exclusão, compliance de permissões e idempotência.
8. Registro do modelo no AI Model Registry com fallback automático para `diex-default-smart`.

---

## Prontidão Central ("Primeiros passos")

O cálculo de prontidão centralizado em `WorkspaceArchitectureService.getSetupReadiness`:
- Acompanha a aprovação do blueprint, publicação da estrutura, conectividade de canais (WhatsApp e E-mail) e convite de membros.
- Quando atinge 100%, exibe o popup `Seu CRM está pronto`.
- Oculta "Primeiros passos" do menu lateral e permite reabertura por Administradores em Configurações.
