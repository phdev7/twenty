# Instruções obrigatórias do repositório Diex

## Forma de trabalho

- Comece respostas ao Pedro pelo nome dele.
- Seja direto, sério, econômico em tokens e focado em resultado comercial.
- Não crie nem execute testes sem pedido explícito do Pedro.
- Preserve alterações de outros agentes e coordene mudanças pelo estado real do worktree.

## Compatibilidade de workspaces existentes

- Trate todo workspace existente como tenant em produção. Nova feature não pode inutilizar dados, páginas, menus, integrações ou fluxos já usados.
- Prefira mudanças aditivas, contratos compatíveis e leitura segura de dados legados. Não transforme ausência de dado novo em erro de execução.
- Nunca preencha silenciosamente uma nova resposta comercial nem marque requisito novo como concluído por valor padrão, inferência ou simples deploy.
- O uso atual deve continuar disponível. Bloqueie apenas a operação que realmente exige o novo dado por segurança ou integridade; a prontidão pode ficar abaixo de 100% até a adoção.

## Atualizações importantes do produto

- Toda feature importante que exija ação, decisão, configuração ou dado novo do workspace deve possuir uma entrada versionada em `workspace-product-update-registry.constant.ts`.
- Trate o registro como histórico: use uma chave nova para cada lançamento relevante e não altere silenciosamente o critério de uma versão já publicada.
- A entrada deve informar: versão, data, importância, impacto em receita, ação necessária, rota de resolução, critério de conclusão e se bloqueia o readiness.
- Workspaces anteriores ao lançamento devem receber aviso administrativo visível. Workspaces novos devem receber o mesmo item como requisito do onboarding.
- Requisitos obrigatórios pendentes devem integrar a fonte canônica de readiness. O sistema nunca pode exibir onboarding 100% ou “pronto” sem evidência real de conclusão.
- Aviso lido não conclui requisito de dados. Apenas evidência persistida ou a ação explícita definida no registro pode concluir a atualização.
- Frontend, IA, MCP e automações devem consumir a mesma fonte de estado; não duplique regras de conclusão em telas isoladas.
- Mudanças estruturais recomendadas pela IA continuam separadas da publicação e exigem aprovação explícita do administrador.
- Uma feature importante só está concluída quando inclui sua estratégia de adoção para workspaces existentes ou uma justificativa explícita, no código, de que não exige aviso nem ação.
